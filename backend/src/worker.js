import 'dotenv/config'
import { supabase } from './lib/supabase.js'
import { claimNextJob, updateJobStatus } from './lib/queue.js'
import { planTask } from './agents/planner.js'
import { runDAG } from './agents/dag.js'
import { synthesize } from './agents/synthesizer.js'

/**
 * Persist an event to Supabase — Realtime pushes it to the SSE route automatically.
 */
async function persistEvent(taskId, type, payload) {
  await supabase.from('task_events').insert({ task_id: taskId, type, payload })
}

/**
 * Process a single job end-to-end.
 */
async function processJob(job) {
  const { task_id: taskId, goal } = job
  const emit = (type, payload) => persistEvent(taskId, type, payload)

  try {
    await supabase.from('tasks').update({ status: 'running' }).eq('id', taskId)
    emit('task:start', { taskId, goal })

    // 1. Plan
    emit('planner:start', {})
    const subtasks = await planTask(goal)
    emit('planner:done', { subtasks })

    // 2. Persist subtasks
    await supabase.from('subtasks').insert(
      subtasks.map(s => ({
        id: `${taskId}-${s.id}`,
        task_id: taskId,
        label: s.task,
        tool: s.tool,
        depends_on: s.dependsOn,
        status: 'pending',
      }))
    )

    // 3. Execute DAG
    const results = await runDAG(subtasks, taskId, emit)

    // 4. Synthesize
    const finalOutput = await synthesize(goal, [...results.values()], emit)

    // 5. Mark done
    await supabase.from('tasks').update({
      status: 'done',
      output: finalOutput,
      completed_at: new Date().toISOString(),
    }).eq('id', taskId)

    await updateJobStatus(taskId, 'done')
    emit('task:done', { taskId, output: finalOutput })

  } catch (err) {
    console.error('Job error:', err)
    await supabase.from('tasks').update({ status: 'error', error: err.message }).eq('id', taskId)
    await updateJobStatus(taskId, 'failed', err.message)
    emit('task:error', { message: err.message })
  }
}

/**
 * Poll Supabase every 2 seconds for pending jobs.
 * This replaces BullMQ + Redis entirely.
 */
async function startWorker() {
  console.log('Worker started — polling for jobs every 2s...')

  while (true) {
    try {
      const job = await claimNextJob()
      if (job) {
        console.log(`Processing job for task: ${job.task_id}`)
        await processJob(job)
      }
    } catch (err) {
      console.error('Poll error:', err.message)
    }

    // Wait 2 seconds before polling again
    await new Promise(r => setTimeout(r, 2000))
  }
}

startWorker()
