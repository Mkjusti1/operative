'use client';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useTaskEvents } from '@/hooks/useTaskEvents';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

const TOOL_STYLE: Record<string, { bg: string; color: string }> = {
  web_search: { bg: 'rgba(13,138,158,.2)', color: '#12B2C1' },
  web_fetch: { bg: 'rgba(35,113,123,.2)', color: '#7ab8be' },
  code_runner: { bg: 'rgba(186,117,23,.2)', color: '#FAC775' },
  file_writer: { bg: 'rgba(83,74,183,.2)', color: '#AFA9EC' },
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
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#1F2B2D',
        color: '#E5F9F8',
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '24px' }}>
        {/* Nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href='/history'
              style={{
                fontSize: '12px',
                color: '#7ab8be',
                textDecoration: 'none',
              }}
            >
              ← History
            </Link>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: connected ? '#12B2C1' : '#4a7f85',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: '#7ab8be',
              }}
            >
              {id?.slice(0, 8)}
            </span>
            {isDone && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: 'rgba(18,178,193,.15)',
                  color: '#12B2C1',
                  fontWeight: 500,
                }}
              >
                Done
              </span>
            )}
            {isError && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: 'rgba(226,75,74,.15)',
                  color: '#f09595',
                  fontWeight: 500,
                }}
              >
                Error
              </span>
            )}
          </div>
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#12B2C1' }}>
            Operative
          </span>
        </div>

        {/* Goal */}
        {goal && (
          <p
            style={{
              fontSize: '13px',
              color: '#7ab8be',
              fontStyle: 'italic',
              borderLeft: '2px solid #23717B',
              paddingLeft: '12px',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            "{goal}"
          </p>
        )}

        {/* Progress */}
        {plan && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#4a7f85',
                marginBottom: '6px',
              }}
            >
              <span>Subtasks</span>
              <span>
                {completedIds.size} / {plan.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
              {plan.map((s: any) => (
                <div
                  key={s.id}
                  style={{
                    height: '3px',
                    flex: 1,
                    borderRadius: '2px',
                    background: completedIds.has(s.id) ? '#12B2C1' : '#243436',
                    border: '0.5px solid #23717B',
                    transition: 'background 0.4s',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Event log */}
        <div
          style={{
            background: '#243436',
            border: '0.5px solid rgba(35,113,123,.3)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}
        >
          {events
            .filter((e) => e.type !== 'token')
            .map((e, i) => (
              <EventRow key={i} event={e} />
            ))}
        </div>

        {/* Streaming synthesis */}
        {synthTokens && !isDone && (
          <div
            style={{
              background: '#243436',
              border: '0.5px solid #23717B',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: '#4a7f85',
                marginBottom: '8px',
              }}
            >
              Synthesizing...
            </p>
            <div
              style={{
                fontSize: '13px',
                color: '#7ab8be',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
              }}
            >
              {synthTokens}
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '13px',
                  background: '#12B2C1',
                  marginLeft: '2px',
                  verticalAlign: 'text-bottom',
                  animation: 'pulse 0.8s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        )}

        {/* Final output */}
        {isDone && finalOutput && (
          <div
            style={{
              background: '#243436',
              border: '0.5px solid #23717B',
              borderRadius: '10px',
              padding: '20px 24px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: '#4a7f85',
                marginBottom: '14px',
                letterSpacing: '.04em',
              }}
            >
              FINAL OUTPUT
            </p>
            <div className='prose-operative'>
              <ReactMarkdown>{finalOutput}</ReactMarkdown>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <style>{`
        .prose-operative { font-size: 13px; line-height: 1.7; color: #E5F9F8; }
        .prose-operative h1, .prose-operative h2, .prose-operative h3 { color: #12B2C1; font-weight: 500; margin: 16px 0 8px; }
        .prose-operative h1 { font-size: 18px; }
        .prose-operative h2 { font-size: 15px; }
        .prose-operative h3 { font-size: 13px; }
        .prose-operative p { margin: 8px 0; color: #E5F9F8; }
        .prose-operative ul, .prose-operative ol { padding-left: 20px; margin: 8px 0; }
        .prose-operative li { margin: 4px 0; color: #E5F9F8; }
        .prose-operative code { background: #1F2B2D; color: #12B2C1; padding: 1px 6px; border-radius: 4px; font-size: 12px; }
        .prose-operative pre { background: #1F2B2D; border: 0.5px solid #23717B; border-radius: 8px; padding: 12px 14px; overflow-x: auto; margin: 12px 0; }
        .prose-operative pre code { background: none; padding: 0; color: #7ab8be; }
        .prose-operative table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        .prose-operative th { background: #1F2B2D; color: #12B2C1; padding: 8px 12px; text-align: left; border: 0.5px solid #23717B; font-weight: 500; }
        .prose-operative td { padding: 8px 12px; border: 0.5px solid rgba(35,113,123,.3); color: #E5F9F8; }
        .prose-operative tr:nth-child(even) td { background: rgba(35,113,123,.05); }
        .prose-operative strong { color: #12B2C1; font-weight: 500; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </main>
  );
}

function EventRow({ event }: { event: { type: string; payload: any } }) {
  const { type, payload } = event;
  const tool = payload?.tool;

  const label: Record<string, string> = {
    'task:start': '🚀 Task started',
    'planner:start': '🧠 Planning...',
    'planner:done': `📋 Plan ready — ${payload.subtasks?.length} subtasks`,
    'subtask:start': `▶ ${payload.task}`,
    'subtask:done': `✓ ${payload.summary?.slice(0, 80)}...`,
    'tool:input': `→ ${String(payload.input).slice(0, 60)}`,
    'tool:result': `← ${String(payload.result).slice(0, 80)}`,
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
  const ts = TOOL_STYLE[tool];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 0',
        borderBottom: '0.5px solid rgba(35,113,123,.15)',
        fontSize: '12px',
        color: isError ? '#f09595' : isDone ? '#7ddba8' : '#7ab8be',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: '#4a7f85',
          minWidth: '100px',
          flexShrink: 0,
        }}
      >
        {type}
      </span>
      <span style={{ flex: 1 }}>{text}</span>
      {ts && (
        <span
          style={{
            fontSize: '10px',
            padding: '2px 7px',
            borderRadius: '4px',
            background: ts.bg,
            color: ts.color,
            flexShrink: 0,
          }}
        >
          {tool}
        </span>
      )}
    </div>
  );
}
