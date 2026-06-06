// Rule Engine Service - Executes automation rules
import { createClient } from '@/lib/supabase/server'
import { AutomationRule, TriggerConfig, ActionConfig } from '@/types/automation.types'
import { addReminder } from './reminders'

export async function executeAutomationRules(
  workspaceId: string,
  taskId: string
) {
  const supabase = await createClient()

  // Get all active rules for workspace
  const { data: rules, error: rulesError } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)

  if (rulesError || !rules) return

  // Get task details for trigger evaluation
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single()

  if (taskError || !task) return

  // Evaluate each rule
  for (const rule of rules) {
    try {
      const shouldExecute = evaluateTrigger(
        rule.trigger_type,
        rule.trigger_config,
        task
      )

      if (shouldExecute) {
        await executeAction(
          rule.action_type,
          rule.action_config,
          task,
          workspaceId
        )

        // Log successful execution
        await supabase
          .from('rule_executions')
          .insert({
            rule_id: rule.id,
            task_id: taskId,
            status: 'success',
          })
      }
    } catch (error) {
      // Log failed execution
      await supabase
        .from('rule_executions')
        .insert({
          rule_id: rule.id,
          task_id: taskId,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
    }
  }
}

function evaluateTrigger(
  triggerType: string,
  config: TriggerConfig,
  task: any
): boolean {
  switch (triggerType) {
    case 'priority_change':
      return task.priority === config.priority

    case 'status_change':
      return task.status === config.status

    case 'overdue':
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      return dueDate < new Date() && task.status !== 'done'

    case 'due_soon':
      if (!task.due_date) return false
      const now = new Date()
      const due = new Date(task.due_date)
      const hoursUntil = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
      return hoursUntil > 0 && 
             hoursUntil <= (config.hoursUntilDue || 24) && 
             task.status !== 'done'

    case 'tag_match':
      if (!config.tags || !task.tags) return false
      return config.tags.some(tag => task.tags.includes(tag))

    case 'assignment_change':
      return true // Check in task update action

    default:
      return false
  }
}

async function executeAction(
  actionType: string,
  config: ActionConfig,
  task: any,
  workspaceId: string
): Promise<void> {
  const supabase = await createClient()

  switch (actionType) {
    case 'send_reminder':
      await addReminder(
        task.id,
        config.minutes || 60,
        config.channel || 'in_app'
      )
      break

    case 'move_status':
      await supabase
        .from('tasks')
        .update({ status: config.newStatus })
        .eq('id', task.id)
      break

    case 'add_tag':
      const currentTags = task.tags || []
      if (!currentTags.includes(config.tagToAdd)) {
        await supabase
          .from('tasks')
          .update({ tags: [...currentTags, config.tagToAdd] })
          .eq('id', task.id)
      }
      break

    case 'change_priority':
      await supabase
        .from('tasks')
        .update({ priority: config.newPriority })
        .eq('id', task.id)
      break

    case 'add_comment':
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('task_comments')
          .insert({
            task_id: task.id,
            user_id: user.id,
            content: config.commentText || 'Automated comment',
          })
      }
      break
  }
}

// Periodic rule execution (should be called by a scheduled job)
export async function executeScheduledRules(workspaceId: string) {
  const supabase = await createClient()

  // Get all tasks in workspace that need rule evaluation
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('is_archived', false)

  if (error || !tasks) return

  // Execute rules for each task
  for (const task of tasks) {
    await executeAutomationRules(workspaceId, task.id)
  }
}
