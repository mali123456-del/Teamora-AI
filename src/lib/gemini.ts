export interface GeminiResponse {
  text: string;
  model: string;
  requestedModel?: string;
  actualModel?: string;
  fallbackTriggered?: boolean;
  fallbackReason?: string | null;
  latencyMs?: number;
  groundingChunks?: Array<{ web?: { uri: string; title: string } }> | null;
  error?: string;
  missingKey?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  groundingChunks?: Array<{ web?: { uri: string; title: string } }> | null;
  agentId?: string;
  thinking?: boolean;
}

export async function generateGeminiContent(options: {
  prompt: string;
  systemInstruction?: string;
  model?: 'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite';
  thinking?: boolean;
  searchGrounding?: boolean;
}): Promise<GeminiResponse> {
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to call Gemini');
    }
    return data;
  } catch (err: any) {
    console.error('generateGeminiContent error:', err);
    return {
      text: '',
      model: options.model || 'gemini-3.8-flash',
      error: err.message || 'Error communicating with Gemini AI service',
    };
  }
}

export const generateAgentResponse = generateGeminiContent;

export async function chatGeminiAgent(options: {
  message: string;
  history: Array<{ role: 'user' | 'model'; content: string }>;
  systemInstruction?: string;
  model?: 'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite';
  thinking?: boolean;
}): Promise<GeminiResponse> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send chat message');
    }
    return data;
  } catch (err: any) {
    console.error('chatGeminiAgent error:', err);
    return {
      text: '',
      model: options.model || 'gemini-3.8-flash',
      error: err.message || 'Error communicating with Gemini Chat service',
    };
  }
}

export async function orchestrateWorkforce(options: {
  goal: string;
  agents: string[];
  context?: any;
}): Promise<{ raw: string; model: string; error?: string }> {
  try {
    const res = await fetch('/api/gemini/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to run workforce orchestrator');
    }
    return data;
  } catch (err: any) {
    console.error('orchestrateWorkforce error:', err);
    return {
      raw: '',
      model: 'gemini-4-argon',
      error: err.message || 'Error executing workforce orchestrator',
    };
  }
}
