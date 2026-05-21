import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { supabase } from '../lib/supabase.js';
import { enqueueJob } from '../lib/queue.js';

const router = Router();

// Check if email is whitelisted
async function isWhitelisted(userId) {
  const { data: user, error: userError } =
    await supabase.auth.admin.getUserById(userId);
  if (userError || !user) return false;

  const email = user.user.email;
  const { data, error } = await supabase
    .from('whitelist')
    .select('id')
    .eq('email', email)
    .single();

  return !error && !!data;
}

// POST /api/tasks
router.post('/', async (req, res) => {
  const { goal, userId } = req.body;
  if (!goal || !userId)
    return res.status(400).json({ error: 'goal and userId required' });

  // Whitelist check
  const allowed = await isWhitelisted(userId);
  if (!allowed) {
    return res.status(403).json({
      error: 'Access restricted. Contact the owner to request access.',
    });
  }

  const taskId = uuid();

  const { error } = await supabase.from('tasks').insert({
    id: taskId,
    user_id: userId,
    goal,
    status: 'queued',
  });
  if (error) return res.status(500).json({ error: error.message });

  await enqueueJob(taskId, goal, userId);

  res.status(201).json({ taskId });
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

export default router;
