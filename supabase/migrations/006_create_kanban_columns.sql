-- Create kanban_columns table
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#94A3B8',
  icon TEXT DEFAULT 'circle', -- circle, loader2, check-circle2, flag, zap, etc
  status TEXT NOT NULL, -- Maps to tasks.status for tasks in this column
  position INT NOT NULL DEFAULT 0,
  wip_limit INT DEFAULT NULL, -- Work In Progress limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(workspace_id, status)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kanban_columns_workspace_id ON kanban_columns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_position ON kanban_columns(workspace_id, position);

-- Enable RLS
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kanban_columns
CREATE POLICY "kanban_columns_can_view" ON kanban_columns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = kanban_columns.workspace_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "kanban_columns_can_insert" ON kanban_columns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = kanban_columns.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "kanban_columns_can_update" ON kanban_columns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = kanban_columns.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "kanban_columns_can_delete" ON kanban_columns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = kanban_columns.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Create trigger to auto-create default columns for workspace
CREATE OR REPLACE FUNCTION create_default_kanban_columns()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kanban_columns (workspace_id, name, color, icon, status, position, wip_limit)
  VALUES 
    (NEW.id, 'To Do', '#94A3B8', 'circle', 'todo', 0, NULL),
    (NEW.id, 'In Progress', '#F59E0B', 'loader2', 'in_progress', 1, 5),
    (NEW.id, 'Done', '#14B8A6', 'check-circle2', 'done', 2, NULL)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_workspace_created_create_columns ON workspaces;
CREATE TRIGGER on_workspace_created_create_columns
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE PROCEDURE create_default_kanban_columns();
