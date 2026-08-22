-- Consolidate small bookkeeping tables into the records they describe.
-- Published events already come from Ghost; the retired events rows are
-- preserved in docs/legacy-events-archive.json.

begin;

alter table public."Projects"
  add column if not exists submission_notified_at timestamptz;

alter table public.comments
  add column if not exists reported_at timestamptz;

do $$
begin
  if to_regclass('public.notification_log') is not null then
    execute $migrate_notifications$
      update public."Projects" as project
      set submission_notified_at = coalesce(project.submission_notified_at, notification.created_at)
      from public.notification_log as notification
      where notification.notification_key = 'new-post:' || project.id
    $migrate_notifications$;
  end if;

  if to_regclass('public.comment_reports') is not null then
    execute $migrate_reports$
      with first_report as (
        select comment_id, min(created_at) as reported_at
        from public.comment_reports
        group by comment_id
      )
      update public.comments as comment
      set reported_at = coalesce(comment.reported_at, report.reported_at)
      from first_report as report
      where comment.id = report.comment_id
    $migrate_reports$;
  end if;
end;
$$;

drop table if exists public.comment_reports;
drop table if exists public.notification_log;
drop table if exists public.events;

commit;
