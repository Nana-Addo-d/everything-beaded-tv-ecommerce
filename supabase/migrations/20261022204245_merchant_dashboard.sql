create schema if not exists merchant_private;
revoke all on schema merchant_private from public, anon, authenticated;
grant usage on schema merchant_private to service_role;

create table public.merchant_approvals (
  email text primary key check(email = lower(trim(email))),
  role text not null check(role in ('owner','manager')),
  created_at timestamptz not null default now()
);
create table public.merchant_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check(role in ('owner','manager')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.merchant_activity (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  action text not null,
  target text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index merchant_activity_time on public.merchant_activity(created_at desc,id desc);
create table public.merchant_operations (
  key uuid primary key,
  actor_id uuid not null,
  action text not null,
  target text not null,
  payload jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create table public.merchant_media (
  path text primary key,
  actor_id uuid not null,
  created_at timestamptz not null default now()
);
alter table public.merchant_approvals enable row level security;
alter table public.merchant_members enable row level security;
alter table public.merchant_activity enable row level security;
alter table public.merchant_operations enable row level security;
alter table public.merchant_media enable row level security;
revoke all on public.merchant_approvals, public.merchant_members, public.merchant_activity, public.merchant_operations, public.merchant_media from public,anon,authenticated,service_role;
grant select on public.merchant_members to service_role;
grant select,insert on public.merchant_activity,public.merchant_operations,public.merchant_media to service_role;
grant usage,select on sequence public.merchant_activity_id_seq to service_role;

-- This non-exposed helper reads Auth state without granting clients or the API role access to Auth tables.
create function merchant_private.assert_access(p_actor uuid,p_session uuid,p_mfa boolean default true)
returns text language plpgsql security definer set search_path = '' as $$
declare member public.merchant_members; approved public.merchant_approvals; identity_email text;
begin
  select lower(u.email) into identity_email from auth.users u join auth.sessions s on s.user_id=u.id
    where u.id=p_actor and s.id=p_session and u.email_confirmed_at is not null
      and coalesce(u.is_anonymous,false)=false and (u.banned_until is null or u.banned_until <= now())
      and (s.not_after is null or s.not_after > now());
  if not found then raise exception 'MERCHANT_SESSION'; end if;
  select * into member from public.merchant_members where user_id=p_actor for share;
  if not found then
    select * into approved from public.merchant_approvals where email=identity_email for update;
    if not found then raise exception 'MERCHANT_FORBIDDEN'; end if;
    insert into public.merchant_members(user_id,role) values(p_actor,approved.role) on conflict do nothing;
    delete from public.merchant_approvals where email=identity_email;
    select * into member from public.merchant_members where user_id=p_actor for share;
    insert into public.merchant_activity(actor_id,action,target,details) values(p_actor,'membership.activated',p_actor::text,jsonb_build_object('role',member.role));
  end if;
  if not member.active then raise exception 'MERCHANT_FORBIDDEN'; end if;
  if p_mfa and not exists (
    select 1 from auth.sessions s join auth.mfa_factors f on f.id=s.factor_id and f.user_id=s.user_id
    where s.id=p_session and s.user_id=p_actor and s.aal::text='aal2' and f.status::text='verified'
  ) then raise exception 'MERCHANT_MFA'; end if;
  return member.role;
end;
$$;
revoke all on function merchant_private.assert_access(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function merchant_private.assert_access(uuid,uuid,boolean) to service_role;
create function public.merchant_access(p_actor uuid,p_session uuid,p_mfa boolean default true)
returns text language sql security invoker set search_path = '' as $$
select merchant_private.assert_access(p_actor,p_session,p_mfa);
$$;
revoke all on function public.merchant_access(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.merchant_access(uuid,uuid,boolean) to service_role;

alter table public.products add column revision integer not null default 1;
alter table public.orders add column revision integer not null default 1;
alter table public.order_requests add column revision integer not null default 1;
create function public.bump_merchant_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.revision := old.revision + 1; return new; end;
$$;
create trigger product_revision before update on public.products for each row execute function public.bump_merchant_revision();
create trigger order_revision before update on public.orders for each row execute function public.bump_merchant_revision();
create trigger request_revision before update on public.order_requests for each row execute function public.bump_merchant_revision();
revoke all on function public.bump_merchant_revision() from public,anon,authenticated;
grant execute on function public.bump_merchant_revision() to service_role;

create function public.merchant_write(p_actor uuid,p_session uuid,p_key uuid,p_action text,p_target text,p_expected integer,p_data jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare item public.products; purchase public.orders; request public.order_requests; previous public.merchant_operations;
  result jsonb; details jsonb; amount integer; before_stock integer;
begin
  perform merchant_private.assert_access(p_actor,p_session,true);
  if p_key is null or p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'MERCHANT_INPUT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_key::text,14));
  select * into previous from public.merchant_operations where key=p_key;
  if found then
    if previous.actor_id<>p_actor or previous.action<>p_action or previous.target<>p_target or previous.payload<>p_data then raise exception 'MERCHANT_RETRY_CONFLICT'; end if;
    return previous.result;
  end if;
  if p_action in ('product.save','product.create','price.save','stock.adjust') then
    select * into item from public.products where slug=p_target for update;
    if p_action='product.create' then
      if found then raise exception 'MERCHANT_EXISTS'; end if;
      insert into public.products(slug,title,category) values(p_target,p_data->>'title',p_data->>'category') returning * into item;
    elsif not found then raise exception 'MERCHANT_NOT_FOUND';
    elsif p_expected is null or item.revision<>p_expected then raise exception 'MERCHANT_CONFLICT'; end if;
    if p_action in ('product.save','product.create') then
      if p_data->>'category' not in ('earrings','necklaces','bags','sandals','baskets','home-living','art')
        or jsonb_typeof(p_data->'images') is distinct from 'array' or jsonb_array_length(p_data->'images')>30
        or jsonb_typeof(p_data->'materials') is distinct from 'array' or length(coalesce(p_data->>'description',''))>6000
        or coalesce((p_data->>'published')::boolean,false) and (jsonb_array_length(p_data->'images')=0 or length(coalesce(p_data->>'description',''))<10)
      then raise exception 'MERCHANT_INPUT'; end if;
      update public.products set title=p_data->>'title',category=p_data->>'category',subcategory=p_data->>'subcategory',
        description=p_data->>'description',materials=array(select jsonb_array_elements_text(p_data->'materials')),
        material_status=p_data->>'material_status',images=p_data->'images',
        attributes=attributes || (p_data->'attributes'), published=(p_data->>'published')::boolean,
        details_approved=(p_data->>'details_approved')::boolean,updated_at=now()
        where slug=p_target returning * into item;
      details:=jsonb_build_object('title',item.title,'published',item.published,'detailsApproved',item.details_approved);
    elsif p_action='price.save' then
      details:=jsonb_build_object('previousPrice',item.price_minor,'price',p_data->'price_minor');
      update public.products set price_minor=(p_data->>'price_minor')::integer,updated_at=now() where slug=p_target returning * into item;
    else
      if length(trim(coalesce(p_data->>'reason','')))<5 or length(p_data->>'reason')>500 then raise exception 'MERCHANT_INPUT'; end if;
      amount:=(p_data->>'quantity')::integer; before_stock:=item.stock_quantity;
      if p_data->>'mode'='initial' then
        if item.stock_quantity is not null then raise exception 'MERCHANT_STOCK_INITIALIZED'; end if;
        if amount is null or amount<0 or amount>1000000 then raise exception 'MERCHANT_INPUT'; end if;
      elsif p_data->>'mode'='adjust' then
        if item.stock_quantity is null then raise exception 'MERCHANT_STOCK_UNKNOWN'; end if;
        if amount is null or amount=0 or abs(amount::bigint)>1000000 then raise exception 'MERCHANT_INPUT'; end if;
        amount:=item.stock_quantity+amount;
        if amount<0 then raise exception 'MERCHANT_STOCK_NEGATIVE'; end if;
      else raise exception 'MERCHANT_INPUT'; end if;
      update public.products set stock_quantity=amount,updated_at=now() where slug=p_target returning * into item;
      details:=jsonb_build_object('previousStock',before_stock,'stock',amount,'reason',p_data->>'reason','mode',p_data->>'mode');
    end if;
    result:=jsonb_build_object('target',p_target,'revision',item.revision);
  elsif p_action='order.fulfill' then
    select * into purchase from public.orders where id=p_target::uuid for update;
    if not found then raise exception 'MERCHANT_NOT_FOUND'; end if;
    if p_expected is null or purchase.revision<>p_expected then raise exception 'MERCHANT_CONFLICT'; end if;
    if p_data->>'status'='dispatched' then
      update public.orders set fulfillment_status='dispatched',dispatched_at=now(),tracking_number=p_data->>'tracking_number',tracking_url=nullif(p_data->>'tracking_url','') where id=purchase.id returning * into purchase;
    elsif p_data->>'status'='delivered' then
      update public.orders set fulfillment_status='delivered',delivered_at=now() where id=purchase.id returning * into purchase;
    else raise exception 'MERCHANT_INPUT'; end if;
    details:=jsonb_build_object('status',purchase.fulfillment_status,'trackingNumber',purchase.tracking_number);
    result:=jsonb_build_object('target',p_target,'revision',purchase.revision);
  elsif p_action='request.reply' then
    -- Lock the parent first, matching dispatch and customer-request lock order.
    select o.* into purchase from public.orders o join public.order_requests r on r.order_id=o.id where r.id=p_target::uuid for update of o;
    select * into request from public.order_requests where id=p_target::uuid for update;
    if not found then raise exception 'MERCHANT_NOT_FOUND'; end if;
    if p_expected is null or request.revision<>p_expected then raise exception 'MERCHANT_CONFLICT'; end if;
    if request.status='closed' or p_data->>'status' not in ('reviewing','closed') or length(trim(coalesce(p_data->>'reply','')))<3 then raise exception 'MERCHANT_REQUEST_STATE'; end if;
    update public.order_requests set status=p_data->>'status',reply=p_data->>'reply' where id=request.id returning * into request;
    details:=jsonb_build_object('status',request.status,'orderId',request.order_id);
    result:=jsonb_build_object('target',p_target,'revision',request.revision);
  else raise exception 'MERCHANT_INPUT'; end if;
  insert into public.merchant_activity(actor_id,action,target,details) values(p_actor,p_action,p_target,details);
  insert into public.merchant_operations(key,actor_id,action,target,payload,result) values(p_key,p_actor,p_action,p_target,p_data,result);
  return result;
end;
$$;
revoke all on function public.merchant_write(uuid,uuid,uuid,text,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.merchant_write(uuid,uuid,uuid,text,text,integer,jsonb) to service_role;

create function public.merchant_summary(p_actor uuid,p_session uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  perform merchant_private.assert_access(p_actor,p_session,true);
  return jsonb_build_object(
    'products',(select count(*) from public.products),
    'unpriced',(select count(*) from public.products where price_minor is null),
    'unknownStock',(select count(*) from public.products where stock_quantity is null),
    'ordersToPrepare',(select count(*) from public.orders where status='paid' and fulfillment_status='preparing'),
    'openRequests',(select count(*) from public.order_requests where status<>'closed'),
    'orderingEnabled',(select ordering_enabled from public.store_settings),
    'currency',(select currency from public.store_settings));
end;
$$;
revoke all on function public.merchant_summary(uuid,uuid) from public,anon,authenticated;
grant execute on function public.merchant_summary(uuid,uuid) to service_role;

-- Product uploads are public product photographs; only the server can write objects.
do $$ begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
      values('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
  end if;
end $$;
