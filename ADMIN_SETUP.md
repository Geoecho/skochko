# Skochko administration

Admin sign-in: https://skochko.vercel.app/admin/login

The dedicated username is `admin`. It maps to the reserved internal authentication identifier `admin@skochko.invalid`; this is not an email inbox and receives no email.

## First administrator

The panel and database permissions are deployed, but no administrator account has been created. Automatic approval review rejected the proposed public privileged setup endpoint. That endpoint was not deployed.

An authenticated Supabase project owner must create the initial account:

1. Open https://supabase.com/dashboard/project/jnisfxzjnxcxadjwulld/auth/users and choose **Add user → Create new user**.
2. Use `admin@skochko.invalid`, choose a strong password, and enable **Auto Confirm User** for this internal account. Do not disable email verification globally.
3. In the project's SQL Editor, run the following once, or ask the assistant to grant the role after the account exists:

```sql
do $$
declare account_id uuid;
begin
  select id into account_id
  from auth.users
  where email = 'admin@skochko.invalid'
    and email_confirmed_at is not null;
  if account_id is null then
    raise exception 'Create and confirm the internal admin account first';
  end if;
  update public.profiles set role = 'admin', display_name = 'Administrator'
  where user_id = account_id;
  if not found then raise exception 'The account profile is missing'; end if;
end $$;
```

4. Sign in at /admin/login using username `admin` and the password you chose.

This account is separate from ordinary member accounts. No Gmail address is required.

## Panel coverage

- Overview: account totals, new accounts, active accounts, route sessions, completed sessions, saved routes, favourites, reports, fourteen-day activity, popular places, and data coverage.
- Venues, photos, opening hours, prices, events, cover images, promotions, and public-route moderation.
- Account role management. Own-role changes and removing the last admin are blocked in the database.
- Diagnostics: recent client errors and the admin change log.
- Settings: featured banner visibility, selected place, headings in both languages, and current-account password changes.
- CSV exports of displayed activity, account, error, and audit records.

Usage is measured from saved application records. Anonymous page views, unsaved guest routes, Google billing usage, and hosting bandwidth are not collected or presented as visitor metrics.

## Verification and existing advisories

Public requests to admin_overview and admin_set_user_role return HTTP 401. Public audit access is denied. Public non-sensitive banner configuration is readable. New tables have RLS enabled.

The Supabase security advisor also reports existing advisories:
- [Public executable SECURITY DEFINER helper](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable): is_admin returns only the current caller's role check and is used by existing public content policies.
- [Signed-in executable SECURITY DEFINER helpers](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable): existing is_admin and delete_my_account functions.
- [Leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection): an existing Auth setting; review availability for the project's plan.

An authenticated dashboard test requires completing initial account provisioning above.
