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
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
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
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#1F2B2D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {/* Nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '48px',
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 500,
              color: '#12B2C1',
              letterSpacing: '-0.01em',
            }}
          >
            Operative
          </span>
          <a
            href='/history'
            style={{
              fontSize: '12px',
              color: '#7ab8be',
              textDecoration: 'none',
            }}
          >
            History →
          </a>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 500,
            color: '#E5F9F8',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          What do you want to research?
        </h1>
        <p style={{ fontSize: '13px', color: '#7ab8be', marginBottom: '28px' }}>
          Describe a goal. Operative will plan, execute, and stream results
          live.
        </p>

        {/* Input box */}
        <div
          style={{
            background: '#243436',
            border: '0.5px solid #23717B',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
          }}
        >
          <textarea
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#E5F9F8',
              fontSize: '14px',
              resize: 'none',
              lineHeight: '1.6',
              minHeight: '100px',
            }}
            placeholder='e.g. Research the top 5 Node.js authentication libraries and compare them...'
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) handleSubmit();
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#4a7f85' }}>
              ⌘ + Enter to submit
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading || !goal.trim()}
              style={{
                background: loading || !goal.trim() ? '#23717B' : '#0D8A9E',
                color: '#E5F9F8',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 18px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: loading || !goal.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !goal.trim() ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Starting...' : 'Run Agent ↗'}
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: '#f09595', fontSize: '13px', marginTop: '8px' }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
