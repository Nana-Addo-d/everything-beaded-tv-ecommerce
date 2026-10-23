-- Preserve the actual option and included pieces purchased, independently of later edits.
alter table public.order_items add column product_snapshot jsonb not null default '{}';
create function public.snapshot_order_item() returns trigger language plpgsql security invoker set search_path = '' as $$
declare product public.products;
begin
  select * into strict product from public.products where slug = new.slug;
  new.product_snapshot := jsonb_strip_nulls(jsonb_build_object(
    'image', product.images->>0,
    'optionLabel', product.attributes->>'optionLabel',
    'sizeLabel', product.attributes->>'sizeLabel',
    'dimensions', product.attributes->>'dimensions',
    'contents', product.attributes->>'contents'));
  return new;
end;
$$;
create trigger order_item_snapshot before insert on public.order_items for each row execute function public.snapshot_order_item();

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  status text not null,
  fulfillment_status text not null,
  created_at timestamptz not null default now()
);
create index order_events_order_time on public.order_events(order_id, created_at);
create index orders_guest_history on public.orders(access_hash, created_at desc, id desc);
alter table public.order_events enable row level security;
revoke all on public.order_events from public, anon, authenticated;
grant select, insert on public.order_events to service_role;

create function public.guard_order_fulfillment() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.fulfillment_status is distinct from old.fulfillment_status then
    if not ((old.fulfillment_status = 'unfulfilled' and new.fulfillment_status = 'preparing' and new.status = 'paid')
      or (old.fulfillment_status = 'preparing' and new.fulfillment_status = 'dispatched' and new.status = 'paid')
      or (old.fulfillment_status = 'dispatched' and new.fulfillment_status = 'delivered' and new.status = 'paid')) then
      raise exception 'FULFILLMENT_TRANSITION';
    end if;
    if new.fulfillment_status = 'dispatched' and (new.dispatched_at is null or length(trim(coalesce(new.tracking_number,''))) < 2) then
      raise exception 'TRACKING_REQUIRED';
    end if;
    if new.fulfillment_status = 'delivered' and (new.delivered_at is null or new.delivered_at < new.dispatched_at) then
      raise exception 'DELIVERY_DATE_REQUIRED';
    end if;
    if new.fulfillment_status = 'dispatched' and exists(select 1 from public.order_requests where order_id = new.id and kind in ('cancellation','return','damaged') and status <> 'closed') then
      raise exception 'ORDER_REQUEST_REVIEW';
    end if;
  end if;
  return new;
end;
$$;
create function public.record_order_event() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status or new.fulfillment_status is distinct from old.fulfillment_status then
    insert into public.order_events(order_id,status,fulfillment_status) values(new.id,new.status,new.fulfillment_status);
  end if;
  return new;
end;
$$;

create table public.order_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  idempotency_key uuid not null,
  kind text not null check(kind in ('question','cancellation','return','damaged')),
  message text not null check(length(message) between 10 and 2000),
  status text not null default 'submitted' check(status in ('submitted','reviewing','closed')),
  reply text not null default '' check(length(reply) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id,idempotency_key),
  check(status <> 'closed' or length(trim(reply)) >= 3)
);
create index order_requests_open on public.order_requests(status,created_at) where status <> 'closed';
alter table public.order_requests enable row level security;
revoke all on public.order_requests from public, anon, authenticated;
grant select,insert,update on public.order_requests to service_role;

create function public.touch_order_request() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.order_id <> old.order_id or new.idempotency_key <> old.idempotency_key or new.kind <> old.kind or new.message <> old.message then
    raise exception 'REQUEST_IMMUTABLE';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger order_request_updated before update on public.order_requests for each row execute function public.touch_order_request();
create trigger order_fulfillment_guard before update on public.orders for each row execute function public.guard_order_fulfillment();
create trigger order_event_record after insert or update on public.orders for each row execute function public.record_order_event();

create function public.request_order_support(p_order uuid,p_access text,p_kind text,p_message text,p_key uuid)
returns public.order_requests language plpgsql security invoker set search_path = '' as $$
declare purchase public.orders; existing public.order_requests; result public.order_requests;
begin
  select * into purchase from public.orders where id=p_order and access_hash=p_access for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  select * into existing from public.order_requests where order_id=p_order and idempotency_key=p_key;
  if found then
    if existing.kind <> p_kind or existing.message <> p_message then raise exception 'SUPPORT_CONFLICT'; end if;
    return existing;
  end if;
  if p_kind is null or p_kind not in ('question','cancellation','return','damaged') or p_message is null or length(trim(p_message)) not between 10 and 2000 or p_key is null then raise exception 'INVALID_SUPPORT_MESSAGE'; end if;
  if p_kind in ('return','damaged') and purchase.status <> 'paid' then raise exception 'SUPPORT_ORDER_STATE'; end if;
  if (select count(*) from public.order_requests where order_id=p_order and status <> 'closed') >= 3
    or (select count(*) from public.order_requests where order_id=p_order and created_at > now()-interval '24 hours') >= 10 then raise exception 'SUPPORT_LIMIT'; end if;
  insert into public.order_requests(order_id,idempotency_key,kind,message) values(p_order,p_key,p_kind,p_message) returning * into result;
  return result;
end;
$$;
revoke all on function public.snapshot_order_item(),public.guard_order_fulfillment(),public.record_order_event(),public.touch_order_request(),public.request_order_support(uuid,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.snapshot_order_item(),public.guard_order_fulfillment(),public.record_order_event(),public.touch_order_request(),public.request_order_support(uuid,text,text,text,uuid) to service_role;
