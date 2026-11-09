/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TEAMORA AI — Phase 61–65 & 69: Global Voice Intelligence Interface
 * Interactive voice listener modal supporting Web Speech recognition, multilingual input (EN/UR),
 * route navigation execution, and human-in-the-loop task review before dispatch.
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  ArrowRight,
  Globe,
  AlertCircle,
  CheckCircle2,
  Send,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import {
  globalVoiceService,
  isSpeechRecognitionSupported,
  VoiceRecognitionState,
  VoiceLanguage,
  ParsedVoiceCommand,
  parseVoiceTranscript,
} from '../../lib/voiceCommandService.ts';
import { TEAMORA_AGENTS } from '../../data/agents.ts';
import { useApp } from '../../context/AppContext.tsx';
import { syncEngine } from '../../lib/syncEngine.ts';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({ isOpen, onClose }) => {
  const { setActiveTab, setSelectedAgentId, currentOrg, language: appLanguage } = useApp();
  const [recognitionState, setRecognitionState] = useState<VoiceRecognitionState>('idle');
  const [voiceLang, setVoiceLang] = useState<VoiceLanguage>(appLanguage === 'ur' ? 'ur-PK' : 'en-US');
  const [transcript, setTranscript] = useState<string>('');
  const [parsedCommand, setParsedCommand] = useState<ParsedVoiceCommand | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);
  const [taskSubmittedMsg, setTaskSubmittedMsg] = useState<string | null>(null);

  const supported = isSpeechRecognitionSupported();

  useEffect(() => {
    if (!isOpen) {
      globalVoiceService.stopListening();
      setTranscript('');
      setParsedCommand(null);
      setErrorMessage(null);
      setTaskSubmittedMsg(null);
      return;
    }

    globalVoiceService.subscribe(
      (state) => setRecognitionState(state),
      (command) => {
        setTranscript(command.rawTranscript);
        setParsedCommand(command);
        setErrorMessage(null);
      },
      (error) => setErrorMessage(error)
    );
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartListening = () => {
    setErrorMessage(null);
    setTaskSubmittedMsg(null);
    globalVoiceService.startListening(voiceLang);
  };

  const handleStopListening = () => {
    globalVoiceService.stopListening();
  };

  const handleExecuteNavigation = (route: string, agentId?: string) => {
    if (route === 'workspace' && agentId) {
      const agent = TEAMORA_AGENTS.find((a) => a.id === agentId);
      if (agent) {
        setSelectedAgentId(agent.id);
      }
      setActiveTab('workspace');
    } else {
      setActiveTab(route as any);
    }
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const parsed = parseVoiceTranscript(manualInput.trim(), 1.0, voiceLang);
    setTranscript(manualInput.trim());
    setParsedCommand(parsed);
    setManualInput('');
  };

  const handleConfirmTaskDraft = async () => {
    if (!parsedCommand || !parsedCommand.taskDraft) return;
    setIsSubmittingTask(true);
    setTaskSubmittedMsg(null);

    try {
      const draft = parsedCommand.taskDraft;
      await syncEngine.queueTaskCreation(currentOrg.id, {
        agentId: draft.agentId,
        agentName: draft.agentName,
        title: draft.title,
        prompt: draft.prompt,
        priority: draft.priority,
      });

      setTaskSubmittedMsg(`Task successfully queued for ${draft.agentName}!`);
      setTimeout(() => {
        setIsSubmittingTask(false);
        setActiveTab('tasks');
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to queue task');
      setIsSubmittingTask(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#211B2C]/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-xl rounded-3xl bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E2DBD0] dark:border-[#382F47]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#211B2C] dark:text-[#F5F1E9] font-heading flex items-center gap-2">
                Voice Intelligence Assistant
              </h2>
              <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                Hands-free workspace navigation & safe task drafting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center rounded-lg border border-[#E2DBD0] dark:border-[#382F47] p-0.5 bg-[#F5F1E9] dark:bg-[#2C2438]">
              <button
                onClick={() => {
                  setVoiceLang('en-US');
                  globalVoiceService.setLanguage('en-US');
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                  voiceLang === 'en-US'
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-[#77717D] dark:text-[#AFA8B8]'
                }`}
              >
                English
              </button>
              <button
                onClick={() => {
                  setVoiceLang('ur-PK');
                  globalVoiceService.setLanguage('ur-PK');
                }}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                  voiceLang === 'ur-PK'
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-[#77717D] dark:text-[#AFA8B8]'
                }`}
              >
                اردو
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#77717D] dark:text-[#AFA8B8] hover:bg-[#F5F1E9] dark:hover:bg-[#2C2438] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Unsupported Web Speech Alert */}
          {!supported && (
            <div className="p-3.5 rounded-2xl bg-[#FFF8E7] dark:bg-[#2A2315] border border-[#F3E2B8] dark:border-[#4D3F20] text-xs text-[#8A6A1C] dark:text-[#E8C56B] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Web Speech API Not Available:</strong> Your current browser engine does not expose speech recognition. You can use the direct command input below.
              </div>
            </div>
          )}

          {/* Central Microphone Action Area */}
          {supported && (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="relative">
                {recognitionState === 'listening' && (
                  <div className="absolute inset-0 rounded-full bg-[#8B5CF6]/30 animate-ping scale-125" />
                )}
                <button
                  type="button"
                  onClick={recognitionState === 'listening' ? handleStopListening : handleStartListening}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                    recognitionState === 'listening'
                      ? 'bg-[#FF806E] text-white hover:bg-[#E56A59]'
                      : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                  }`}
                >
                  {recognitionState === 'listening' ? (
                    <MicOff className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#211B2C] dark:text-[#F5F1E9]">
                  {recognitionState === 'listening'
                    ? voiceLang === 'ur-PK' ? 'سن رہا ہے... بولئے' : 'Listening... Speak now'
                    : recognitionState === 'processing'
                    ? 'Processing Speech...'
                    : 'Click to Speak'}
                </span>
                <p className="text-[11px] text-[#77717D] dark:text-[#AFA8B8]">
                  {voiceLang === 'ur-PK'
                    ? 'مثال: "سی آر ایم کھولو" یا "ایکو سے کہو کہ کسٹمر کو جواب دے"'
                    : 'Try: "Open CRM", "Go to Finance", or "Ask Echo to draft response"'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] dark:bg-[#3B1818] border border-[#FCA5A5] dark:border-[#7F1D1D] text-xs text-[#DC2626] dark:text-[#F87171] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Transcript / Interpreted Command Display */}
          {transcript && (
            <div className="p-4 rounded-2xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[#77717D] dark:text-[#AFA8B8] font-mono">
                <span>Recognized Speech:</span>
                <span className="text-[#8B5CF6]">{Math.round((parsedCommand?.confidence || 0.9) * 100)}% Confidence</span>
              </div>
              <p className="text-sm font-medium text-[#211B2C] dark:text-[#F5F1E9] italic">
                "{transcript}"
              </p>

              {/* Navigation Command Match */}
              {parsedCommand?.type === 'navigate' && parsedCommand.targetRoute && (
                <div className="pt-3 border-t border-[#E2DBD0] dark:border-[#382F47] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span className="text-xs font-bold text-[#211B2C] dark:text-[#F5F1E9]">
                      Navigate to {parsedCommand.targetAgentName || parsedCommand.targetRoute.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleExecuteNavigation(parsedCommand.targetRoute!, parsedCommand.targetAgentId)}
                    className="px-3 py-1.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold hover:bg-[#7C3AED] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Go to Route</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Task Draft Match with Human Review */}
              {parsedCommand?.type === 'task_draft' && parsedCommand.taskDraft && (
                <div className="pt-3 border-t border-[#E2DBD0] dark:border-[#382F47] space-y-3">
                  <div className="flex items-center gap-2 text-[#8B5CF6]">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase font-mono">
                      Human Review: Interpreted Task Draft
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8] mb-1">
                        Assigned Agent
                      </label>
                      <select
                        value={parsedCommand.taskDraft.agentId}
                        onChange={(e) => {
                          const ag = TEAMORA_AGENTS.find((a) => a.id === e.target.value);
                          if (ag && parsedCommand.taskDraft) {
                            setParsedCommand({
                              ...parsedCommand,
                              taskDraft: {
                                ...parsedCommand.taskDraft,
                                agentId: ag.id,
                                agentName: ag.name,
                              },
                            });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs font-medium text-[#211B2C] dark:text-[#F5F1E9]"
                      >
                        {TEAMORA_AGENTS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} — {a.role} ({a.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8] mb-1">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={parsedCommand.taskDraft.title}
                        onChange={(e) => {
                          if (parsedCommand.taskDraft) {
                            setParsedCommand({
                              ...parsedCommand,
                              taskDraft: { ...parsedCommand.taskDraft, title: e.target.value },
                            });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs font-medium text-[#211B2C] dark:text-[#F5F1E9]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#77717D] dark:text-[#AFA8B8] mb-1">
                        Task Instructions / Prompt
                      </label>
                      <textarea
                        rows={3}
                        value={parsedCommand.taskDraft.prompt}
                        onChange={(e) => {
                          if (parsedCommand.taskDraft) {
                            setParsedCommand({
                              ...parsedCommand,
                              taskDraft: { ...parsedCommand.taskDraft, prompt: e.target.value },
                            });
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#FFFEFC] dark:bg-[#211B2C] border border-[#E2DBD0] dark:border-[#382F47] text-xs font-medium text-[#211B2C] dark:text-[#F5F1E9]"
                      />
                    </div>
                  </div>

                  {taskSubmittedMsg ? (
                    <div className="p-2.5 rounded-xl bg-[#10B981]/15 text-[#10B981] font-semibold text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{taskSubmittedMsg}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmTaskDraft}
                      disabled={isSubmittingTask}
                      className="w-full py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-bold hover:bg-[#7C3AED] flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
                    >
                      {isSubmittingTask ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Queueing Task...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Confirm & Queue Agent Task</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text Command Fallback Input */}
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-[#E2DBD0] dark:border-[#382F47]">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={
                  voiceLang === 'ur-PK'
                    ? 'یا ٹیکسٹ کمانڈ درج کریں (مثلاً "سی آر ایم کھولو")...'
                    : 'Or type voice command (e.g. "open inventory", "ask ledger to audit")...'
                }
                className="flex-1 px-3 py-2 rounded-xl bg-[#F5F1E9] dark:bg-[#2C2438] border border-[#E2DBD0] dark:border-[#382F47] text-xs text-[#211B2C] dark:text-[#F5F1E9] focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#211B2C] dark:bg-[#FFFEFC] text-[#F5F1E9] dark:text-[#211B2C] text-xs font-bold cursor-pointer hover:opacity-90"
              >
                Interpret
              </button>
            </div>
          </form>
        </div>

        {/* Footer Security Note */}
        <div className="p-3 bg-[#F5F1E9]/60 dark:bg-[#2C2438]/50 border-t border-[#E2DBD0] dark:border-[#382F47] px-6 text-center text-[10px] text-[#77717D] dark:text-[#AFA8B8]">
          Voice Security Guard: Microphone access is strictly temporary. Audio is never stored. Sensitive financial or deletion tasks mandate human confirmation.
        </div>
      </div>
    </div>
  );
};
