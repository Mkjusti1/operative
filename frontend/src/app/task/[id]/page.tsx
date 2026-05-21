'use client';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

const TOOL_COLORS: Record<string, string> = {
  web_search: 'bg-blue-900 text-blue-200',
  web_fetch: 'bg-teal-900 text-teal-200',
  code_runner: 'bg-amber-900 text-amber-200',
  file_writer: 'bg-purple-900 text-purple-200',
};

export default function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const { events, connected } = useTaskEvents(id);
  const bottomRef = useRef<HTMLDivElement>(null);

  const plan = events.find((e) => e.type === 'planner:done')?.payload
    ?.subtasks as any[] | undefined;
  const isDone = events.some((e) => e.type === 'task:done');
  const isError = events.some((e) => e.type === 'task:error');
  const finalOutput = events.find((e) => e.type === 'task:done')?.payload
    ?.output as string | undefined;
  const goal = events.find((e) => e.type === 'task:start')?.payload?.goal as
    | string
    | undefined;

  const synthTokens = events
    .filter(
      (e) => e.type === 'token' && (e.payload as any).agent === 'synthesizer'
    )
    .map((e) => (e.payload as any).token)
    .join('');

  const completedIds = new Set(
    events
      .filter((e) => e.type === 'subtask:done')
      .map((e) => (e.payload as any).subtaskId)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  return (
    <main className='min-h-screen bg-gray-950 text-white'>
      <div className='max-w-3xl mx-auto p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <Link
            href='/history'
            className='text-gray-600 hover:text-gray-400 text-sm transition'
          >
            ← History
          </Link>
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
            }`}
          />
          <span className='text-gray-400 text-sm font-mono'>
            {id?.slice(0, 8)}
          </span>
          {isDone && (
            <span className='text-green-400 text-xs bg-green-900/40 px-2 py-0.5 rounded-full'>
              Done
            </span>
          )}
          {isError && (
            <span className='text-red-400 text-xs bg-red-900/40 px-2 py-0.5 rounded-full'>
              Error
            </span>
          )}
        </div>

        {goal && (
          <p className='text-gray-300 text-sm italic mb-6 border-l-2 border-gray-700 pl-3'>
            "{goal}"
          </p>
        )}

        {plan && (
          <div className='mb-6'>
            <div className='flex justify-between text-xs text-gray-500 mb-1'>
              <span>Subtasks</span>
              <span>
                {completedIds.size} / {plan.length}
              </span>
            </div>
            <div className='flex gap-1'>
              {plan.map((s: any) => (
                <div
                  key={s.id}
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                    completedIds.has(s.id) ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <div className='space-y-2 mb-8'>
          {events
            .filter((e) => e.type !== 'token')
            .map((e, i) => (
              <EventRow key={i} event={e} />
            ))}
        </div>

        {synthTokens && !isDone && (
          <div className='bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800'>
            <p className='text-gray-500 text-xs mb-2'>Synthesizing...</p>
            <div className='text-sm text-gray-300 font-mono whitespace-pre-wrap'>
              {synthTokens}
              <span className='inline-block w-0.5 h-3 bg-gray-400 animate-pulse ml-0.5' />
            </div>
          </div>
        )}

        {isDone && finalOutput && (
          <div className='bg-gray-900 rounded-xl p-6 border border-gray-700'>
            <h2 className='text-sm font-medium text-gray-400 mb-4'>
              Final Output
            </h2>
            <div className='prose prose-invert prose-sm max-w-none'>
              <ReactMarkdown>{finalOutput}</ReactMarkdown>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </main>
  );
}

function EventRow({ event }: { event: { type: string; payload: any } }) {
  const { type, payload } = event;

  const label: Record<string, string> = {
    'task:start': '🚀 Task started',
    'planner:start': '🧠 Planning...',
    'planner:done': `📋 Plan ready — ${payload.subtasks?.length} subtasks`,
    'subtask:start': `▶ ${payload.task}`,
    'subtask:done': `✓ Done: ${payload.summary?.slice(0, 80)}...`,
    'tool:input': `→ ${payload.tool}: ${String(payload.input).slice(0, 60)}`,
    'tool:result': `← Result: ${String(payload.result).slice(0, 80)}`,
    'synthesizer:start': '✍ Synthesizing final output...',
    'synthesizer:done': '✅ Output ready',
    'task:done': '🎉 Task complete',
    'task:error': `❌ Error: ${payload.message}`,
  };

  const text =
    label[type] ?? `${type}: ${JSON.stringify(payload).slice(0, 80)}`;
  const isError = type === 'task:error';
  const isDone = ['task:done', 'subtask:done', 'synthesizer:done'].includes(
    type
  );

  return (
    <div
      className={`flex items-start gap-3 text-xs py-1.5 px-2 rounded-lg
      ${
        isError
          ? 'bg-red-900/20 text-red-300'
          : isDone
          ? 'text-green-300'
          : 'text-gray-400'
      }`}
    >
      <span className='font-mono opacity-40 shrink-0'>{type}</span>
      <span>{text}</span>
      {payload.tool && (
        <span
          className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
            TOOL_COLORS[payload.tool] ?? ''
          }`}
        >
          {payload.tool}
        </span>
      )}
    </div>
  );
}
