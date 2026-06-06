# Feature Implementation Guide: Automation Rules & Performance Optimization

## Overview

This guide explains the two new features added to TaskFlow:

1. **Automation Rules** - Create custom rules to automate task management
2. **Performance Optimization** - Handle large task lists efficiently with pagination and virtual scrolling

---

## 🤖 Feature 1: Automation Rules

### What It Does

Automation Rules let you create conditions that automatically trigger actions when certain events happen. For example:

- "When priority is urgent, send email reminder every 4 hours"
- "When task becomes overdue, move it to 'At Risk' status"
- "When tags include 'bug', add comment 'Critical issue'"

### Database Schema

Two new tables are created:

#### `automation_rules` table
Stores rule definitions with the following key fields:

```sql
- id: UUID (primary key)
- workspace_id: UUID (workspace reference)
- name: VARCHAR(255) - Rule name
- description: TEXT - Optional description
- is_active: BOOLEAN - Enable/disable rule
- trigger_type: VARCHAR(50) - Type of trigger event
- trigger_config: JSONB - Trigger configuration
- action_type: VARCHAR(50) - Type of action to execute
- action_config: JSONB - Action configuration
- created_by: UUID - User who created the rule
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### `rule_executions` table
Logs each time a rule is executed:

```sql
- id: UUID (primary key)
- rule_id: UUID - Reference to automation rule
- task_id: UUID - Reference to affected task
- status: VARCHAR(50) - 'success', 'failed', or 'pending'
- error_message: TEXT - Error details if failed
- executed_at: TIMESTAMP
```

### Supported Triggers

| Trigger Type | Description | Config |
|---|---|---|
| `priority_change` | When task priority matches specified level | `{ priority: 'urgent' \| 'high' \| 'medium' \| 'low' }` |
| `status_change` | When task status changes to specified value | `{ status: 'todo' \| 'in_progress' \| 'done' }` |
| `overdue` | When task deadline has passed | `{}` |
| `due_soon` | When task deadline is approaching | `{ hoursUntilDue: 24 }` |
| `tag_match` | When task tags include specified values | `{ tags: ['bug', 'urgent'] }` |

### Supported Actions

| Action Type | Description | Config |
|---|---|---|
| `send_reminder` | Send a reminder notification | `{ channel: 'in_app' \| 'email', minutes: 60 }` |
| `move_status` | Automatically move task to different status | `{ newStatus: 'in_progress' }` |
| `add_tag` | Add a tag to the task | `{ tagToAdd: 'at-risk' }` |
| `change_priority` | Change task priority | `{ newPriority: 'urgent' }` |
| `add_comment` | Add automated comment | `{ commentText: 'Task is overdue' }` |

### API Actions

Located in `lib/actions/automation-rules.ts`:

```typescript
// Get all rules for workspace
getAutomationRules(workspaceId: string): Promise<AutomationRule[]>

// Create new rule
createAutomationRule(workspaceId: string, rule: CreateRuleInput): Promise<AutomationRule>

// Update rule
updateAutomationRule(ruleId: string, updates: UpdateRuleInput): Promise<AutomationRule>

// Delete rule
deleteAutomationRule(ruleId: string): Promise<void>

// Toggle rule on/off
toggleRuleActive(ruleId: string, isActive: boolean): Promise<AutomationRule>

// Get execution history
getRuleExecutionHistory(ruleId: string, limit?: number, offset?: number): Promise<RuleExecution[]>

// Get success rate and stats
getRuleExecutionStats(ruleId: string): Promise<{ total, success, failed, pending, successRate }>
```

### Rule Engine Service

Located in `lib/services/rule-engine.ts`:

```typescript
// Execute rules for a specific task
executeAutomationRules(workspaceId: string, taskId: string): Promise<void>

// Run all rules for all tasks in workspace (use in scheduled jobs)
executeScheduledRules(workspaceId: string): Promise<void>
```

### UI Component

Use the `AutomationRulesManager` component in settings:

```tsx
import { AutomationRulesManager } from '@/components/settings/AutomationRulesManager'

<AutomationRulesManager workspaceId={workspaceId} />
```

Features:
- Create, edit, delete rules
- Enable/disable individual rules
- View execution history and success rates
- Form validation

### Usage Example

```typescript
// In a task update action
import { executeAutomationRules } from '@/lib/services/rule-engine'

