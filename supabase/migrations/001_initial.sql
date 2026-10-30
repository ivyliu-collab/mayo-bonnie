create extension if not exists pgcrypto;

create type public.household_role as enum ('owner', 'editor', 'viewer');
create type public.pet_type as enum ('猫', '狗');
create type public.inventory_event_type as enum ('stock_in', 'consume', 'open', 'adjust', 'reverse');

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.household_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  type public.pet_type not null,
  breed text,
  birthday date,
  color text not null default 'apricot',
  photo_path text,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  section public.pet_type not null,
  unit text not null,
  expiry_required boolean not null default true,
  archived_at timestamptz,
  unique (household_id, section, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  name text not null,
  brand text,
  specification text,
  barcode text,
  image_path text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (household_id, barcode)
);

create table public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  product_id uuid not null references public.products(id),
  expires_on date,
  quantity numeric(12, 3) not null check (quantity >= 0),
  opened_quantity numeric(12, 3) not null default 0 check (opened_quantity >= 0),
  unit text not null,
  created_at timestamptz not null default now(),
  check (opened_quantity <= quantity)
);

create table public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  product_id uuid not null references public.products(id),
  batch_id uuid references public.inventory_batches(id),
  type public.inventory_event_type not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  note text,
  idempotency_key text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (household_id, idempotency_key)
);

create index inventory_batches_household_product_idx on public.inventory_batches(household_id, product_id);
create index inventory_events_household_created_idx on public.inventory_events(household_id, created_at desc);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.pets enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.inventory_events enable row level security;

create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = target_household and user_id = auth.uid()
  );
$$;

create or replace function public.can_write_household(target_household uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.household_members
    where household_id = target_household
      and user_id = auth.uid()
      and role in ('owner', 'editor')
  );
$$;

create policy household_members_read on public.household_members for select using (public.is_household_member(household_id));
create policy households_read on public.households for select using (public.is_household_member(id));
create policy pets_read on public.pets for select using (public.is_household_member(household_id));
create policy pets_write on public.pets for all using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));
create policy categories_read on public.categories for select using (public.is_household_member(household_id));
create policy categories_write on public.categories for all using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));
create policy products_read on public.products for select using (public.is_household_member(household_id));
create policy products_write on public.products for all using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));
create policy batches_read on public.inventory_batches for select using (public.is_household_member(household_id));
create policy batches_write on public.inventory_batches for all using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));
create policy events_read on public.inventory_events for select using (public.is_household_member(household_id));
create policy events_write on public.inventory_events for all using (public.can_write_household(household_id)) with check (public.can_write_household(household_id));

create or replace function public.create_household_onboarding(
  p_name text,
  p_pets jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  pet_types public.pet_type[];
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if char_length(trim(coalesce(p_name, ''))) not between 1 and 80 then
    raise exception 'invalid_household_name';
  end if;

  if jsonb_typeof(p_pets) <> 'array' or jsonb_array_length(p_pets) < 1 then
    raise exception 'at_least_one_pet_required';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_pets) as pet(name text, type public.pet_type)
    where char_length(trim(coalesce(pet.name, ''))) = 0 or pet.type is null
  ) then
    raise exception 'invalid_pet';
  end if;

  insert into public.households (name, created_by)
  values (trim(p_name), auth.uid())
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, auth.uid(), 'owner');

  select array_agg(distinct pet.type)
  into pet_types
  from jsonb_to_recordset(p_pets) as pet(type public.pet_type);

  insert into public.categories (household_id, name, section, unit, expiry_required)
  select new_household_id, category.name, section.type, category.unit, category.expiry_required
  from unnest(pet_types) as section(type)
  cross join lateral (
    values
      ('罐头', '罐', true),
      ('餐包餐盒', '盒', true),
      ('猫粮', '包', true),
      ('狗粮', '包', true),
      ('零食', '袋', true),
      ('其他', '件', false)
  ) as category(name, unit, expiry_required)
  where not (section.type = '猫' and category.name = '狗粮')
    and not (section.type = '狗' and category.name = '猫粮');

  insert into public.pets (household_id, name, type, breed, birthday, color, photo_path)
  select new_household_id, pet.name, pet.type, nullif(trim(pet.breed), ''), nullif(pet.birthday, '')::date, pet.color, pet.photo
  from jsonb_to_recordset(p_pets) as pet(name text, type public.pet_type, breed text, birthday text, color text, photo text);

  return new_household_id;
end;
$$;

revoke all on function public.create_household_onboarding(text, jsonb) from public;
grant execute on function public.create_household_onboarding(text, jsonb) to authenticated;

