import { supabase } from './supabase.js'

/**
 * Add a job to the queue (insert a row into the jobs table)
 */
export async function enqueueJob(taskId, goal, userId) {
  const { error } = await supabase.from('jobs').insert({
    task_id: taskId,
    goal,
    user_id: userId,
    status: 'pending',
  })
  if (error) throw new Error(`Failed to enqueue job: ${error.message}`)
}

/**
 * Claim the next pending job atomically using a Postgres function.
 * Returns the job row or null if nothing is waiting.
 */
export async function claimNextJob() {
  const { data, error } = await supabase.rpc('claim_next_job')
  if (error) throw new Error(`Failed to claim job: ${error.message}`)
  return data?.[0] ?? null
}

/**
 * Mark a job as done or failed
 */
export async function updateJobStatus(taskId, status, errorMsg = null) {
  await supabase.from('jobs')
    .update({ status, error: errorMsg, updated_at: new Date().toISOString() })
    .eq('task_id', taskId)
}
