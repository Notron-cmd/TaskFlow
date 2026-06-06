-- Add pagination support and caching columns to tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS cache_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Create materialized view for task counts (for performance)
CREATE MATERIALIZED VIEW task_count_by_status AS
SELECT 
  workspace_id,
  status,
  COUNT(*) as count
FROM tasks
WHERE is_archived = false
GROUP BY workspace_id, status;

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status ON tasks(workspace_id, status) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_priority ON tasks(workspace_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_last_viewed ON tasks(last_viewed_at DESC);

-- Add columns for virtual scrolling optimization
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS search_text TSVECTOR;

-- Create function to update search text for full-text search
CREATE OR REPLACE FUNCTION update_task_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_task_search_text ON tasks;
CREATE TRIGGER trg_update_task_search_text
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_task_search_text();

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_task_search ON tasks USING gin(search_text);

-- Add query statistics view for monitoring
CREATE OR REPLACE VIEW query_stats AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo_count,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as progress_count,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as done_count
FROM tasks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
