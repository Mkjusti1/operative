import { anthropic } from '../lib/anthropic.js';
import { runTool } from './tools.js';

export async function executeSubtask(subtask, context, emit) {
  emit('subtask:start', {
    subtaskId: subtask.id,
    task: subtask.task,
    tool: subtask.tool,
  });

  const planMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    system: `You are an executor agent. Given a subtask and context, output ONLY the exact input string to pass to the tool "${subtask.tool}". No explanation, just the raw input string.`,
    messages: [
      {
        role: 'user',
        content: `Subtask: ${subtask.task}\n\nContext:\n${
          context.join('\n\n---\n\n') || 'None'
        }`,
      },
    ],
  });

  const toolInput = planMsg.content[0].text.trim();
  emit('tool:input', {
    subtaskId: subtask.id,
    tool: subtask.tool,
    input: toolInput,
  });

  const toolResult = await runTool(subtask.tool, toolInput, subtask.taskId);
  emit('tool:result', {
    subtaskId: subtask.id,
    tool: subtask.tool,
    result: toolResult.slice(0, 500),
  });

  let reasoning = '';
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system:
      'Analyze the tool result and summarize key findings relevant to the subtask. Be concise.',
    messages: [
      {
        role: 'user',
        content: `Subtask: ${subtask.task}\n\nTool result:\n${toolResult}`,
      },
    ],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      reasoning += chunk.delta.text;
      emit('token', { subtaskId: subtask.id, token: chunk.delta.text });
    }
  }

  emit('subtask:done', { subtaskId: subtask.id, summary: reasoning });
  return reasoning;
}
