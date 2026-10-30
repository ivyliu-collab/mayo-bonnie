-- Pet health and care records
alter table public.pets add column if not exists sex text;

create table if not exists public.pet_health_records (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  record_type text not null check (record_type in ('weight', 'deworming', 'grooming')),
  subtype text,
  recorded_on date not null default current_date,
  value numeric(10, 3),
  unit text,
  brand text,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists pet_health_records_household_pet_date_idx
  on public.pet_health_records(household_id, pet_id, recorded_on desc, created_at desc);

alter table public.pet_health_records enable row level security;

drop policy if exists pet_health_records_read on public.pet_health_records;
create policy pet_health_records_read on public.pet_health_records
  for select using (public.is_household_member(household_id));

drop policy if exists pet_health_records_write on public.pet_health_records;
create policy pet_health_records_write on public.pet_health_records
  for all using (public.can_write_household(household_id))
  with check (public.can_write_household(household_id));

-- Event editing/reversal metadata. Reversal is always represented as a new event.
alter table public.inventory_events add column if not exists reversed_at timestamptz;
alter table public.inventory_events add column if not exists reverses_event_id uuid references public.inventory_events(id);

-- Households had a read policy in the first migration; editors also need to rename one.
drop policy if exists households_write on public.households;
create policy households_write on public.households
  for update using (public.can_write_household(id))
  with check (public.can_write_household(id));

-- Product images are public assets, but uploads are restricted to the matching household folder.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists product_images_read on storage.objects;
create policy product_images_read on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists product_images_insert on storage.objects;
create policy product_images_insert on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.household_members
      where household_id::text = (storage.foldername(name))[1]
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

drop policy if exists product_images_update on storage.objects;
create policy product_images_update on storage.objects
  for update using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.household_members
      where household_id::text = (storage.foldername(name))[1]
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

drop policy if exists product_images_delete on storage.objects;
create policy product_images_delete on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.household_members
      where household_id::text = (storage.foldername(name))[1]
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );

create or replace function public.reverse_inventory_event(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
  source_event public.inventory_events%rowtype;
  current_quantity numeric;
  reverse_event_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select household_id into target_household_id
  from public.household_members
  where user_id = auth.uid() and role in ('owner', 'editor')
  order by created_at
  limit 1;
  if target_household_id is null then raise exception 'no_writable_household'; end if;

  select * into source_event
  from public.inventory_events
  where id = p_event_id and household_id = target_household_id
  for update;
  if not found then raise exception 'event_not_found'; end if;
  if source_event.reversed_at is not null then raise exception 'event_already_reversed'; end if;
  if source_event.type not in ('stock_in', 'consume') then raise exception 'event_not_reversible'; end if;
  if source_event.batch_id is null then raise exception 'event_batch_not_found'; end if;

  select quantity into current_quantity
  from public.inventory_batches
  where id = source_event.batch_id and household_id = target_household_id
  for update;
  if not found then raise exception 'batch_not_found'; end if;

  if source_event.type = 'stock_in' then
    if current_quantity < source_event.quantity then raise exception 'cannot_reverse_consumed_stock_in'; end if;
    update public.inventory_batches set quantity = quantity - source_event.quantity where id = source_event.batch_id;
  else
    update public.inventory_batches set quantity = quantity + source_event.quantity where id = source_event.batch_id;
  end if;

  insert into public.inventory_events (
    household_id, product_id, batch_id, type, quantity, note, idempotency_key, created_by, reverses_event_id
  ) values (
    target_household_id,
    source_event.product_id,
    source_event.batch_id,
    'reverse',
    source_event.quantity,
    case when source_event.type = 'stock_in' then '撤销入库' else '撤销消耗' end,
    gen_random_uuid()::text,
    auth.uid(),
    source_event.id
  ) returning id into reverse_event_id;

  update public.inventory_events set reversed_at = now() where id = source_event.id;
  return reverse_event_id;
end;
$$;

revoke all on function public.reverse_inventory_event(uuid) from public;
grant execute on function public.reverse_inventory_event(uuid) to authenticated;
