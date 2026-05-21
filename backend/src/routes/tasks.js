import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { supabase } from '../lib/supabase.js'
import { enqueueJob } from '../lib/queue.js'

const router = Router()

// POST /api/tasks — create a new task run
router.post('/', async (req, res) => {
  const { goal, userId } = req.body
  if (!goal || !userId) return res.status(400).json({ error: 'goal and userId required' })

  const taskId = uuid()

  // Persist task to Supabase
  const { error } = await supabase.from('tasks').insert({
    id: taskId,
    user_id: userId,
    goal,
    status: 'queued',
  })
  if (error) return res.status(500).json({ error: error.message })

  // Enqueue job into Supabase jobs table — worker polls and picks it up
  await enqueueJob(taskId, goal, userId)

  res.status(201).json({ taskId })
})

// GET /api/tasks/:id — fetch task status + subtasks
router.get('/:id', async (req, res) => {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .eq('id', req.params.id)
    .single()

  if (error) return res.status(404).json({ error: 'Task not found' })
  res.json(task)
})

export default router
