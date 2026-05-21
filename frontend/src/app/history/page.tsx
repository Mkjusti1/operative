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

const STATUS_STYLES: Record<string, string> = {
  done: 'bg-green-900/40 text-green-400',
  running: 'bg-blue-900/40 text-blue-400',
  queued: 'bg-gray-800 text-gray-400',
  error: 'bg-red-900/40 text-red-400',
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
    <main className='min-h-screen bg-gray-950 text-white'>
      <div className='max-w-4xl mx-auto p-6'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-2xl font-semibold'>Task History</h1>
            <p className='text-gray-500 text-sm mt-1'>
              All your previous agent runs
            </p>
          </div>
          <Link
            href='/'
            className='bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition'
          >
            + New Task
          </Link>
        </div>

        {loading ? (
          <div className='text-gray-500 text-sm'>Loading...</div>
        ) : tasks.length === 0 ? (
          <div className='text-center py-20'>
            <p className='text-gray-500 text-sm'>No tasks yet.</p>
            <Link
              href='/'
              className='text-blue-400 text-sm mt-2 inline-block hover:underline'
            >
              Run your first task →
            </Link>
          </div>
        ) : (
          <div className='border border-gray-800 rounded-xl overflow-hidden'>
            <div className='grid grid-cols-12 gap-4 px-4 py-3 bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-500 uppercase tracking-wide'>
              <div className='col-span-6'>Goal</div>
              <div className='col-span-2'>Status</div>
              <div className='col-span-2'>Duration</div>
              <div className='col-span-2 text-right'>When</div>
            </div>

            {tasks.map((task, i) => (
              <Link
                key={task.id}
                href={`/task/${task.id}`}
                className={`grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-900/60 transition cursor-pointer ${
                  i !== tasks.length - 1 ? 'border-b border-gray-800/60' : ''
                }`}
              >
                <div className='col-span-6'>
                  <p className='text-sm text-white truncate'>{task.goal}</p>
                  <p className='text-xs text-gray-600 font-mono mt-0.5'>
                    {task.id.slice(0, 8)}
                  </p>
                </div>

                <div className='col-span-2'>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      STATUS_STYLES[task.status] ?? STATUS_STYLES.queued
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className='col-span-2 text-sm text-gray-500'>
                  {duration(task.created_at, task.completed_at) ??
                    (task.status === 'running' ? (
                      <span className='flex items-center gap-1.5'>
                        <span className='w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse' />
                        running
                      </span>
                    ) : (
                      '—'
                    ))}
                </div>

                <div className='col-span-2 text-right text-sm text-gray-500'>
                  {timeAgo(task.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && tasks.length > 0 && (
          <div className='flex gap-6 mt-6 text-xs text-gray-600'>
            <span>{tasks.length} total runs</span>
            <span>
              {tasks.filter((t) => t.status === 'done').length} completed
            </span>
            <span>
              {tasks.filter((t) => t.status === 'error').length} failed
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
