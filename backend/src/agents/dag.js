import { executeSubtask } from './executor.js'

/**
 * Run all subtasks respecting their dependsOn[] DAG.
 * Independent tasks execute in parallel; dependent tasks wait.
 *
 * @param {object[]} subtasks - from planner: { id, task, tool, dependsOn[] }
 * @param {string}   taskId
 * @param {Function} emit    - (type, payload) => void
 * @returns {Promise<Map<number, string>>} subtaskId → output
 */
export async function runDAG(subtasks, taskId, emit) {
  const results = new Map()           // id → string output
  const completed = new Set()
  const running = new Set()

  // Attach taskId so tools can reference it
  subtasks = subtasks.map(s => ({ ...s, taskId }))

  async function tryRun(subtask) {
    if (running.has(subtask.id) || completed.has(subtask.id)) return
    const deps = subtask.dependsOn || []
    if (!deps.every(d => completed.has(d))) return  // not ready yet

    running.add(subtask.id)

    const context = deps.map(d => results.get(d)).filter(Boolean)
    const output = await executeSubtask(subtask, context, emit)

    results.set(subtask.id, output)
    completed.add(subtask.id)
    running.delete(subtask.id)

    // Trigger anything that was waiting on this subtask
    const unlocked = subtasks.filter(s =>
      !completed.has(s.id) && !running.has(s.id)
    )
    await Promise.all(unlocked.map(tryRun))
  }

  // Kick off all root tasks (no dependencies) immediately
  await Promise.all(subtasks.map(tryRun))

  return results
}
