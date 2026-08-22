-- Store the calculated graduation year while keeping the member-facing form
-- to one relative "years remaining" question.

begin;

alter table public.profiles
  add column if not exists membership_email_confirmed_at timestamptz,
  add column if not exists interests_to_gain text
    check (interests_to_gain is null or char_length(interests_to_gain) <= 2000),
  add column if not exists expected_graduation_year integer
    check (expected_graduation_year is null or expected_graduation_year between 2020 and 2120),
  -- Kept temporarily for compatibility with the previously deployed admin
  -- API. The new application no longer reads or writes this column.
  add column if not exists graduating_this_year boolean;

create unique index if not exists profiles_email_unique_ci
  on public.profiles (lower(email)) where email is not null;

update public.profiles
set expected_graduation_year = study_years_as_of_year + study_years_remaining - 1
where expected_graduation_year is null
  and study_years_as_of_year is not null
  and study_years_remaining is not null;

commit;
