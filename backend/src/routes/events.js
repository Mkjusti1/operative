import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// GET /api/events/:taskId
// Opens an SSE stream. On connect it replays all past events (resumability),
// then subscribes to Supabase Realtime for new ones.
router.get('/:taskId', async (req, res) => {
  const { taskId } = req.params

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  // 1. Replay all past events so tab-close + reopen works
  const { data: past } = await supabase
    .from('task_events')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  past?.forEach(e => send(e.type, e.payload))

  // 2. Subscribe to new events via Supabase Realtime
  const channel = supabase
    .channel(`task-events:${taskId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'task_events', filter: `task_id=eq.${taskId}` },
      ({ new: row }) => send(row.type, row.payload)
    )
    .subscribe()

  // 3. Heartbeat to keep connection alive (Render/Vercel kill idle SSE)
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 20_000)

  req.on('close', () => {
    clearInterval(heartbeat)
    supabase.removeChannel(channel)
  })
})

export default router
