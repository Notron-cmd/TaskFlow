-- ─────────────────────────────────────────
-- TASK MANAGEMENT FUNCTIONS
-- ─────────────────────────────────────────

-- Function: move task ke kolom lain dan reorder positions
create or replace function public.move_task(
  p_task_id     uuid,
  p_new_status  task_status,
  p_new_position integer
)
returns void as $$
begin
  -- Geser tasks lain di kolom tujuan
  update public.tasks
  set position = position + 1
  where workspace_id = (select workspace_id from public.tasks where id = p_task_id)
    and status = p_new_status
    and position >= p_new_position
    and id != p_task_id;

  -- Update task yang di-drag
  update public.tasks
  set status = p_new_status, position = p_new_position
  where id = p_task_id;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────
-- CALENDAR & DUE DATE SYNC FUNCTIONS
-- ─────────────────────────────────────────

-- Function: sync due_date task ketika calendar event di-reschedule
create or replace function public.sync_task_due_date()
returns trigger as $$
begin
  if new.linked_task_id is not null and new.start_at != old.start_at then
    update public.tasks
    set due_date = new.start_at, updated_at = now()
    where id = new.linked_task_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_event_rescheduled on public.calendar_events;
create trigger on_event_rescheduled
  after update on public.calendar_events
  for each row execute procedure public.sync_task_due_date();

-- Function: auto-create calendar event ketika task due_date di-set
create or replace function public.sync_calendar_on_due_date()
returns trigger as $$
declare
  v_event_id uuid;
begin
  -- due_date baru di-set, belum ada event
  if new.due_date is not null and new.calendar_event_id is null then
    insert into public.calendar_events (
      workspace_id, created_by, title, start_at, end_at, type, linked_task_id
    ) values (
      new.workspace_id,
      new.created_by,
      'Due: ' || new.title,
      new.due_date,
      new.due_date,
      'task_due'::event_type,
      new.id
    ) returning id into v_event_id;

    new.calendar_event_id = v_event_id;
  end if;

  -- due_date di-update dan sudah ada event
  if new.due_date is not null and new.calendar_event_id is not null
     and new.due_date != old.due_date then
    update public.calendar_events
    set start_at = new.due_date, end_at = new.due_date, updated_at = now()
    where id = new.calendar_event_id;
  end if;

  -- due_date dihapus → hapus event
  if new.due_date is null and old.due_date is not null
     and old.calendar_event_id is not null then
    delete from public.calendar_events where id = old.calendar_event_id;
    new.calendar_event_id = null;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_due_date_changed on public.tasks;
create trigger on_task_due_date_changed
  before update on public.tasks
  for each row execute procedure public.sync_calendar_on_due_date();

-- ─────────────────────────────────────────
-- REMINDER FUNCTIONS
-- ─────────────────────────────────────────

-- Function: hitung scheduled_at reminder otomatis
create or replace function public.set_reminder_scheduled_at()
returns trigger as $$
declare
  v_event_start timestamptz;
begin
  select start_at into v_event_start
  from public.calendar_events
  where id = new.event_id;

  new.scheduled_at = v_event_start - (new.minutes_before || ' minutes')::interval;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_reminder_scheduled_at on public.reminders;
create trigger set_reminder_scheduled_at
  before insert on public.reminders
  for each row execute procedure public.set_reminder_scheduled_at();

-- ─────────────────────────────────────────
-- STATS TRACKING
-- ─────────────────────────────────────────

-- Function: update task counter saat task comment ditambah
create or replace function public.update_task_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.tasks set comment_count = comment_count + 1 where id = new.task_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.tasks set comment_count = greatest(comment_count - 1, 0) where id = old.task_id;
    return old;
  end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists on_task_comment_count_change on public.task_comments;
create trigger on_task_comment_count_change
  after insert or delete on public.task_comments
  for each row execute procedure public.update_task_comment_count();

-- Function: update task counter saat attachment ditambah
create or replace function public.update_task_attachment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.tasks set attachment_count = attachment_count + 1 where id = new.task_id;
    return new;
  elsif TG_OP = 'DELETE' then
    update public.tasks set attachment_count = greatest(attachment_count - 1, 0) where id = old.task_id;
    return old;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_task_attachment_count_change on public.task_attachments;
create trigger on_task_attachment_count_change
  after insert or delete on public.task_attachments
  for each row execute procedure public.update_task_attachment_count();
