'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  AutomationRule, 
  CreateRuleInput, 
  UpdateRuleInput,
  RuleExecution 
} from '@/types/automation.types'

// Get all rules for a workspace
export async function getAutomationRules(workspaceId: string): Promise<AutomationRule[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch automation rules: ${error.message}`)
  }

  return data || []
}

// Get a single rule
export async function getAutomationRule(ruleId: string): Promise<AutomationRule> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', ruleId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch automation rule: ${error.message}`)
  }

  return data
}

// Create a new rule
export async function createAutomationRule(
  workspaceId: string,
  rule: Omit<CreateRuleInput, 'workspace_id'>
): Promise<AutomationRule> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('automation_rules')
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      ...rule,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create automation rule: ${error.message}`)
  }

  revalidatePath('/settings')
  return data
}

// Update a rule
export async function updateAutomationRule(
  ruleId: string,
  updates: UpdateRuleInput
): Promise<AutomationRule> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('automation_rules')
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update automation rule: ${error.message}`)
  }

  revalidatePath('/settings')
  return data
}

// Delete a rule
export async function deleteAutomationRule(ruleId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('automation_rules')
    .delete()
    .eq('id', ruleId)

  if (error) {
    throw new Error(`Failed to delete automation rule: ${error.message}`)
  }

  revalidatePath('/settings')
}

// Toggle rule active status
export async function toggleRuleActive(ruleId: string, isActive: boolean): Promise<AutomationRule> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('automation_rules')
    .update({ is_active: isActive })
    .eq('id', ruleId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to toggle rule active status: ${error.message}`)
  }

  revalidatePath('/settings')
  return data
}

// Get rule execution history
export async function getRuleExecutionHistory(
  ruleId: string,
  limit: number = 50,
  offset: number = 0
): Promise<RuleExecution[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rule_executions')
    .select('*')
    .eq('rule_id', ruleId)
    .order('executed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to fetch rule execution history: ${error.message}`)
  }

  return data || []
}

// Get execution statistics
export async function getRuleExecutionStats(ruleId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rule_executions')
    .select('status')
    .eq('rule_id', ruleId)

  if (error) {
    throw new Error(`Failed to fetch execution stats: ${error.message}`)
  }

  const stats = {
    total: data?.length || 0,
    success: data?.filter(e => e.status === 'success').length || 0,
    failed: data?.filter(e => e.status === 'failed').length || 0,
    pending: data?.filter(e => e.status === 'pending').length || 0,
  }

  return {
    ...stats,
    successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
  }
}

// Clear old execution history (keep last 100)
export async function cleanupExecutionHistory(ruleId: string): Promise<void> {
  const supabase = await createClient()

  // Get all execution IDs, sorted by created_at
  const { data: executions, error: fetchError } = await supabase
    .from('rule_executions')
    .select('id')
    .eq('rule_id', ruleId)
    .order('executed_at', { ascending: false })

  if (fetchError) {
    throw new Error(`Failed to fetch executions: ${fetchError.message}`)
  }

  if (!executions || executions.length <= 100) {
    return
  }

  // Delete old records
  const idsToDelete = executions.slice(100).map(e => e.id)
  
  const { error } = await supabase
    .from('rule_executions')
    .delete()
    .in('id', idsToDelete)

  if (error) {
    throw new Error(`Failed to cleanup execution history: ${error.message}`)
  }
}