export async function updateTask(taskId: string, updates: any) {
  // ... update task in database ...
  
  // Trigger automation rules
  await executeAutomationRules(workspaceId, taskId)
}
```

---

## ⚡ Feature 2: Performance Optimization

### What It Does

Handles large task lists efficiently with:

- **Pagination** - Load tasks in batches
- **Virtual Scrolling** - Render only visible items
- **In-Memory Caching** - Cache frequently accessed data
- **Database Indexes** - Optimized query performance
- **Full-Text Search** - Fast search with TSVECTOR

### Query Helpers

Located in `lib/services/performance.ts`:

#### Pagination Functions

```typescript
// Get tasks with pagination
getTasksPaginated(workspaceId: string, params?: {
  page?: number
  limit?: number
  offset?: number
}): Promise<PaginatedResult<Task>>

// Get by status with caching
getTasksByStatusPaginated(
  workspaceId: string,
  status: 'todo' | 'in_progress' | 'done',
  params?: PaginationParams,
  useCache?: boolean
): Promise<PaginatedResult<Task>>

// Search with pagination
searchTasksPaginated(
  workspaceId: string,
  searchTerm: string,
  params?: PaginationParams
): Promise<PaginatedResult<Task>>

// Get by priority with pagination
getTasksByPriorityPaginated(
  workspaceId: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  params?: PaginationParams
): Promise<PaginatedResult<Task>>
```

#### Result Format

```typescript
interface PaginatedResult<T> {
  data: T[]              // Array of items
  total: number          // Total items in database
  page: number           // Current page
  limit: number          // Items per page
  totalPages: number     // Total number of pages
  hasMore: boolean       // Whether more items exist
}
```

#### Cache Functions

```typescript
// Invalidate cache for workspace
invalidateTaskCache(workspaceId: string, status?: string): void

// Clear all cache
clearAllCache(): void

// Get cache statistics
getCacheStats(): { size: number; entries: string[] }
```

### Virtual Scrolling Components

Located in `components/shared/VirtualScroller.tsx`:

#### VirtualScroller Component

Renders only visible items for massive lists:

```tsx
import { VirtualScroller } from '@/components/shared/VirtualScroller'

<VirtualScroller
  items={tasks}
  renderItem={(task, index) => <TaskCard task={task} />}
  itemHeight={80}
  containerHeight={600}
  isLoading={isLoading}
  hasMore={hasMore}
  onLoadMore={loadMore}
/>
```

Props:
- `items: T[]` - Array of items to render
- `renderItem: (item, index) => ReactNode` - Render function
- `itemHeight?: number` - Height of each item (default: 80)
- `containerHeight?: number` - Container height (default: 600)
- `isLoading?: boolean` - Show loading state
- `hasMore?: boolean` - More items available
- `onLoadMore?: () => Promise<void>` - Load more callback

#### InfiniteScrollList Component

Alternative approach using Intersection Observer:

```tsx
import { InfiniteScrollList } from '@/components/shared/VirtualScroller'

<InfiniteScrollList
  items={tasks}
  renderItem={(task) => <TaskCard task={task} />}
  onLoadMore={loadMore}
  isLoading={isLoading}
  hasMore={hasMore}
/>
```

### Database Optimizations

New indexes created for common queries:

```sql
-- Status queries (most common)
CREATE INDEX idx_tasks_workspace_status 
  ON tasks(workspace_id, status) 
  WHERE is_archived = false

-- Priority queries
CREATE INDEX idx_tasks_workspace_priority 
  ON tasks(workspace_id, priority)

-- Date range queries
CREATE INDEX idx_tasks_due_date 
  ON tasks(due_date) 
  WHERE due_date IS NOT NULL

-- Recent tasks
CREATE INDEX idx_tasks_created_at 
  ON tasks(created_at DESC)

-- Full-text search
CREATE INDEX idx_task_search 
  ON tasks USING gin(search_text)
```

### Materialized Views

```sql
-- Task counts by status (refreshed on demand)
task_count_by_status

-- Query statistics (for monitoring)
query_stats
```

### Usage Example

```typescript
// Using pagination in a component
export function TaskListPage() {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<PaginatedResult<Task> | null>(null)

  useEffect(() => {
    getTasksByStatusPaginated(
      workspaceId,
      'todo',
      { page, limit: 20 },
      true  // Use cache
    ).then(setResult)
  }, [page])

  if (!result) return <Loader />

  return (
    <>
      <VirtualScroller
        items={result.data}
        renderItem={(task) => <TaskCard task={task} />}
        onLoadMore={() => setPage(page + 1)}
        hasMore={result.hasMore}
      />
      
      <Pagination
        current={result.page}
        total={result.totalPages}
        onChange={setPage}
      />
    </>
  )
}
```

### Cache Strategy

- **Duration**: 5 minutes default
- **Key Format**: `tasks:{workspaceId}:{status}:{page}:{limit}`
- **Invalidation**: Automatic on task update/create/delete
- **Manual Control**: `invalidateTaskCache()` for custom invalidation

---

## 🔧 Setup Instructions

### 1. Apply Database Migrations

```bash
# Apply migrations
supabase migration up

