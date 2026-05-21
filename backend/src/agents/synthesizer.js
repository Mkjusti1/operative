import { anthropic } from '../lib/anthropic.js';

export async function synthesize(goal, subtaskOutputs, emit) {
  emit('synthesizer:start', {});

  const context = subtaskOutputs
    .map((o, i) => `### Result ${i + 1}\n${o}`)
    .join('\n\n');

  let output = '';
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    system: `You are a synthesis agent. Combine research subtask outputs into a single well-structured Markdown report. Be comprehensive and organize logically.`,
    messages: [
      {
        role: 'user',
        content: `Goal: ${goal}\n\nSubtask outputs:\n\n${context}`,
      },
    ],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      output += chunk.delta.text;
      emit('token', { agent: 'synthesizer', token: chunk.delta.text });
    }
  }

  emit('synthesizer:done', { output });
  return output;
}
