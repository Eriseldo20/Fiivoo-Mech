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

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <ListChecks className="h-5 w-5 text-primary" />
          {t('tasks')}
        </h2>
        <span className="text-sm font-medium text-muted-foreground">
          {doneCount}/{tasks.length}
        </span>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-1">
        {tasks.map((task) => (
          <li key={task.id}>
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50',
                task.is_done && 'opacity-60',
              )}
            >
              <Checkbox
                checked={task.is_done}
                onCheckedChange={(checked) => handleToggle(task.id, checked === true)}
                className="mt-0.5"
              />
              <span
                className={cn(
                  'text-sm leading-relaxed text-foreground',
                  task.is_done && 'line-through',
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
