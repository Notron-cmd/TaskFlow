-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_comments
DROP POLICY IF EXISTS "Workspace members can view comments" ON task_comments;
CREATE POLICY "Workspace members can view comments" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_comments.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Workspace members can add comments" ON task_comments;
CREATE POLICY "Workspace members can add comments" ON task_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_id
      AND workspace_members.user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors can edit their comments" ON task_comments;
CREATE POLICY "Authors can edit their comments" ON task_comments
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete their comments" ON task_comments;
CREATE POLICY "Authors can delete their comments" ON task_comments
  FOR DELETE USING (user_id = auth.uid());

-- Create trigger to update comment count on tasks
CREATE OR REPLACE FUNCTION update_task_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tasks SET comment_count = comment_count + 1 WHERE id = NEW.task_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tasks SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.task_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_task_comment_count_change ON task_comments;
CREATE TRIGGER on_task_comment_count_change
  AFTER INSERT OR DELETE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comment_count();
