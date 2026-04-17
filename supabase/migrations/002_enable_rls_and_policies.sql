-- Enable RLS on all tables
alter table public.profiles           enable row level security;
alter table public.workspaces         enable row level security;
alter table public.workspace_members  enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_assignees     enable row level security;
alter table public.task_comments      enable row level security;
alter table public.task_attachments   enable row level security;
alter table public.calendar_events    enable row level security;
alter table public.reminders          enable row level security;

-- Helper function: cek apakah user adalah member workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- ── PROFILES ──
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select using (id = auth.uid());

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
  on public.profiles for insert with check (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (id = auth.uid());

-- ── WORKSPACES ──
drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces"
  on public.workspaces for select
  using (public.is_workspace_member(id));

drop policy if exists "Users can create workspaces" on public.workspaces;
create policy "Users can create workspaces"
  on public.workspaces for insert
  with check (owner_id = auth.uid());

drop policy if exists "Owners can update workspace" on public.workspaces;
create policy "Owners can update workspace"
  on public.workspaces for update
  using (owner_id = auth.uid());

-- ── WORKSPACE_MEMBERS ──
drop policy if exists "Workspace members can view members" on public.workspace_members;
create policy "Workspace members can view members"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace owners can add members" on public.workspace_members;
create policy "Workspace owners can add members"
  on public.workspace_members for insert
  with check (
    exists (
      select 1 from public.workspaces
      where id = workspace_id and owner_id = auth.uid()
    )
  );

-- ── TASK_ASSIGNEES ──
drop policy if exists "Workspace members can view assignees" on public.task_assignees;
create policy "Workspace members can view assignees"
  on public.task_assignees for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_workspace_member(t.workspace_id)
    )
  );

drop policy if exists "Workspace members can update assignees" on public.task_assignees;
create policy "Workspace members can update assignees"
  on public.task_assignees for insert
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_workspace_member(t.workspace_id)
    )
  );

-- ── TASKS ──
drop policy if exists "Workspace members can view tasks" on public.tasks;
create policy "Workspace members can view tasks"
  on public.tasks for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can create tasks" on public.tasks;
create policy "Workspace members can create tasks"
  on public.tasks for insert
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can update tasks" on public.tasks;
create policy "Workspace members can update tasks"
  on public.tasks for update
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Task creator or admin can delete" on public.tasks;
create policy "Task creator or admin can delete"
  on public.tasks for delete
  using (
    created_by = auth.uid() or
    exists (
      select 1 from public.workspace_members
      where workspace_id = tasks.workspace_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- ── CALENDAR EVENTS ──
drop policy if exists "Workspace members can view events" on public.calendar_events;
create policy "Workspace members can view events"
  on public.calendar_events for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can create events" on public.calendar_events;
create policy "Workspace members can create events"
  on public.calendar_events for insert
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "Workspace members can update events" on public.calendar_events;
create policy "Workspace members can update events"
  on public.calendar_events for update
  using (public.is_workspace_member(workspace_id));

drop policy if exists "Creator can delete events" on public.calendar_events;
create policy "Creator can delete events"
  on public.calendar_events for delete
  using (created_by = auth.uid());

-- ── REMINDERS ──
drop policy if exists "Users can manage their own reminders" on public.reminders;
create policy "Users can manage their own reminders"
  on public.reminders for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── TASK COMMENTS ──
drop policy if exists "Workspace members can view comments" on public.task_comments;
create policy "Workspace members can view comments"
  on public.task_comments for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_workspace_member(t.workspace_id)
    )
  );

drop policy if exists "Workspace members can add comments" on public.task_comments;
create policy "Workspace members can add comments"
  on public.task_comments for insert
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_workspace_member(t.workspace_id)
    )
  );

drop policy if exists "Authors can edit their comments" on public.task_comments;
create policy "Authors can edit their comments"
  on public.task_comments for update using (user_id = auth.uid());

drop policy if exists "Authors can delete their comments" on public.task_comments;
create policy "Authors can delete their comments"
  on public.task_comments for delete using (user_id = auth.uid());

-- ── TASK ATTACHMENTS ──
drop policy if exists "Workspace members can view attachments" on public.task_attachments;
create policy "Workspace members can view attachments"
  on public.task_attachments for select
  using (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_workspace_member(t.workspace_id)
    )
  );

drop policy if exists "Workspace members can upload attachments" on public.task_attachments;
create policy "Workspace members can upload attachments"
  on public.task_attachments for insert
  with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_id and public.is_workspace_member(t.workspace_id)
    )
  );