create or replace function public.stock_in_product(
  p_name text,
  p_category text,
  p_section public.pet_type,
  p_unit text,
  p_batches jsonb
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  target_household_id uuid;
  target_category_id uuid;
  target_product_id uuid;
  new_batch_id uuid;
  batch_record record;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 120 then raise exception 'invalid_product_name'; end if;
  if char_length(trim(coalesce(p_category, ''))) = 0 or char_length(trim(coalesce(p_unit, ''))) = 0 then raise exception 'invalid_product_fields'; end if;
  if jsonb_typeof(p_batches) <> 'array' or jsonb_array_length(p_batches) < 1 then raise exception 'at_least_one_batch_required'; end if;
  if exists (select 1 from jsonb_to_recordset(p_batches) as batch(expires_on text, quantity numeric) where batch.quantity is null or batch.quantity <= 0) then raise exception 'invalid_batch_quantity'; end if;

  select household_id into target_household_id from public.household_members where user_id = auth.uid() and role in ('owner', 'editor') order by created_at limit 1;
  if target_household_id is null then raise exception 'no_writable_household'; end if;

  select id into target_category_id from public.categories where household_id = target_household_id and section = p_section and name = trim(p_category) and archived_at is null limit 1;
  if target_category_id is null then
    insert into public.categories (household_id, name, section, unit, expiry_required) values (target_household_id, trim(p_category), p_section, trim(p_unit), true) returning id into target_category_id;
  end if;

  select id into target_product_id from public.products where household_id = target_household_id and category_id = target_category_id and lower(name) = lower(trim(p_name)) and archived_at is null limit 1;
  if target_product_id is null then
    insert into public.products (household_id, category_id, name) values (target_household_id, target_category_id, trim(p_name)) returning id into target_product_id;
  end if;

  for batch_record in select * from jsonb_to_recordset(p_batches) as batch(expires_on text, quantity numeric) loop
    insert into public.inventory_batches (household_id, product_id, expires_on, quantity, unit) values (target_household_id, target_product_id, nullif(batch_record.expires_on, '')::date, batch_record.quantity, trim(p_unit)) returning id into new_batch_id;
    insert into public.inventory_events (household_id, product_id, batch_id, type, quantity, note, idempotency_key, created_by) values (target_household_id, target_product_id, new_batch_id, 'stock_in', batch_record.quantity, '手动入库', gen_random_uuid()::text, auth.uid());
  end loop;
  return target_product_id;
end;
$$;

revoke all on function public.stock_in_product(text, text, public.pet_type, text, jsonb) from public;
grant execute on function public.stock_in_product(text, text, public.pet_type, text, jsonb) to authenticated;

create or replace function public.consume_product(
  p_product_id uuid,
  p_quantity numeric default 1
)
returns numeric language plpgsql security definer set search_path = public as $$
declare
  target_household_id uuid;
  remaining numeric := p_quantity;
  batch_record record;
  consumed numeric;
  available numeric := 0;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'invalid_consume_quantity'; end if;

  select household_id into target_household_id from public.household_members where user_id = auth.uid() and role in ('owner', 'editor') order by created_at limit 1;
  if target_household_id is null then raise exception 'no_writable_household'; end if;
  if not exists (select 1 from public.products where id = p_product_id and household_id = target_household_id and archived_at is null) then raise exception 'product_not_found'; end if;
  for batch_record in
    select id, quantity, unit from public.inventory_batches
    where product_id = p_product_id and household_id = target_household_id and quantity > 0
    order by expires_on nulls last, created_at
    for update
  loop
    available := available + batch_record.quantity;
  end loop;
  if available < p_quantity then raise exception 'insufficient_stock'; end if;

  for batch_record in
    select id, quantity, unit from public.inventory_batches
    where product_id = p_product_id and household_id = target_household_id and quantity > 0
    order by expires_on nulls last, created_at
    for update
  loop
    exit when remaining <= 0;
    consumed := least(batch_record.quantity, remaining);
    update public.inventory_batches set quantity = quantity - consumed where id = batch_record.id;
    insert into public.inventory_events (household_id, product_id, batch_id, type, quantity, note, idempotency_key, created_by)
    values (target_household_id, p_product_id, batch_record.id, 'consume', consumed, '消耗库存', gen_random_uuid()::text, auth.uid());
    remaining := remaining - consumed;
  end loop;
  return p_quantity;
end;
$$;

revoke all on function public.consume_product(uuid, numeric) from public;
grant execute on function public.consume_product(uuid, numeric) to authenticated;
