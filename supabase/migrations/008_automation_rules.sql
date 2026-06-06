-- Create automation_rules table
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  trigger_type VARCHAR(50) NOT NULL, -- 'priority_change', 'status_change', 'overdue', 'due_soon', 'tag_match'
  trigger_config JSONB NOT NULL, -- {'priority': 'urgent'} etc
  action_type VARCHAR(50) NOT NULL, -- 'send_reminder', 'move_status', 'add_tag', 'assign_user'
  action_config JSONB NOT NULL, -- {'channel': 'email', 'minutes': 240} etc
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create rule execution history
CREATE TABLE rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'pending'
  error_message TEXT,
  executed_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view rules in their workspace"
  ON automation_rules FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rules in their workspace"
  ON automation_rules FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rules in their workspace"
  ON automation_rules FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rules in their workspace"
  ON automation_rules FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view execution history"
  ON rule_executions FOR SELECT
  USING (
    rule_id IN (
      SELECT id FROM automation_rules 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes for performance
CREATE INDEX idx_automation_rules_workspace ON automation_rules(workspace_id);
CREATE INDEX idx_automation_rules_active ON automation_rules(workspace_id, is_active);
CREATE INDEX idx_rule_executions_rule ON rule_executions(rule_id);
CREATE INDEX idx_rule_executions_task ON rule_executions(task_id);
CREATE INDEX idx_rule_executions_created ON rule_executions(executed_at DESC);
