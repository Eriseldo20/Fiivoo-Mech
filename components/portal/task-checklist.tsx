'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleJobTask } from '@/lib/actions/job-tasks'
import { cn } from '@/lib/utils'
import { ListChecks } from 'lucide-react'

export type JobTask = {
  id: string
  title: string
  is_done: boolean
}

export function TaskChecklist({ tasks: initialTasks }: { tasks: JobTask[] }) {
  const t = useTranslations('portal')
  const [tasks, setTasks] = useState<JobTask[]>(initialTasks)
  const [, startTransition] = useTransition()

  const doneCount = tasks.filter((task) => task.is_done).length
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

  const handleToggle = (taskId: string, next: boolean) => {
    // Optimistic update
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, is_done: next } : task)))
    startTransition(async () => {
      const res = await toggleJobTask(taskId, next)
      if (res?.error) {
        // Revert on failure
        setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, is_done: !next } : task)))
      }
    })
  }

  if (tasks.length === 0) return null

  const allDone = doneCount === tasks.length

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-bold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ListChecks className="h-4 w-4" />
          </span>
          {t('tasks')}
        </h2>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-sm font-bold tabular-nums',
            allDone ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground',
          )}
        >
          {doneCount}/{tasks.length}
        </span>
      </div>

      <div className="mb-5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            allDone ? 'bg-emerald-600' : 'bg-gradient-to-r from-primary to-sky-500',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 transition-all',
                task.is_done
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-border bg-background hover:border-primary/40 hover:bg-muted/50',
              )}
            >
              <Checkbox
                checked={task.is_done}
                onCheckedChange={(checked) => handleToggle(task.id, checked === true)}
                className="h-5 w-5 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
              />
              <span
                className={cn(
                  'text-sm font-medium leading-relaxed',
                  task.is_done ? 'text-muted-foreground line-through' : 'text-foreground',
                )}
              >
                {task.title}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  )
}
