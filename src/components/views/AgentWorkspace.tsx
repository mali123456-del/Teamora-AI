import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TEAMORA_AGENTS, AgentDefinition } from '../../data/agents.ts';
import { chatGeminiAgent, generateGeminiContent, ChatMessage } from '../../lib/gemini.ts';
import {
  Send,
  Sparkles,
  Search,
  BrainCircuit,
  Zap,
  ShieldAlert,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sliders,
  History,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const AgentWorkspace: React.FC = () => {
  const { selectedAgentId, setSelectedAgentId, addTask, tasks, user, setBannerMessage } = useApp();

  // Find currently selected agent, default to Workforce Manager if none
  const currentAgent =
    TEAMORA_AGENTS.find((a) => a.id === selectedAgentId) || TEAMORA_AGENTS[0];

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      content: `Greetings! I am **${currentAgent.name}**, ${currentAgent.role} at TEAMORA AI. \n\n${currentAgent.description}\n\nHow can I advance your organizational objectives today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentId: currentAgent.id,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [enableHighThinking, setEnableHighThinking] = useState(false);
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(currentAgent.id === 'research-agent');
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>(
    currentAgent.preferredModel
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When selected agent changes, update greeting
  useEffect(() => {
    setSelectedModel(currentAgent.preferredModel);
    setEnableSearchGrounding(currentAgent.id === 'research-agent');
    setMessages([
      {
        id: `welcome-${currentAgent.id}-${Date.now()}`,
        role: 'model',
        content: `Greetings! I am **${currentAgent.name}**, ${currentAgent.role} at TEAMORA AI. \n\n${currentAgent.description}\n\nHow can I advance your organizational objectives today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentId: currentAgent.id,
      },
    ]);
  }, [currentAgent.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Select appropriate model with resilient default
      let modelToUse = selectedModel;
      if (enableHighThinking && selectedModel === 'gemini-4-argon') {
        modelToUse = 'gemini-4-argon';
      } else if (enableHighThinking) {
        modelToUse = 'gemini-3.8-flash';
      } else if (enableSearchGrounding) {
        modelToUse = 'gemini-3.8-flash';
      }

      const response = await chatGeminiAgent({
        message: text,
        history: messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        systemInstruction: currentAgent.systemInstruction,
        model: modelToUse,
        thinking: enableHighThinking,
      });

      if (response.error) {
        const isQuotaErr =
          response.error.includes('429') ||
          response.error.includes('quota') ||
          response.error.includes('RESOURCE_EXHAUSTED') ||
          response.error.includes('limit: 0');

        const errorHelp = isQuotaErr
          ? `⚠️ **Model Quota Note**: The requested model exceeded quota (Gemini 4 Argon requires a billing-enabled key in Settings > Secrets). Please select **gemini-3.8-flash**, which supports high reasoning and search grounding on the standard tier.`
          : `⚠️ **Agent Notice**: ${response.error}\n\n*Please verify your Gemini API key in Settings > Secrets.*`;

        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            content: errorHelp,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentId: currentAgent.id,
          },
        ]);
      } else {
        const modelMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: response.text || 'Task processed successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          groundingChunks: response.groundingChunks || null,
          agentId: currentAgent.id,
          thinking: enableHighThinking,
        };

        setMessages((prev) => [...prev, modelMsg]);

        // Auto-log to Task Center
        addTask({
          agentId: currentAgent.id,
          agentName: currentAgent.name,
          title: text.length > 50 ? `${text.slice(0, 48)}...` : text,
          prompt: text,
          status: 'completed',
          priority: enableHighThinking ? 'urgent' : 'medium',
          result: response.text,
          groundingChunks: response.groundingChunks || undefined,
          createdBy: user?.displayName || 'User',
          modelUsed: `${modelToUse}${enableHighThinking ? ' (Thinking HIGH)' : ''}`,
          duration: '1.4s',
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-0 overflow-hidden bg-[#F5F1E9] dark:bg-[#181320] text-[#211B2C] dark:text-[#F5F1E9]">
      {/* Left Column: Agent Selector & Identity Sidebar */}
      <div className="w-full lg:w-80 shrink-0 border-r border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C] flex flex-col justify-between overflow-y-auto p-4 space-y-4">
        {/* Switch Agent Dropdown / Roster */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#77717D] dark:text-[#AFA8B8]">
              Active Agent Workspace
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C7F36B] text-[#162700] font-bold">
              15 Online
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1 max-h-56 overflow-y-auto pr-1">
            {TEAMORA_AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer ${
                  currentAgent.id === agent.id
                    ? 'bg-[#8B5CF6] text-white font-semibold shadow-sm'
                    : 'text-[#211B2C] dark:text-[#F5F1E9] hover:bg-[#EBE5DB]/60 dark:hover:bg-[#2C2438]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${agent.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}
                >
                  {agent.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate">{agent.name}</div>
                  <div
                    className={`text-[10px] truncate ${
                      currentAgent.id === agent.id ? 'text-white/80' : 'text-[#77717D] dark:text-[#AFA8B8]'
                    }`}
                  >
                    {agent.role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Agent Dossier */}
        <div className="p-4 rounded-2xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentAgent.avatarColor} text-white flex items-center justify-center font-bold text-base shadow-md`}
            >
              {currentAgent.name.slice(0, 2)}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#211B2C] dark:text-[#F5F1E9]">{currentAgent.name}</h3>
              <div className="text-xs text-[#77717D] dark:text-[#AFA8B8]">{currentAgent.role}</div>
              <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.2 rounded bg-[#8B5CF6]/15 text-[#8B5CF6] font-semibold">
                {currentAgent.department}
              </span>
            </div>
          </div>

          <p className="text-xs text-[#77717D] dark:text-[#AFA8B8] leading-relaxed">
            {currentAgent.description}
          </p>

          {/* Allowed Tools & Capabilities */}
          <div className="space-y-1.5 text-xs">
            <span className="font-semibold text-[11px] text-[#211B2C] dark:text-[#F5F1E9]">
              Autonomous Tools:
            </span>
            <div className="flex flex-wrap gap-1">
              {currentAgent.allowedTools.map((tool, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-[#FFFEFC] dark:bg-[#211B2C] text-[10px] font-mono border border-[#E2DBD0] dark:border-[#382F47] text-[#77717D] dark:text-[#AFA8B8]"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* Human Approval Required For */}
          <div className="p-2.5 rounded-xl bg-[#FF806E]/10 border border-[#FF806E]/20 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF806E]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Safety Gate Trigger:</span>
            </div>
            <ul className="text-[10px] text-[#77717D] dark:text-[#AFA8B8] list-disc list-inside space-y-0.5">
              {currentAgent.requiresApprovalFor.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]">
            <div className="font-heading font-extrabold text-sm text-[#8B5CF6]">
              {currentAgent.metrics[0].value}
            </div>
            <div className="text-[10px] text-[#77717D] dark:text-[#AFA8B8]">{currentAgent.metrics[0].label}</div>
          </div>
          <div className="p-2 rounded-xl bg-[#FFFEFC] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47]">
            <div className="font-heading font-extrabold text-sm text-[#10B981]">
              {currentAgent.uptime}
            </div>
            <div className="text-[10px] text-[#77717D] dark:text-[#AFA8B8]">Uptime SLA</div>
          </div>
        </div>
      </div>

      {/* Right Column: Multi-turn Chat, Model Switcher, and Prompt Execution */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#FFFEFC] dark:bg-[#211B2C]">
        {/* Workspace Toolbar: Model selector, High Thinking toggle, Search Grounding toggle */}
        <div className="px-6 py-3 border-b border-[#E2DBD0] dark:border-[#382F47] bg-[#F5F1E9]/80 dark:bg-[#2C2438]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#211B2C] dark:text-[#F5F1E9]">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] font-mono text-[11px] text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (General, High-Thinking & Search)</option>
              <option value="gemini-4-argon">gemini-4-argon (Requires Paid Key in Secrets)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            {/* High Thinking Mode Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableHighThinking}
                onChange={(e) => setEnableHighThinking(e.target.checked)}
                className="w-4 h-4 accent-[#8B5CF6] rounded"
              />
              <div className="flex items-center gap-1 font-medium text-[#211B2C] dark:text-[#F5F1E9]">
                <BrainCircuit className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Thinking Mode (HIGH)</span>
              </div>
            </label>

            {/* Google Search Grounding Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableSearchGrounding}
                onChange={(e) => setEnableSearchGrounding(e.target.checked)}
                className="w-4 h-4 accent-[#06B6D4] rounded"
              />
              <div className="flex items-center gap-1 font-medium text-[#211B2C] dark:text-[#F5F1E9]">
                <Search className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Google Search Grounding</span>
              </div>
            </label>
          </div>
        </div>

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {msg.role === 'model' ? (
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentAgent.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}
                >
                  {currentAgent.name.slice(0, 2)}
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#211B2C] dark:bg-[#C7F36B] text-[#F5F1E9] dark:text-[#162700] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  {user?.displayName?.[0] || 'U'}
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-[#8B5CF6] text-white rounded-tr-none'
                    : 'bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-[#211B2C] dark:text-[#F5F1E9] rounded-tl-none'
                }`}
              >
                {/* Thinking Badge */}
                {msg.thinking && (
                  <div className="flex items-center gap-1 text-[10px] font-mono font-semibold text-[#8B5CF6] dark:text-[#A78BFA] pb-1 border-b border-[#E2DBD0] dark:border-[#382F47]">
                    <BrainCircuit className="w-3 h-3" />
                    <span>Gemini 4 Argon High Reasoning Processed</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounding Source URL Chips */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="pt-2 border-t border-[#E2DBD0] dark:border-[#382F47] space-y-1">
                    <span className="text-[10px] font-mono text-[#77717D] dark:text-[#AFA8B8] uppercase">
                      Google Search Grounding Sources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingChunks.map((chunk, idx) =>
                        chunk.web ? (
                          <a
                            key={idx}
                            href={chunk.web.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-[10px] text-[#06B6D4] hover:underline"
                          >
                            <span>{chunk.web.title || 'Web Citation'}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-right opacity-60 font-mono">{msg.timestamp}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentAgent.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}
              >
                {currentAgent.name.slice(0, 2)}
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] flex items-center gap-2 text-xs text-[#77717D] dark:text-[#AFA8B8]">
                <Sparkles className="w-4 h-4 text-[#8B5CF6] animate-spin" />
                <span>
                  {enableHighThinking
                    ? `${currentAgent.name} is deeply reasoning with Gemini 4 Argon...`
                    : enableSearchGrounding
                    ? `${currentAgent.name} is grounding with Google Search...`
                    : `${currentAgent.name} is executing task...`}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Preset Sample Prompts Bar */}
        <div className="px-6 py-2 border-t border-[#E2DBD0] dark:border-[#382F47] bg-[#F5F1E9]/50 dark:bg-[#2C2438]/40 overflow-x-auto flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-[#77717D] dark:text-[#AFA8B8] shrink-0">
            Suggested:
          </span>
          {currentAgent.samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 rounded-lg bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-[11px] text-[#211B2C] dark:text-[#F5F1E9] hover:border-[#8B5CF6] shrink-0 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input Box */}
        <div className="p-4 border-t border-[#E2DBD0] dark:border-[#382F47] bg-[#FFFEFC] dark:bg-[#211B2C]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Assign instruction or ask a question to ${currentAgent.name} (${currentAgent.role})...`}
              className="flex-1 px-4 py-3 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs sm:text-sm text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-5 py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <span>Dispatch</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
