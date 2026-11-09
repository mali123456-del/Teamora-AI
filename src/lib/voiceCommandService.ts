/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TEAMORA AI — Phase 61–65: Voice Intelligence Engine
 * Web Speech API wrapper for hands-free workspace navigation, multilingual command parsing (EN/UR),
 * and human-in-the-loop task drafting with zero persistent audio recording.
 */

import { TEAMORA_AGENTS } from '../data/agents.ts';

export type VoiceRecognitionState = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';
export type VoiceLanguage = 'en-US' | 'en-GB' | 'en-PK' | 'ur-PK';

export interface ParsedVoiceCommand {
  type: 'navigate' | 'task_draft' | 'unknown';
  rawTranscript: string;
  confidence: number;
  language: VoiceLanguage;
  targetRoute?: string;
  targetAgentId?: string;
  targetAgentName?: string;
  taskDraft?: {
    title: string;
    prompt: string;
    agentId: string;
    agentName: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    requiresReview: boolean;
  };
}

// Allowed application routes for voice navigation (Strict Allowlist)
export const VOICE_ROUTE_ALLOWLIST: Record<string, string[]> = {
  dashboard: ['dashboard', 'home', 'main', 'ڈیش بورڈ', 'ہوم'],
  crm: ['crm', 'customers', 'leads', 'clients', 'سی آر ایم', 'گاہک'],
  inventory: ['inventory', 'stock', 'products', 'انوینٹری', 'اسٹاک'],
  finance: ['finance', 'invoices', 'accounting', 'expenses', 'فنانس', 'انوائس', 'حساب کتاب'],
  projects: ['projects', 'kanban', 'tasks board', 'پروجیکٹس', 'منصوبے'],
  knowledge: ['knowledge', 'knowledge hub', 'docs', 'documents', 'دستاویزات', 'نالج'],
  automation: ['automation', 'automation studio', 'workflows', 'آٹومیشن', 'ورک فلو'],
  approvals: ['approvals', 'approvals center', 'pending approvals', 'منظوری', 'تصدیق'],
  analytics: ['analytics', 'metrics', 'reports', 'رپورٹس', 'اعداد و شمار'],
  workforce: ['workforce', 'team', 'agents', 'directory', 'افرادی قوت', 'ٹیم'],
  subscription: ['subscription', 'billing', 'plan', 'سبسکرپشن', 'بلنگ'],
  settings: ['settings', 'team settings', 'organization', 'سیٹنگز'],
};

// Canonical 15 AI Employee synonyms in English and Urdu
export const AGENT_SYNONYMS: Record<string, string[]> = {
  'workforce-manager': ['atlas', 'manager', 'orchestrator', 'اٹلس'],
  'support-agent': ['echo', 'support', 'customer support', 'ایکو', 'سپورٹ'],
  'sales-agent': ['vanguard', 'sales', 'revenue', 'deals', 'وینگارڈ', 'سیلز'],
  'marketing-agent': ['pulse', 'marketing', 'campaigns', 'پلس', 'مارکیٹنگ'],
  'finance-agent': ['ledger', 'finance', 'accountant', 'لیجر', 'فنانس'],
  'analytics-agent': ['prism', 'analytics', 'data', 'bi', 'پرزم'],
  'inventory-agent': ['stockwell', 'inventory', 'stock', 'اسٹاک ویل'],
  'operations-agent': ['nexus', 'operations', 'ops', 'نیکسس'],
  'research-agent': ['scout', 'research', 'intelligence', 'اسکاؤٹ'],
  'hr-agent': ['harmony', 'hr', 'people', 'talent', 'ہارمنی'],
  'content-agent': ['quill', 'content', 'copywriter', 'کوئل'],
  'email-agent': ['courier', 'email', 'inbox', 'outreach', 'کوریئر'],
  'project-manager': ['chronos', 'project manager', 'scrum', 'کرونوس'],
  'document-agent': ['scribe', 'document', 'docs', 'knowledge', 'سکرائب'],
  'workflow-agent': ['synapse', 'workflow', 'automation', 'سائنیپس'],
};

/**
 * Check if the current browser environment provides Web Speech API recognition.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Helper to get the constructor for SpeechRecognition
 */
