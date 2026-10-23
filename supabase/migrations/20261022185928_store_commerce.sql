create table public.store_settings (
  singleton boolean primary key default true check (singleton),
  currency text not null default 'GHS' check (currency ~ '^[A-Z]{3}$'),
  country_code text not null default 'GH' check (country_code ~ '^[A-Z]{2}$'),
  ordering_enabled boolean not null default false,
  policies_approved boolean not null default false,
  prices_include_tax boolean not null default false,
  support_contact text not null default '',
  delivery_policy text not null default '',
  returns_policy text not null default '',
  privacy_policy text not null default '',
  terms_policy text not null default '',
  check (not policies_approved or (length(support_contact) > 3 and length(delivery_policy) > 20
    and length(returns_policy) > 20 and length(privacy_policy) > 20 and length(terms_policy) > 20))
);
insert into public.store_settings default values;

create table public.products (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  title text not null check (length(title) between 1 and 180),
  category text not null,
  subcategory text not null default '',
  description text not null default '',
  materials text[] not null default '{}',
  material_status text not null default 'visual' check (material_status in ('visual', 'confirmed')),
  images jsonb not null default '[]' check (jsonb_typeof(images) = 'array'),
  attributes jsonb not null default '{}',
  price_minor integer check (price_minor > 0 and price_minor <= 100000000),
  stock_quantity integer check (stock_quantity >= 0),
  published boolean not null default false,
  details_approved boolean not null default false,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);
create index products_category_sort on public.products(category, sort_order);

