-- Add is_archived column to tasks table
ALTER TABLE tasks ADD COLUMN is_archived boolean DEFAULT false;

-- Add index for better query performance when filtering archived items
CREATE INDEX idx_tasks_is_archived ON tasks(workspace_id, is_archived);
CREATE INDEX idx_tasks_workspace_archived_status ON tasks(workspace_id, is_archived, status);

-- Add is_archived column to notes table
ALTER TABLE notes ADD COLUMN is_archived boolean DEFAULT false;

-- Add index for notes
CREATE INDEX idx_notes_is_archived ON notes(user_id, is_archived);
CREATE INDEX idx_notes_user_archived_updated ON notes(user_id, is_archived, updated_at);

-- Add soft delete timestamp column for audit purposes (optional but useful)
ALTER TABLE tasks ADD COLUMN archived_at timestamp with time zone;
ALTER TABLE notes ADD COLUMN archived_at timestamp with time zone;
