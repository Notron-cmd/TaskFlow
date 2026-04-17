-- ─────────────────────────────────────────
-- AUTO-CREATE WORKSPACE TRIGGER
-- ─────────────────────────────────────────
-- Trigger untuk auto-create workspace saat profile dibuat
create or replace function public.handle_new_profile()
returns trigger as $$
declare
  workspace_id uuid;
begin
  -- Insert workspace untuk user baru
  insert into public.workspaces (name, slug, owner_id)
  values (
    'My Workspace',
    'workspace-' || new.id::text,
    new.id
  ) returning id into workspace_id;

  -- Tambahkan user sebagai owner di workspace_members
  insert into public.workspace_members (workspace_id, user_id, role)
  values (workspace_id, new.id, 'owner');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();
