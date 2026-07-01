'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addJobTask, deleteJobTask, toggleJobTask } from '@/lib/actions/job-tasks'
import { cn } from '@/lib/utils'
import { ListChecks, Plus, Trash2, Loader2 } from 'lucide-react'

export type JobTask = {
  id: string
  title: string
  is_done: boolean
}

export function JobTaskManager({
  jobId,
  tasks: initialTasks,
}: {
  jobId: string
  tasks: JobTask[]
}) {
  const t = useTranslations('portal')
  const [tasks, setTasks] = useState<JobTask[]>(initialTasks)
  const [newTitle, setNewTitle] = useState('')
  const [isPending, startTransition] = useTransition()

  const doneCount = tasks.filter((task) => task.is_done).length

  const handleToggle = (taskId: string, next: boolean) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, is_done: next } : task)))
    startTransition(async () => {
      const res = await toggleJobTask(taskId, next)
      if (res?.error) {
        setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, is_done: !next } : task)))
      }
    })
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    const tempId = `temp-${Date.now()}`
    setTasks((prev) => [...prev, { id: tempId, title, is_done: false }])
    setNewTitle('')
    startTransition(async () => {
      const res = await addJobTask(jobId, title)
      if (res?.error) {
        setTasks((prev) => prev.filter((task) => task.id !== tempId))
      }
    })
  }

  const handleDelete = (taskId: string) => {
    const snapshot = tasks
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    startTransition(async () => {
      const res = await deleteJobTask(taskId)
      if (res?.error) setTasks(snapshot)
    })
  }

  return (
    <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ListChecks className="h-5 w-5 text-primary" />
          {t('tasks')}
        </h2>
        {tasks.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {doneCount}/{tasks.length}
          </span>
        )}
      </div>

      <ul className="mb-4 space-y-1">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
          >
            <Checkbox
              checked={task.is_done}
              onCheckedChange={(checked) => handleToggle(task.id, checked === true)}
            />
            <span
              className={cn(
                'flex-1 text-sm text-foreground',
                task.is_done && 'text-muted-foreground line-through',
              )}
            >
              {task.title}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(task.id)}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label={t('deleteTask')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {tasks.length === 0 && (
          <li className="px-2 py-3 text-sm text-muted-foreground">{t('noTasksYet')}</li>
        )}
      </ul>

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t('addTaskPlaceholder')}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isPending || !newTitle.trim()}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
