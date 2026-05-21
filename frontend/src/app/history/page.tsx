'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Task = {
  id: string;
  goal: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function duration(created: string, completed: string | null) {
  if (!completed) return null;
  const ms = new Date(completed).getTime() - new Date(created).getTime();
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  done: { bg: 'rgba(18,178,193,.15)', color: '#12B2C1' },
  running: { bg: 'rgba(13,138,158,.2)', color: '#0D8A9E' },
  queued: { bg: 'rgba(35,113,123,.2)', color: '#7ab8be' },
  error: { bg: 'rgba(226,75,74,.15)', color: '#f09595' },
};

export default function HistoryPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data } = await supabase
        .from('tasks')
        .select('id, goal, status, created_at, completed_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setTasks(data || []);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#1F2B2D',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 500, color: '#12B2C1' }}>
            Operative
          </span>
          <Link
            href='/'
            style={{
              background: '#0D8A9E',
              color: '#E5F9F8',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '8px',
            }}
          >
            + New Task
          </Link>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#E5F9F8' }}>
            Task History
          </h1>
          <p style={{ fontSize: '12px', color: '#7ab8be', marginTop: '4px' }}>
            All your previous agent runs
          </p>
        </div>

        {loading ? (
          <p style={{ color: '#4a7f85', fontSize: '13px' }}>Loading...</p>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#4a7f85', fontSize: '13px' }}>No tasks yet.</p>
            <Link
              href='/'
              style={{
                color: '#12B2C1',
                fontSize: '13px',
                marginTop: '8px',
                display: 'inline-block',
              }}
            >
              Run your first task →
            </Link>
          </div>
        ) : (
          <div
            style={{
              border: '0.5px solid #23717B',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 80px 70px',
                gap: '12px',
                padding: '10px 20px',
                background: '#243436',
                borderBottom: '0.5px solid #23717B',
                fontSize: '10px',
                color: '#4a7f85',
                letterSpacing: '.06em',
              }}
            >
              <span>GOAL</span>
              <span>STATUS</span>
              <span>DURATION</span>
              <span style={{ textAlign: 'right' }}>WHEN</span>
            </div>

            {tasks.map((task, i) => {
              const s = STATUS_STYLE[task.status] ?? STATUS_STYLE.queued;
              return (
                <Link
                  key={task.id}
                  href={`/task/${task.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px 70px',
                    gap: '12px',
                    padding: '14px 20px',
                    alignItems: 'center',
                    textDecoration: 'none',
                    borderBottom:
                      i !== tasks.length - 1
                        ? '0.5px solid rgba(35,113,123,.2)'
                        : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(35,113,123,.08)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <div style={{ overflow: 'hidden' }}>
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#E5F9F8',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {task.goal}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        color: '#4a7f85',
                        marginTop: '2px',
                      }}
                    >
                      {task.id.slice(0, 8)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      fontWeight: 500,
                      background: s.bg,
                      color: s.color,
                      display: 'inline-block',
                    }}
                  >
                    {task.status}
                  </span>
                  <span style={{ fontSize: '12px', color: '#7ab8be' }}>
                    {duration(task.created_at, task.completed_at) ??
                      (task.status === 'running' ? 'running...' : '—')}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#4a7f85',
                      textAlign: 'right',
                    }}
                  >
                    {timeAgo(task.created_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
            <span style={{ fontSize: '11px', color: '#4a7f85' }}>
              {tasks.length} total runs
            </span>
            <span style={{ fontSize: '11px', color: '#4a7f85' }}>
              {tasks.filter((t) => t.status === 'done').length} completed
            </span>
            <span style={{ fontSize: '11px', color: '#4a7f85' }}>
              {tasks.filter((t) => t.status === 'error').length} failed
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
