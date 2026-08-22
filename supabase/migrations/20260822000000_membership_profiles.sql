-- Store the latest membership details directly on the permanent website
-- profile. Ghost remains authoritative for newsletter subscriptions.

begin;

alter table public.profiles
  add column if not exists membership_joined_at timestamptz,
  add column if not exists membership_updated_at timestamptz,
  add column if not exists membership_year integer
    check (membership_year is null or membership_year between 2020 and 2100),
  add column if not exists membership_consent_version text,
  add column if not exists membership_consented_at timestamptz,
  add column if not exists membership_email_confirmed_at timestamptz,
  add column if not exists upi text check (upi is null or char_length(upi) <= 40),
  add column if not exists student_id text check (student_id is null or char_length(student_id) <= 40),
  add column if not exists study_years_remaining integer
    check (study_years_remaining is null or study_years_remaining between 1 and 20),
  add column if not exists study_years_as_of_year integer
    check (study_years_as_of_year is null or study_years_as_of_year between 2020 and 2100),
  add column if not exists faculty text check (faculty is null or char_length(faculty) <= 120),
  add column if not exists expected_graduation_year integer
    check (expected_graduation_year is null or expected_graduation_year between 2020 and 2120),
  add column if not exists interests_to_gain text
    check (interests_to_gain is null or char_length(interests_to_gain) <= 2000),
  add column if not exists skills_to_share text
    check (skills_to_share is null or char_length(skills_to_share) <= 2000),
  add column if not exists ghost_member_id text,
  add column if not exists membership_sync_status text
    check (membership_sync_status is null or membership_sync_status in ('pending', 'synced', 'failed')),
  add column if not exists membership_sync_error text,
  add column if not exists engage_status text
    check (engage_status is null or engage_status in ('queued', 'invited', 'joined')),
  add column if not exists engage_status_year integer
    check (engage_status_year is null or engage_status_year between 2020 and 2100),
  add column if not exists engage_invited_at timestamptz,
  add column if not exists engage_eligible_until_year integer
    check (engage_eligible_until_year is null or engage_eligible_until_year between 2020 and 2120);

create index if not exists profiles_membership_year
  on public.profiles (membership_year);
create unique index if not exists profiles_email_unique_ci
  on public.profiles (lower(email)) where email is not null;
create index if not exists profiles_engage_eligibility
  on public.profiles (engage_eligible_until_year, engage_status_year);

-- profiles is queried client-side for public maker names. Replace broad table
-- reads with a safe column allow-list so private membership data cannot be
-- requested with the public Supabase key.
revoke select on table public.profiles from anon, authenticated;
grant select (id, display_name, public_name, name_preference, credit_consented)
  on table public.profiles to anon;
grant select (id, email, display_name, public_name, name_preference, credit_consented)
  on table public.profiles to authenticated;

revoke update on table public.profiles from anon, authenticated;
grant update (public_name, name_preference, credit_consented)
  on table public.profiles to authenticated;

commit;
