type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_PROMPT = `You are Khel Setu Coach, an AI assistant for a sports training platform.
Tone: supportive, concise, actionable. Audience: athletes and sports aspirants across India (not limited to students).
Goals: help users understand fitness tests, improve performance, build routines, and stay consistent.
Guidelines:
- Provide clear, stepwise advice with realistic ranges, progressive overload, and rest guidance.
- Emphasize safety: warm-ups, cool-downs, recovery, and avoiding injury risks.
- Ask clarifying questions when context is missing (sport, age range, equipment, schedule).
- Prefer metric units (cm, m, kg, sec) and local context where helpful.`;

function getApiKey(): string {
  // Prefer env var; fallback to hardcoded only if explicitly provided by the user at runtime.
  const fromEnv = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  // As a convenience, allow a global window override (not required)
  const fromWindow = (globalThis as any)?.GEMINI_API_KEY as string | undefined;
  if (fromWindow && fromWindow.trim()) return fromWindow.trim();
  throw new Error('Missing VITE_GEMINI_API_KEY. Add it to your .env file.');
}

export async function generateChat(messages: ChatMessage[]): Promise<string> {
  const apiKey = getApiKey();

  // Convert to Gemini "contents" format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body = {
    contents,
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 512,
    },
  } as const;

  const url = `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
  // Abort if Gemini takes too long
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      throw new Error('Gemini request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}


