import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { IncomingMessage, ServerResponse } from 'http';

// Initialize server-side Gemini client as specified in skill
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured in process.env');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

function readBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body) {
    return Promise.resolve((req as any).body);
  }
  if (req.readableEnded) {
    return Promise.resolve({});
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMsg)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Resilient helper with multi-tier fallback: Primary -> gemini-3.8-flash -> gemini-3.1-flash-lite
async function generateWithResilience(
  ai: GoogleGenAI,
  primaryModel: string,
  contents: any,
  config?: Record<string, any>
) {
  const modelsToTry: string[] = [primaryModel];

  if (!modelsToTry.includes('gemini-3.8-flash')) {
    modelsToTry.push('gemini-3.8-flash');
  }
  if (!modelsToTry.includes('gemini-3.1-flash-lite')) {
    modelsToTry.push('gemini-3.1-flash-lite');
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const modelConfig = { ...(config || {}) };
      if (model === 'gemini-3.1-flash-lite' && modelConfig.thinkingConfig) {
        delete modelConfig.thinkingConfig;
      }

      // Allow up to 5s per model attempt to prevent hanging on 503/429 retries
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents,
          config: Object.keys(modelConfig).length > 0 ? modelConfig : undefined,
        }),
        5000,
        `Model ${model} timed out. Escalating to high-speed tier.`
      );

      return { response, modelUsed: model };
    } catch (err: any) {
      console.warn(`Attempt with ${model} failed: ${err.message || err}. Trying next fallback.`);
      lastError = err;
    }
  }

  throw lastError;
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  if (
    !url.startsWith('/gemini') &&
    !url.startsWith('/api/gemini') &&
    !url.startsWith('/status') &&
    !url.startsWith('/api/status')
  ) {
    return false;
  }

  // Health check
  if (url === '/api/status' || url === '/status') {
    sendJson(res, 200, {
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method Not Allowed. Use POST.' });
    return true;
  }

  const ai = getAiClient();
  if (!ai) {
    sendJson(res, 503, {
      error: 'GEMINI_API_KEY is not configured. Please ensure your Gemini API key is attached in Settings > Secrets.',
      missingKey: true,
    });
    return true;
  }

  try {
    const body = await readBody(req);

    // 1. Single generation / Analysis / Execution
    if (url.includes('/generate')) {
      const { prompt, systemInstruction, model: reqModel, thinking, searchGrounding } = body;
      if (!prompt) {
        sendJson(res, 400, { error: 'Missing required field: prompt' });
        return true;
      }

      let selectedModel = reqModel || 'gemini-3.8-flash';
      const config: Record<string, any> = {};

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (thinking) {
        selectedModel = reqModel === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.8-flash';
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      } else if (searchGrounding) {
        selectedModel = 'gemini-3.8-flash';
        config.tools = [{ googleSearch: {} }];
      }

      const { response, modelUsed } = await generateWithResilience(
        ai,
        selectedModel,
        prompt,
        config
      );

      const text = response.text || '';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

      sendJson(res, 200, {
        text,
        model: modelUsed,
        groundingChunks: groundingChunks || null,
      });
      return true;
    }

    // 2. Multi-turn Agent Chat
    if (url.includes('/chat')) {
      const { message, history = [], systemInstruction, model: reqModel, thinking } = body;
      if (!message) {
        sendJson(res, 400, { error: 'Missing required field: message' });
        return true;
      }

      let selectedModel = reqModel || 'gemini-3.8-flash';
      const config: Record<string, any> = {};

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      if (thinking) {
        selectedModel = reqModel === 'gemini-4-argon' ? 'gemini-4-argon' : 'gemini-3.8-flash';
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      }

      const formattedContents = [
        ...history.map((h: { role: string; content?: string; text?: string }) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content || h.text || '' }],
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const { response, modelUsed } = await generateWithResilience(
        ai,
        selectedModel,
        formattedContents,
        config
      );

      sendJson(res, 200, {
        text: response.text || '',
        model: modelUsed,
      });
      return true;
    }

    // 3. Multi-Agent Autonomous Orchestrator
    if (url.includes('/orchestrate')) {
      const { goal, agents = [], context } = body;
      if (!goal) {
        sendJson(res, 400, { error: 'Missing required field: goal' });
        return true;
      }

      const systemInstruction = `You are TEAMORA AI's Workforce Orchestrator. 
Your goal is to decompose complex business objectives into an optimized multi-agent task execution plan.
Assign specific subtasks to appropriate specialized agents (e.g. Customer Support, Sales, Marketing, Finance, Analytics, Inventory, Operations, Research, HR, Content, Email, Project Manager, Document, Workflow Automation).
Output a clean JSON object with:
- "planSummary": string
- "reasoning": string
- "subtasks": array of { "agentId": string, "agentName": string, "actionTitle": string, "prompt": string, "requiresApproval": boolean, "consequences": string }
- "estimatedTimeline": string`;

      const { response, modelUsed } = await generateWithResilience(
        ai,
        'gemini-3.8-flash',
        `Business Objective: ${goal}\nAvailable Agents: ${agents.join(', ')}\nContext: ${JSON.stringify(context || {})}`,
        {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        }
      );

      sendJson(res, 200, {
        raw: response.text || '',
        model: modelUsed,
      });
      return true;
    }

    sendJson(res, 404, { error: 'Endpoint not found' });
    return true;
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    sendJson(res, 500, {
      error: err.message || 'Internal error calling Gemini API',
      code: err.code || 'GEMINI_ERROR',
    });
    return true;
  }
}
