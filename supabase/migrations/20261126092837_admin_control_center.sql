-- Admin control center. All operational metrics are based on persisted app activity.
create table if not exists public.app_settings (
  id text primary key check (id = 'public'),
  featured_enabled boolean not null default true,
  featured_venue_id uuid references public.venues(id) on delete set null,
  featured_title_mk text not null default 'Локално омилено' check (length(featured_title_mk) <= 120),
  featured_title_en text not null default 'A local favourite' check (length(featured_title_en) <= 120),
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
grant select on public.app_settings to anon, authenticated;
grant insert, update, delete on public.app_settings to authenticated;
create policy app_settings_public_read on public.app_settings for select to anon, authenticated using (true);
create policy app_settings_admin_write on public.app_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
insert into public.app_settings(id) values ('public') on conflict do nothing;

create table if not exists public.admin_audit_log (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,
 target_type text not null,
 target_id uuid not null,
 created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
grant select on public.admin_audit_log to authenticated;
create policy admin_audit_read on public.admin_audit_log for select to authenticated using ((select public.is_admin()));
create index admin_audit_created_idx on public.admin_audit_log(created_at desc);

create or replace function public.log_admin_change() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is not null and public.is_admin() then
   insert into public.admin_audit_log(actor_id,action,target_type,target_id)
   values(auth.uid(),lower(tg_op),tg_table_name,case when tg_op='DELETE' then old.id else new.id end);
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end; $$;
revoke all on function public.log_admin_change() from public, anon, authenticated;
create trigger venues_admin_audit after insert or update or delete on public.venues for each row execute function public.log_admin_change();
create trigger events_admin_audit after insert or update or delete on public.events for each row execute function public.log_admin_change();
create trigger promotions_admin_audit after insert or update or delete on public.promotions for each row execute function public.log_admin_change();
create trigger routes_admin_audit after insert or update or delete on public.routes for each row execute function public.log_admin_change();
create trigger profiles_admin_audit after update on public.profiles for each row execute function public.log_admin_change();

create policy crawls_admin_read on public.crawls for select to authenticated using ((select public.is_admin()));
create policy crawl_checkins_admin_read on public.crawl_checkins for select to authenticated using ((select public.is_admin()));
create policy favourites_admin_read on public.favourites for select to authenticated using ((select public.is_admin()));

create or replace function public.admin_overview() returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 return jsonb_build_object(
  'users',(select count(*) from public.profiles),
  'new_users',(select count(*) from public.profiles where created_at >= now()-interval '7 days'),
  'venues',(select count(*) from public.venues),
  'active_venues',(select count(*) from public.venues where status='active'),
  'events',(select count(*) from public.events where status='active' and coalesce(ends_at,starts_at+interval '6 hours')>now()),
  'routes',(select count(*) from public.routes),
  'public_routes',(select count(*) from public.routes where visibility='public' and status='active'),
  'sessions',(select count(*) from public.crawls),
  'completed',(select count(*) from public.crawls where ended_at is not null),
  'active_users',(select count(distinct user_id) from public.crawls where started_at>=now()-interval '7 days'),
  'checkins',(select count(*) from public.crawl_checkins),
  'favourites',(select count(*) from public.favourites),
  'reports',(select count(*) from public.reports),
  'errors',(select count(*) from public.client_errors where kind<>'diag' and created_at>=now()-interval '7 days'),
  'quality',jsonb_build_object(
    'photos',(select count(*) from public.venues where cardinality(photos)>0),
    'ratings',(select count(*) from public.venues where coalesce((google_details->>'rating')::numeric,0)>0),
    'hours',(select count(*) from public.venues where hours is not null and hours<>'{}'::jsonb),
    'stale',(select count(*) from public.venues where external_id like 'google-places:%' and (google_details->>'fetchedAt' is null or (google_details->>'fetchedAt')::timestamptz < now()-interval '21 days'))
  ),
  'daily',(select jsonb_agg(jsonb_build_object('day',day::date,
    'users',(select count(*) from public.profiles p where (p.created_at at time zone 'Europe/Skopje')::date=day::date),
    'routes',(select count(*) from public.routes r where (r.created_at at time zone 'Europe/Skopje')::date=day::date),
    'sessions',(select count(*) from public.crawls c where (c.started_at at time zone 'Europe/Skopje')::date=day::date)
  ) order by day) from generate_series((now() at time zone 'Europe/Skopje')::date-13,(now() at time zone 'Europe/Skopje')::date,'1 day') day),
  'popular',(select coalesce(jsonb_agg(x),'[]'::jsonb) from (
    select v.name,count(f.id) favourites from public.venues v join public.favourites f on f.venue_id=v.id group by v.id,v.name order by count(f.id) desc limit 5
  ) x)
 );
end; $$;
revoke all on function public.admin_overview() from public,anon;
grant execute on function public.admin_overview() to authenticated;

create or replace function public.admin_set_user_role(p_user_id uuid,p_role text) returns void language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_role not in ('member','admin') then raise exception 'Invalid role'; end if;
 if p_user_id=auth.uid() then raise exception 'You cannot change your own role'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('skochko-admin-roles'));
 if p_role='member' and exists(select 1 from public.profiles where user_id=p_user_id and role='admin')
   and (select count(*) from public.profiles where role='admin')<=1 then raise exception 'The last administrator cannot be removed'; end if;
 update public.profiles set role=p_role::public.user_role where user_id=p_user_id;
 if not found then raise exception 'Account not found'; end if;
end; $$;
revoke all on function public.admin_set_user_role(uuid,text) from public,anon;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated;

create or replace function public.protect_profile_role() returns trigger language plpgsql set search_path = '' as $$
begin
 if current_user in ('anon','authenticated') then
  if tg_op='INSERT' and new.role<>'member' then raise exception 'Only an administrator can assign a profile role' using errcode='42501'; end if;
  if tg_op='UPDATE' and new.role is distinct from old.role then
    if not public.is_admin() then raise exception 'Only an administrator can change a profile role' using errcode='42501'; end if;
    if old.user_id=auth.uid() then raise exception 'You cannot change your own role' using errcode='42501'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('skochko-admin-roles'));
    if old.role='admin' and new.role<>'admin' and (select count(*) from public.profiles where role='admin')<=1 then raise exception 'The last administrator cannot be removed'; end if;
  end if;
 end if;
 return new;
end; $$;
