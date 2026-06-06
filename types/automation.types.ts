// Automation Rules Types
export type TriggerType = 
  | 'priority_change' 
  | 'status_change' 
  | 'overdue' 
  | 'due_soon' 
  | 'tag_match'
  | 'assignment_change';

export type ActionType = 
  | 'send_reminder' 
  | 'move_status' 
  | 'add_tag' 
  | 'assign_user'
  | 'change_priority'
  | 'add_comment';

export type ReminderChannel = 'in_app' | 'email' | 'push';

export interface TriggerConfig {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'done';
  hoursUntilDue?: number;
  tags?: string[];
  [key: string]: any;
}

export interface ActionConfig {
  channel?: ReminderChannel;
  minutes?: number;
  newStatus?: 'todo' | 'in_progress' | 'done';
  tagToAdd?: string;
  userId?: string;
  newPriority?: 'low' | 'medium' | 'high' | 'urgent';
  commentText?: string;
  [key: string]: any;
}

export interface AutomationRule {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_type: TriggerType;
  trigger_config: TriggerConfig;
  action_type: ActionType;
  action_config: ActionConfig;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RuleExecution {
  id: string;
  rule_id: string;
  task_id: string;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  executed_at: string;
}

export type CreateRuleInput = Omit<AutomationRule, 'id' | 'created_by' | 'created_at' | 'updated_at'>;
export type UpdateRuleInput = Partial<CreateRuleInput>;
