-- The website does not attempt to mirror Engage membership. It sends a single
-- post-confirmation email containing the official Maker Club Engage link.

begin;

alter table public.profiles
  add column if not exists engage_welcome_sent_at timestamptz;

-- Existing confirmed members must not receive a surprise historical email on
-- their next login. New registrations remain null until their email is sent.
update public.profiles
set engage_welcome_sent_at = coalesce(
  membership_email_confirmed_at,
  membership_updated_at,
  membership_joined_at,
  now()
)
where engage_welcome_sent_at is null
  and membership_email_confirmed_at is not null;

commit;
