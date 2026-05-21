'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!goal.trim()) return;
    setLoading(true);
    setError('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, userId: user.id }),
      });
      const { taskId, error: apiError } = await res.json();
      if (apiError) throw new Error(apiError);
      router.push(`/task/${taskId}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className='min-h-screen bg-gray-950 flex items-center justify-center p-6'>
      <div className='w-full max-w-2xl'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-semibold text-white mb-2'>
              Agent Runner
            </h1>
            <p className='text-gray-400 text-sm'>
              Describe a research or analysis goal. The agent will plan,
              execute, and stream results live.
            </p>
          </div>
          <a
            href='/history'
            className='text-sm text-gray-500 hover:text-white transition'
          >
            History →
          </a>
        </div>

        <textarea
          className='w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition'
          rows={4}
          placeholder='e.g. Research the top 5 Node.js authentication libraries and generate a comparison report'
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey) handleSubmit();
          }}
        />

        {error && <p className='text-red-400 text-sm mt-2'>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !goal.trim()}
          className='mt-4 w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium py-3 rounded-xl text-sm transition'
        >
          {loading ? 'Starting...' : 'Run Agent ↗'}
        </button>

        <p className='text-gray-600 text-xs mt-3 text-center'>
          ⌘ + Enter to submit
        </p>
      </div>
    </main>
  );
}