# Or if using local Supabase:
supabase db push
```

This will create:
- `automation_rules` table
- `rule_executions` table
- Performance indexes
- Materialized views
- Full-text search support

### 2. Enable in Application

Automation rules are automatically integrated in Settings > Automation Rules

Virtual scrolling is optional - use components where needed for large lists

### 3. Schedule Rule Execution (Optional)

For recurring rule execution, set up a scheduled job:

```typescript
// In an Edge Function or scheduled cron job
import { executeScheduledRules } from '@/lib/services/rule-engine'

export async function scheduledRuleExecution(request: Request) {
  const workspaceId = 'your-workspace-id'
  await executeScheduledRules(workspaceId)
  return new Response('Rules executed')
}
```

Configure as:
- **Frequency**: Every 5-15 minutes (depending on load)
- **Timeout**: 60-120 seconds
- **Retry**: 3 attempts

---

## 📊 Monitoring

### Rule Execution

Check execution history in Settings:
- Success rate
- Error logs
- Execution count
- Last execution time

### Performance Metrics

Monitor cache and query performance:

```typescript
// Get cache stats
const stats = getCacheStats()
console.log(`Cache size: ${stats.size} entries`)

// Query execution time
console.time('getTasksPaginated')
const result = await getTasksPaginated(workspaceId)
console.timeEnd('getTasksPaginated')
```

---

## 🐛 Troubleshooting

### Rules Not Executing

1. Check `is_active` status is true
2. Verify `trigger_config` matches task properties
3. Check `rule_executions` table for errors
4. Ensure workspace membership is correct

### Slow Performance

1. Check query execution time
2. Verify indexes are created
3. Clear cache if needed: `clearAllCache()`
4. Monitor database slow query logs

### Cache Issues

1. Invalidate cache: `invalidateTaskCache(workspaceId)`
2. Check TTL (default: 5 min)
3. Monitor `getCacheStats()`

---

## 📝 Best Practices

### Automation Rules

1. **Start simple** - Begin with one rule, add complexity gradually
2. **Test triggers** - Verify trigger conditions match your intent
3. **Monitor execution** - Check success rates regularly
4. **Avoid loops** - Don't create rules that trigger each other
5. **Document purpose** - Use descriptions to explain each rule

### Performance

1. **Use pagination** - Limit results to 20-50 items per request
2. **Enable caching** - Use cache for frequently accessed data
3. **Virtual scroll** - Use for lists > 100 items
4. **Invalidate wisely** - Minimize cache invalidation
5. **Monitor metrics** - Track query times and cache hit rates

---

## 📚 Examples

### Example 1: Urgent Task Reminder

**Scenario**: Send email reminder for urgent tasks due tomorrow

```typescript
const rule = await createAutomationRule(workspaceId, {
  name: 'Urgent Task Reminders',
  description: 'Email when urgent tasks are due tomorrow',
  trigger_type: 'due_soon',
  trigger_config: { hoursUntilDue: 24 },
  action_type: 'send_reminder',
  action_config: { channel: 'email', minutes: 1440 },
  is_active: true,
})
```

### Example 2: Auto-Tag Bug Fixes

**Scenario**: Auto-tag tasks with 'fixed' when moved to done

```typescript
const rule = await createAutomationRule(workspaceId, {
  name: 'Tag Fixed Bugs',
  description: 'Auto-tag as fixed when bug tasks are completed',
  trigger_type: 'status_change',
  trigger_config: { status: 'done' },
  action_type: 'add_tag',
  action_config: { tagToAdd: 'fixed' },
  is_active: true,
})
```

### Example 3: Overdue Task Alert

**Scenario**: Change priority to urgent when task is overdue

```typescript
const rule = await createAutomationRule(workspaceId, {
  name: 'Escalate Overdue Tasks',
  description: 'Change overdue tasks to urgent priority',
  trigger_type: 'overdue',
  trigger_config: {},
  action_type: 'change_priority',
  action_config: { newPriority: 'urgent' },
  is_active: true,
})
```

---

## 🎯 Next Steps

1. ✅ Apply migrations to Supabase
2. ✅ Test automation rules in Settings
3. ✅ Create rules for your workflow
4. ✅ Monitor execution and adjust
5. ✅ Use virtual scrolling for large lists
6. ✅ Monitor cache performance

Selamat! Fitur baru sudah siap digunakan! 🚀
