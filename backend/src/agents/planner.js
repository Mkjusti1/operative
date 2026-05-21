import { anthropic } from '../lib/anthropic.js';

const TOOLS = ['web_search', 'web_fetch', 'code_runner', 'file_writer'];

const SYSTEM = `You are a task planner for an AI agent system.
Given a user goal, output a JSON array of subtasks.
Each subtask: { id, task, tool, dependsOn[] }
- tool must be one of: ${TOOLS.join(', ')}
- dependsOn is an array of subtask ids that must complete before this one runs
- Keep it to 3-6 subtasks max
- Respond with ONLY the JSON array, no markdown, no explanation.`;

export async function planTask(goal) {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: 'user', content: goal }],
  });

  const raw = msg.content[0].text.trim();
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  const clean = raw.slice(start, end + 1);

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Planner returned invalid JSON: ${clean}`);
  }
}