function getSpeechRecognitionClass(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Parses recognized speech into typed navigation or agent task commands.
 */
export function parseVoiceTranscript(
  transcript: string,
  confidence: number = 0.9,
  language: VoiceLanguage = 'en-US'
): ParsedVoiceCommand {
  const cleaned = transcript.trim();
  const lower = cleaned.toLowerCase();

  // 1. Check for Workspace Navigation commands
  // Patterns: "open [route]", "go to [route]", "show [route]", "view [route]"
  // Urdu: "[route] کھولو", "دیکھائیں [route]"
  const navKeywords = ['open', 'go to', 'show', 'navigate to', 'view', 'کھولو', 'دیکھاؤ'];
  const isNav = navKeywords.some((kw) => lower.startsWith(kw) || lower.endsWith(kw));

  if (isNav) {
    for (const [routeKey, synonyms] of Object.entries(VOICE_ROUTE_ALLOWLIST)) {
      if (synonyms.some((syn) => lower.includes(syn))) {
        return {
          type: 'navigate',
          rawTranscript: cleaned,
          confidence,
          language,
          targetRoute: routeKey,
        };
      }
    }

    // Check if user asked to open a specific agent directly
    for (const [agentId, synonyms] of Object.entries(AGENT_SYNONYMS)) {
      if (synonyms.some((syn) => lower.includes(syn))) {
        const agent = TEAMORA_AGENTS.find((a) => a.id === agentId);
        return {
          type: 'navigate',
          rawTranscript: cleaned,
          confidence,
          language,
          targetRoute: 'workspace',
          targetAgentId: agentId,
          targetAgentName: agent?.name,
        };
      }
    }
  }

  // 2. Check for Agent Task Draft creation commands
  // Patterns: "ask [agent] to [do something]", "tell [agent] to [prompt]", "create task for [agent]: [prompt]"
  // Urdu: "[agent] سے کہو کہ [prompt]", "ٹاسک بنائیں"
  for (const [agentId, synonyms] of Object.entries(AGENT_SYNONYMS)) {
    for (const syn of synonyms) {
      const matchPatterns = [
        new RegExp(`(?:ask|tell|instruct|have)\\s+${syn}\\s+to\\s+(.+)`, 'i'),
        new RegExp(`(?:create|new)\\s+task\\s+for\\s+${syn}\\s*[:,-]?\\s*(.+)`, 'i'),
        new RegExp(`${syn}\\s*[:,-]\\s*(.+)`, 'i'),
        new RegExp(`${syn}\\s+سے\\s+کہو\\s+کہ\\s+(.+)`, 'i'),
      ];

      for (const pattern of matchPatterns) {
        const match = cleaned.match(pattern);
        if (match && match[1]) {
          const prompt = match[1].trim();
          const agent = TEAMORA_AGENTS.find((a) => a.id === agentId)!;
          const title = prompt.length > 50 ? `${prompt.slice(0, 47)}...` : prompt;

          // Priority classification based on urgency keywords
          let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
          if (/urgent|asap|critical|فوری|اہم/i.test(prompt)) {
            priority = 'urgent';
          } else if (/high|important|priority/i.test(prompt)) {
            priority = 'high';
          }

          return {
            type: 'task_draft',
            rawTranscript: cleaned,
            confidence,
            language,
            targetAgentId: agentId,
            targetAgentName: agent?.name,
            taskDraft: {
              title: title.charAt(0).toUpperCase() + title.slice(1),
              prompt,
              agentId,
              agentName: agent?.name || 'Agent',
              priority,
              requiresReview: true, // Always require review before execution!
            },
          };
        }
      }
    }
  }

  // 3. Fallback: Generic Task Draft assigned to Chief Orchestrator (Atlas)
  if (cleaned.length > 5) {
    const defaultAgent = TEAMORA_AGENTS.find((a) => a.id === 'workforce-manager')!;
    const title = cleaned.length > 50 ? `${cleaned.slice(0, 47)}...` : cleaned;
    return {
      type: 'task_draft',
      rawTranscript: cleaned,
      confidence,
      language,
      targetAgentId: defaultAgent.id,
      targetAgentName: defaultAgent.name,
      taskDraft: {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        prompt: cleaned,
        agentId: defaultAgent.id,
        agentName: defaultAgent.name,
        priority: 'medium',
        requiresReview: true,
      },
    };
  }

  return {
    type: 'unknown',
    rawTranscript: cleaned,
    confidence,
    language,
  };
}

/**
 * Reusable Voice Command Listener instance manager.
 */
export class VoiceCommandService {
  private recognition: any = null;
  private state: VoiceRecognitionState = 'idle';
  private currentLanguage: VoiceLanguage = 'en-US';
  private isStarting = false;
  private onStateChangeCb?: (state: VoiceRecognitionState) => void;
  private onResultCb?: (command: ParsedVoiceCommand) => void;
  private onErrorCb?: (errorMsg: string) => void;

  constructor() {
    // Lazy initialization: do NOT instantiate SpeechRecognition in constructor
    // Avoids immediate browser audio warnings and permission errors prior to user interaction
    if (!isSpeechRecognitionSupported()) {
      this.state = 'unsupported';
    }
  }

  private initRecognitionInstance(): boolean {
    const SpeechClass = getSpeechRecognitionClass();
    if (!SpeechClass) {
      this.state = 'unsupported';
      return false;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {
          // Ignore
        }
        this.recognition = null;
      }

      this.recognition = new SpeechClass();
      this.recognition.continuous = false; // Strictly push-to-talk, never continuous eavesdropping
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = this.currentLanguage;
      this.setupListeners();
      return true;
    } catch (err: any) {
      console.warn('SpeechRecognition initialization error:', err);
      this.state = 'error';
      return false;
    }
  }

  private setupListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.setState('listening');
    };

    this.recognition.onresult = (event: any) => {
      this.setState('processing');
      try {
        const result = event.results?.[0]?.[0];
        if (result && result.transcript) {
          const transcript = result.transcript;
          const confidence = result.confidence || 0.88;
          const parsed = parseVoiceTranscript(transcript, confidence, this.currentLanguage);
          this.onResultCb?.(parsed);
        }
      } catch (err) {
        console.warn('Transcript parse error:', err);
      } finally {
        this.setState('idle');
      }
    };

    this.recognition.onerror = (event: any) => {
      let userFriendlyMessage = 'Speech recognition error occurred.';
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        userFriendlyMessage = 'Microphone permission denied. Please allow microphone access in your browser settings to use voice commands, or use the text fallback below.';
      } else if (event.error === 'no-speech') {
        userFriendlyMessage = 'No speech detected. Please press the mic button and speak clearly.';
      } else if (event.error === 'audio-capture') {
        userFriendlyMessage = 'No microphone device was detected. Ensure an audio input device is connected.';
      } else if (event.error === 'language-not-supported') {
        userFriendlyMessage = `Selected language (${this.currentLanguage}) is not supported by your browser engine.`;
      } else if (event.error === 'network') {
        userFriendlyMessage = 'Speech recognition network error. Check your connection or use manual text input.';
      }

      this.onErrorCb?.(userFriendlyMessage);
      this.setState('error');
    };

    this.recognition.onend = () => {
      if (this.state === 'listening' || this.state === 'processing') {
        this.setState('idle');
      }
    };
  }

  public setLanguage(lang: VoiceLanguage) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public getLanguage(): VoiceLanguage {
    return this.currentLanguage;
  }

  public getState(): VoiceRecognitionState {
    return this.state;
  }

  public subscribe(
    onStateChange: (state: VoiceRecognitionState) => void,
    onResult: (command: ParsedVoiceCommand) => void,
    onError: (errorMsg: string) => void
  ) {
    this.onStateChangeCb = onStateChange;
    this.onResultCb = onResult;
    this.onErrorCb = onError;
    onStateChange(this.state);
  }

  /**
   * Starts speech recognition ONLY upon explicit user initiation.
   * Checks microphone availability and handles permissions safely.
   */
  public async startListening(lang?: VoiceLanguage): Promise<boolean> {
    if (this.isStarting || this.state === 'listening' || this.state === 'processing') {
      return false;
    }
    this.isStarting = true;

    try {
      if (!isSpeechRecognitionSupported()) {
        this.setState('unsupported');
        this.onErrorCb?.('Web Speech API is not supported in this browser. Please use text commands.');
        return false;
      }

      if (lang) {
        this.currentLanguage = lang;
      }

      // Check navigator microphone permission if query API is available
      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permissionStatus.state === 'denied') {
            this.setState('error');
            this.onErrorCb?.('Microphone permission is blocked in browser settings. Please enable microphone permissions in your site settings to use voice commands.');
            return false;
          }
        } catch {
          // Fallback to standard start() flow if permission query fails
        }
      }

      // Lazily instantiate recognition instance on-demand
      const ready = this.initRecognitionInstance();
      if (!ready || !this.recognition) {
        this.setState('unsupported');
        this.onErrorCb?.('Speech recognition service could not be initialized.');
        return false;
      }

      try {
        this.recognition.start();
        return true;
      } catch (err: any) {
        console.warn('Speech recognition start failed:', err);
        // If already started, stop and prompt retry
        if (err.name === 'InvalidStateError') {
          try {
            this.recognition.stop();
          } catch {
            // Ignore
          }
        }
        this.setState('error');
        this.onErrorCb?.('Microphone is busy or initial voice capture failed. Please try clicking again.');
        return false;
      }
    } finally {
      this.isStarting = false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    this.setState('idle');
  }

  private setState(newState: VoiceRecognitionState) {
    this.state = newState;
    this.onStateChangeCb?.(newState);
  }
}

// Global Singleton for Application Usage
export const globalVoiceService = new VoiceCommandService();
