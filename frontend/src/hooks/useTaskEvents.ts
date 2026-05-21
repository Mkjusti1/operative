'use client'
import { useEffect, useRef, useState } from 'react'

export type AgentEvent = {
  type: string
  payload: Record<string, unknown>
  ts: number
}

export function useTaskEvents(taskId: string | null) {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!taskId) return

    // Clear stale events from a previous task
    setEvents([])

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/events/${taskId}`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => setConnected(true)

    // Listen to all named event types we care about
    const EVENT_TYPES = [
      'task:start', 'task:done', 'task:error',
      'planner:start', 'planner:done',
      'subtask:start', 'subtask:done',
      'tool:input', 'tool:result',
      'token',
      'synthesizer:start', 'synthesizer:done',
    ]

    EVENT_TYPES.forEach(type => {
      es.addEventListener(type, (e: MessageEvent) => {
        setEvents(prev => [...prev, {
          type,
          payload: JSON.parse(e.data),
          ts: Date.now(),
        }])
      })
    })

    es.onerror = () => {
      setConnected(false)
      // EventSource auto-reconnects — no manual retry needed
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [taskId])

  return { events, connected }
}
