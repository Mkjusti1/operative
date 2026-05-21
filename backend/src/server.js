import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import eventsRouter from './routes/events.js';
import { supabase } from './lib/supabase.js';
import { claimNextJob, updateJobStatus } from './lib/queue.js';
import { planTask } from './agents/planner.js';
import { runDAG } from './agents/dag.js';
import { synthesize } from './agents/synthesizer.js';

// ─── Express API ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/events', eventsRouter);

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on :${PORT}`));

// ─── Worker ───────────────────────────────────────────────────────────────────
async function persistEvent(taskId, type, payload) {
  await supabase.from('task_events').insert({ task_id: taskId, type, payload });
}

async function processJob(job) {
  const { task_id: taskId, goal } = job;
  const emit = (type, payload) => persistEvent(taskId, type, payload);

  try {
    await supabase.from('tasks').update({ status: 'running' }).eq('id', taskId);
    emit('task:start', { taskId, goal });

    emit('planner:start', {});
    const subtasks = await planTask(goal);
    emit('planner:done', { subtasks });

    await supabase.from('subtasks').insert(
      subtasks.map((s) => ({
        id: `${taskId}-${s.id}`,
        task_id: taskId,
        label: s.task,
        tool: s.tool,
        depends_on: s.dependsOn,
        status: 'pending',
      }))
    );

    const results = await runDAG(subtasks, taskId, emit);
    const finalOutput = await synthesize(goal, [...results.values()], emit);

    await supabase
      .from('tasks')
      .update({
        status: 'done',
        output: finalOutput,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    await updateJobStatus(taskId, 'done');
    emit('task:done', { taskId, output: finalOutput });
  } catch (err) {
    console.error('Job error:', err);
    await supabase
      .from('tasks')
      .update({ status: 'error', error: err.message })
      .eq('id', taskId);
    await updateJobStatus(taskId, 'failed', err.message);
    emit('task:error', { message: err.message });
  }
}

async function startWorker() {
  console.log('Worker started — polling for jobs every 2s...');
  while (true) {
    try {
      const job = await claimNextJob();
      if (job) {
        console.log(`Processing job for task: ${job.task_id}`);
        await processJob(job);
      }
    } catch (err) {
      console.error('Poll error:', err.message);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// Run API and worker together
startWorker();