create table public.delivery_zones (
  id text primary key,
  name text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  fee_minor integer not null check (fee_minor >= 0 and fee_minor <= 100000000),
  enabled boolean not null default false
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null unique,
  request_hash text not null,
  access_hash text not null check (length(access_hash) = 64),
  status text not null default 'pending' check (status in ('pending','paid','cancelled','payment_review')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled','preparing','dispatched','delivered')),
  tracking_number text,
  tracking_url text check (tracking_url is null or tracking_url ~ '^https://'),
  dispatched_at timestamptz,
  delivered_at timestamptz,
  currency text not null,
  subtotal_minor integer not null,
  delivery_minor integer not null,
  total_minor integer not null check (total_minor > 0),
  email text not null,
  customer_name text not null,
  phone text not null,
  address jsonb not null,
  zone_name text not null,
  reserved boolean not null default true,
  reference text not null unique,
  payment_url text,
  initialization_until timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  paid_at timestamptz,
  check (fulfillment_status = 'unfulfilled' or status = 'paid'),
  check (fulfillment_status not in ('dispatched','delivered') or dispatched_at is not null),
  check (fulfillment_status <> 'delivered' or delivered_at is not null)
);
create table public.order_items (
  order_id uuid not null references public.orders(id),
  slug text not null references public.products(slug),
  title text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_minor integer not null check (unit_minor > 0),
  primary key (order_id, slug)
);
create table public.payment_inbox (
  event_hash text primary key,
  reference text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create table public.commerce_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  kind text not null check (kind in ('verify_payment','send_receipt')),
  status text not null default 'pending' check (status in ('pending','processing','done','attention')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  lease_token uuid,
  wake_version integer not null default 0,
  claimed_version integer,
  last_error text,
  unique (order_id, kind)
);
create index commerce_jobs_pending on public.commerce_jobs(available_at) where status in ('pending','processing');

-- Only explicitly published catalogue data is readable without the server key.
alter table public.store_settings enable row level security;
alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_inbox enable row level security;
alter table public.commerce_jobs enable row level security;
revoke all on public.store_settings, public.products, public.delivery_zones, public.orders, public.order_items, public.payment_inbox, public.commerce_jobs from public, anon, authenticated;
grant select on public.store_settings, public.products, public.delivery_zones to anon, authenticated;
grant all on public.store_settings, public.products, public.delivery_zones, public.orders, public.order_items, public.payment_inbox, public.commerce_jobs to service_role;
create policy catalogue_read on public.products for select to anon, authenticated using (published);
create policy store_read on public.store_settings for select to anon, authenticated using (true);
create policy delivery_read on public.delivery_zones for select to anon, authenticated using (enabled);

create function public.checkout_quote(p_items jsonb, p_zone text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  settings public.store_settings;
  zone public.delivery_zones;
  row record;
  subtotal bigint := 0;
  lines jsonb := '[]';
begin
  select * into strict settings from public.store_settings where singleton;
  if not settings.ordering_enabled or not settings.policies_approved or not settings.prices_include_tax then
    raise exception 'ORDERING_UNAVAILABLE';
  end if;
  select * into zone from public.delivery_zones where id = p_zone and enabled and country_code = settings.country_code;
  if not found then raise exception 'DELIVERY_UNAVAILABLE'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception 'INVALID_BAG';
  end if;
  if exists (select 1 from jsonb_array_elements(p_items) j where
    jsonb_typeof(j->'slug') <> 'string' or jsonb_typeof(j->'quantity') <> 'number'
    or (j->>'quantity') !~ '^[0-9]+$' or j->>'slug' is null or j->>'quantity' is null) then
    raise exception 'INVALID_BAG';
  end if;
  if (select count(distinct j->>'slug') from jsonb_array_elements(p_items) j) <> jsonb_array_length(p_items) then
    raise exception 'INVALID_BAG';
  end if;
  for row in select p.*, (j->>'quantity')::integer as quantity
    from jsonb_array_elements(p_items) j left join public.products p on p.slug = j->>'slug'
  loop
    if row.slug is null or not row.published or not row.details_approved or row.price_minor is null then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;
    if row.quantity not between 1 and 20 then raise exception 'INVALID_QUANTITY'; end if;
    if row.stock_quantity is null or row.stock_quantity < row.quantity then raise exception 'STOCK_UNAVAILABLE'; end if;
    subtotal := subtotal + row.price_minor::bigint * row.quantity;
    lines := lines || jsonb_build_object('slug', row.slug, 'title', row.title, 'quantity', row.quantity, 'unitMinor', row.price_minor);
  end loop;
  if subtotal + zone.fee_minor > 1000000000 then raise exception 'ORDER_TOO_LARGE'; end if;
  return jsonb_build_object('items', lines, 'subtotalMinor', subtotal, 'deliveryMinor', zone.fee_minor,
    'totalMinor', subtotal + zone.fee_minor, 'currency', settings.currency, 'zoneName', zone.name,
    'countryCode', settings.country_code);
end;
$$;

create function public.reserve_order(p_items jsonb, p_zone text, p_customer jsonb, p_key uuid, p_request_hash text, p_access_hash text, p_expected_total integer)
returns public.orders language plpgsql security invoker set search_path = '' as $$
declare
  existing public.orders;
  result public.orders;
  quote jsonb;
  order_id uuid := gen_random_uuid();
  item jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_key::text, 0));
  select * into existing from public.orders where idempotency_key = p_key;
  if found then
    if existing.request_hash <> p_request_hash or existing.access_hash <> p_access_hash then raise exception 'CHECKOUT_CONFLICT'; end if;
    return existing;
  end if;
  if length(p_customer->>'email') not between 3 and 254 or length(p_customer->>'name') not between 2 and 100
    or length(p_customer->>'phone') not between 7 and 30 or jsonb_typeof(p_customer->'address') <> 'object'
    or p_customer->>'email' is null or p_customer->>'name' is null or p_customer->>'phone' is null or p_customer->'address' is null then
    raise exception 'INVALID_CUSTOMER';
  end if;
  -- Serialize competing reservations in slug order, then quote inside the same transaction.
  perform p.slug from public.products p where p.slug in (select j->>'slug' from jsonb_array_elements(p_items) j) order by p.slug for update;
  quote := public.checkout_quote(p_items, p_zone);
  if p_customer->'address'->>'countryCode' is distinct from quote->>'countryCode' then raise exception 'DELIVERY_UNAVAILABLE'; end if;
  if (select count(*) from public.orders where access_hash = p_access_hash and status = 'pending') >= 3 then raise exception 'CHECKOUT_CONFLICT'; end if;
  if (quote->>'totalMinor')::integer <> p_expected_total then raise exception 'PRICE_CHANGED'; end if;
  insert into public.orders(id, idempotency_key, request_hash, access_hash, currency, subtotal_minor, delivery_minor, total_minor,
    email, customer_name, phone, address, zone_name, reference)
  values (order_id, p_key, p_request_hash, p_access_hash, quote->>'currency', (quote->>'subtotalMinor')::integer,
    (quote->>'deliveryMinor')::integer, (quote->>'totalMinor')::integer, lower(p_customer->>'email'), p_customer->>'name',
    p_customer->>'phone', p_customer->'address', quote->>'zoneName', 'eb-' || replace(order_id::text, '-', '')) returning * into result;
  for item in select * from jsonb_array_elements(quote->'items') loop
    insert into public.order_items values (order_id, item->>'slug', item->>'title', (item->>'quantity')::integer, (item->>'unitMinor')::integer);
    update public.products set stock_quantity = stock_quantity - (item->>'quantity')::integer where slug = item->>'slug';
  end loop;
  insert into public.commerce_jobs(order_id, kind, available_at) values(order_id, 'verify_payment', now() + interval '1 minute');
  return result;
end;
$$;

create function public.claim_payment_initialization(p_id uuid)
returns boolean language sql security invoker set search_path = '' as $$
  with claimed as (
    update public.orders set initialization_until = now() + interval '1 minute'
    where id = p_id and status = 'pending' and expires_at > now() and payment_url is null
      and (initialization_until is null or initialization_until < now()) returning id
  ) select exists(select 1 from claimed);
$$;

create function public.record_payment(p_reference text, p_amount bigint, p_currency text, p_email text)
returns text language plpgsql security invoker set search_path = '' as $$
declare o public.orders;
begin
  select * into o from public.orders where reference = p_reference for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status = 'paid' then return 'paid'; end if;
  if o.total_minor <> p_amount or o.currency <> p_currency or lower(o.email) <> lower(p_email) or not o.reserved then
    update public.orders set status = 'payment_review' where id = o.id;
    return 'payment_review';
  end if;
  update public.orders set status = 'paid', reserved = false, paid_at = now(), fulfillment_status = 'preparing' where id = o.id;
  insert into public.commerce_jobs(order_id, kind) values (o.id, 'send_receipt') on conflict (order_id, kind) do nothing;
  update public.payment_inbox set processed_at = now() where reference = p_reference;
  return 'paid';
end;
$$;

create function public.cancel_unpaid_order(p_id uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare o public.orders; item record;
begin
  select * into o from public.orders where id = p_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status <> 'pending' or not o.reserved or o.expires_at > now() then return o.status; end if;
  for item in select * from public.order_items where order_id = p_id order by slug loop
    update public.products set stock_quantity = stock_quantity + item.quantity where slug = item.slug;
  end loop;
  update public.orders set status = 'cancelled', reserved = false where id = p_id;
  return 'cancelled';
end;
$$;

create function public.receive_payment_event(p_hash text, p_reference text)
returns void language plpgsql security invoker set search_path = '' as $$
declare oid uuid;
begin
  insert into public.payment_inbox(event_hash, reference) values (p_hash, p_reference) on conflict do nothing;
  select id into oid from public.orders where reference = p_reference;
  if oid is not null then
    insert into public.commerce_jobs(order_id, kind) values (oid, 'verify_payment')
      on conflict (order_id, kind) do update set available_at = now(), wake_version = commerce_jobs.wake_version + 1, status = case
        when commerce_jobs.status = 'processing' then 'processing' else 'pending' end;
  end if;
end;
$$;

create function public.claim_commerce_jobs()
returns setof public.commerce_jobs language sql security invoker set search_path = '' as $$
  update public.commerce_jobs set status = 'processing', locked_until = now() + interval '2 minutes', attempts = attempts + 1,
    lease_token = gen_random_uuid(), claimed_version = wake_version
  where id in (select id from public.commerce_jobs where
    (status = 'pending' or (status = 'processing' and locked_until < now())) and available_at <= now()
    order by available_at for update skip locked limit 5) returning *;
$$;

create function public.finish_commerce_job(p_id uuid, p_token uuid, p_status text, p_error text, p_available_at timestamptz)
returns void language plpgsql security invoker set search_path = '' as $$
declare job public.commerce_jobs;
begin
  if p_status not in ('pending','done','attention') then raise exception 'INVALID_REQUEST'; end if;
  select * into job from public.commerce_jobs where id=p_id for update;
  -- A stale worker cannot overwrite a newer claim. Events received during a claim remain runnable.
  if not found or job.status <> 'processing' or job.lease_token is distinct from p_token then return; end if;
  update public.commerce_jobs set
    status = case when wake_version <> claimed_version then 'pending' else p_status end,
    available_at = case when wake_version <> claimed_version then now() else p_available_at end,
    locked_until = null, lease_token = null, last_error = p_error where id=p_id;
end;
$$;

-- These functions handle money and stock. Only the server service role may call them.
revoke all on function public.checkout_quote(jsonb,text), public.reserve_order(jsonb,text,jsonb,uuid,text,text,integer),
  public.claim_payment_initialization(uuid), public.record_payment(text,bigint,text,text), public.cancel_unpaid_order(uuid),
  public.receive_payment_event(text,text), public.claim_commerce_jobs(), public.finish_commerce_job(uuid,uuid,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.checkout_quote(jsonb,text), public.reserve_order(jsonb,text,jsonb,uuid,text,text,integer),
  public.claim_payment_initialization(uuid), public.record_payment(text,bigint,text,text), public.cancel_unpaid_order(uuid),
  public.receive_payment_event(text,text), public.claim_commerce_jobs(), public.finish_commerce_job(uuid,uuid,text,text,timestamptz) to service_role;
