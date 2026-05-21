import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-1.5-flash — fast, free tier, great for agentic tasks
export const gemini = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
