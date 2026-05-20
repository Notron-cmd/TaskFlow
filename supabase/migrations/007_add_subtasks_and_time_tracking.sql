-- Create task_subtasks table
CREATE TABLE IF NOT EXISTS task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  position INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Create task_time_logs table
CREATE TABLE IF NOT EXISTS task_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  duration_minutes INT NOT NULL,
  description TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Add time estimate column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_time_spent_minutes INT DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_id ON task_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task_id ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_user_id ON task_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_created_at ON task_time_logs(created_at);

-- Enable RLS
ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_subtasks
CREATE POLICY "task_subtasks_can_view" ON task_subtasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_subtasks.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "task_subtasks_can_insert" ON task_subtasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_subtasks.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "task_subtasks_can_update" ON task_subtasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_subtasks.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "task_subtasks_can_delete" ON task_subtasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_subtasks.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

-- RLS Policies for task_time_logs
CREATE POLICY "task_time_logs_can_view" ON task_time_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_time_logs.task_id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "task_time_logs_can_insert" ON task_time_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      INNER JOIN workspace_members ON tasks.workspace_id = workspace_members.workspace_id
      WHERE tasks.id = task_time_logs.task_id
      AND workspace_members.user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

CREATE POLICY "task_time_logs_can_delete" ON task_time_logs
  FOR DELETE USING (
    user_id = auth.uid()
  );
