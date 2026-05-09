-- Create task_notes table
CREATE TABLE IF NOT EXISTS task_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_notes_task_id ON task_notes(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notes_user_id ON task_notes(user_id);

-- Enable RLS
ALTER TABLE task_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_notes
DROP POLICY IF EXISTS "Workspace members can view notes" ON task_notes;
CREATE POLICY "Workspace members can view notes" ON task_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_notes.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can add notes" ON task_notes;
CREATE POLICY "Workspace members can add notes" ON task_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_id
      AND workspace_members.user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors can edit their notes" ON task_notes;
CREATE POLICY "Authors can edit their notes" ON task_notes
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete their notes" ON task_notes;
CREATE POLICY "Authors can delete their notes" ON task_notes
  FOR DELETE USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_task_notes_updated_at ON task_notes;
CREATE TRIGGER trigger_update_task_notes_updated_at
  BEFORE UPDATE ON task_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_task_notes_updated_at();
