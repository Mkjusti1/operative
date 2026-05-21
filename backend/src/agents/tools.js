import { supabase } from '../lib/supabase.js';

/**
 * Run a tool by name with the given input string.
 * Returns a string result.
 */
export async function runTool(tool, input, taskId) {
  switch (tool) {
    case 'web_search':
      return webSearch(input);
    case 'web_fetch':
      return webFetch(input);
    case 'code_runner':
      return codeRunner(input);
    case 'file_writer':
      return fileWriter(input, taskId);
    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

// ─── web_search ───────────────────────────────────────────────────────────────
// Uses Serper API for real Google search results
async function webSearch(query) {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });

  const data = await res.json();

  if (!data.organic?.length) {
    return `No results found for "${query}".`;
  }

  const results = data.organic
    .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   URL: ${r.link}`)
    .join('\n\n');

  return `Search results for "${query}":\n\n${results}`;
}

// ─── web_fetch ────────────────────────────────────────────────────────────────
// Fetches a URL and returns trimmed text content (strips HTML tags simply)
async function webFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AgentRunner/1.0 (research bot)' },
  });
  const html = await res.text();
  // Strip tags, collapse whitespace — good enough for LLM consumption
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000); // cap tokens
  return text;
}

// ─── code_runner ──────────────────────────────────────────────────────────────
// Executes JS in a sandboxed child process using Node's --eval flag
// NOTE: In production, replace with Docker exec for real isolation
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function codeRunner(code) {
  try {
    const { stdout, stderr } = await execAsync(
      `node --eval "${code.replace(/"/g, '\\"')}"`,
      {
        timeout: 10_000,
        env: { PATH: process.env.PATH }, // stripped env for minimal surface
      }
    );
    return stdout || stderr || '(no output)';
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

// ─── file_writer ──────────────────────────────────────────────────────────────
// Stores the output as a file record in Supabase
async function fileWriter(content, taskId) {
  const filename = `output-${taskId}-${Date.now()}.md`;
  const { error } = await supabase.from('task_files').insert({
    task_id: taskId,
    filename,
    content,
  });
  if (error) throw new Error(error.message);
  return `File saved: ${filename}`;
}
