-- Google Places metadata stays separate from Skochko member ratings.
begin;

alter table public.venues
  add column if not exists google_details jsonb
  check (google_details is null or jsonb_typeof(google_details) = 'object');

commit;
