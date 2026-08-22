-- Compatibility migration for databases that briefly ran the campaign-based
-- membership schema. It is also safe after the final profile-only migration.

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
  add column if not exists engage_welcome_sent_at timestamptz;

do $$
declare
  has_orphan boolean;
begin
  if to_regclass('public.membership_applications') is not null then
    if to_regclass('public.membership_campaigns') is null then
      raise exception 'Cannot migrate membership_applications without membership_campaigns';
    end if;

    execute $migration$
      with latest_application as (
        select distinct on (application.email)
          application.*,
          campaign.year as application_year
        from public.membership_applications as application
        join public.membership_campaigns as campaign on campaign.id = application.campaign_id
        order by application.email, campaign.year desc, application.updated_at desc
      )
      update public.profiles as profile
      set membership_joined_at = coalesce(profile.membership_joined_at, application.created_at),
          membership_updated_at = application.updated_at,
          membership_year = application.application_year,
          membership_consent_version = application.consent_version,
          membership_consented_at = application.consented_at,
          membership_email_confirmed_at = coalesce(
            profile.membership_email_confirmed_at,
            application.ghost_synced_at,
            application.consented_at
          ),
          upi = nullif(application.upi, 'NONE'),
          student_id = nullif(application.student_id, 'NONE'),
          study_years_remaining = application.study_years,
          study_years_as_of_year = case when application.study_years is null then null else application.application_year end,
          faculty = nullif(application.faculty, 'NONE'),
          expected_graduation_year = case
            when application.study_years is not null
              then application.application_year + application.study_years - 1
            else null
          end,
          skills_to_share = application.skills_to_share,
          ghost_member_id = application.ghost_member_id,
          membership_sync_status = application.ghost_sync_status,
          membership_sync_error = application.ghost_sync_error,
          engage_welcome_sent_at = coalesce(
            profile.engage_welcome_sent_at,
            application.engage_invited_at
          )
      from latest_application as application
      where lower(profile.email) = lower(application.email)
    $migration$;

    execute $orphan_check$
      select exists (
        select 1
        from public.membership_applications as application
        left join public.profiles as profile on lower(profile.email) = lower(application.email)
        where profile.id is null
      )
    $orphan_check$ into has_orphan;
    if has_orphan then
      raise exception 'Cannot remove membership_applications: at least one application has no matching profile';
    end if;
  end if;
end;
$$;

drop table if exists public.membership_engage_invites;
drop table if exists public.membership_applications;
drop table if exists public.membership_campaigns;

create index if not exists profiles_membership_year
  on public.profiles (membership_year);
create unique index if not exists profiles_email_unique_ci
  on public.profiles (lower(email)) where email is not null;
revoke select on table public.profiles from anon, authenticated;
grant select (id, display_name, public_name, name_preference, credit_consented)
  on table public.profiles to anon;
grant select (id, email, display_name, public_name, name_preference, credit_consented)
  on table public.profiles to authenticated;

revoke update on table public.profiles from anon, authenticated;
grant update (public_name, name_preference, credit_consented)
  on table public.profiles to authenticated;

commit;
