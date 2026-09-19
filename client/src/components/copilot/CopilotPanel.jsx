import React, { useState } from 'react';
import { X, Sparkles, Send, ArrowRight, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export function CopilotPanel({ isOpen, onClose, onOpenReview }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ASSISTANT',
      content: 'Hello! I am your **AI Operations Copilot**. I analyze real-time telemetry, cost records, and governance policies to answer questions and draft verifiable scaling proposals.\n\nHow can I assist your operations today?',
      citations: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'USER', content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/copilot/chat', { prompt });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ASSISTANT',
          content: '⚠️ Failed to contact Copilot service. Please verify server connectivity.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      {/* 480px Contextual Side Panel */}
      <div className="w-full max-w-[500px] bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-violet-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                AI Operations Copilot
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                  Grounded
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">Attributable Workspace Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-3.5 rounded-xl max-w-[90%] leading-relaxed ${
                  msg.role === 'USER'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                    : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-none space-y-2'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Attributable Citations List */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Verifiable Evidence Citations
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c) => (
                        <button
                          key={c.id || c.number}
                          onClick={() => setSelectedCitation(c)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-100 hover:bg-violet-200 text-violet-800 border border-violet-200 flex items-center gap-1 transition-colors"
                        >
                          [{c.number || c.citationNumber}] {c.label?.slice(0, 24)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Draft Card */}
                {msg.structuredDraft && (
                  <div className="p-3 bg-white rounded-lg border border-violet-200 shadow-xs mt-2 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-900">
                      <span className="flex items-center gap-1 text-violet-700">
                        <Sparkles className="w-3.5 h-3.5" />
                        Proposed Scaling Draft
                      </span>
                      <span className="font-mono text-blue-600">
                        {msg.structuredDraft.currentCapacity} → {msg.structuredDraft.proposedCapacity} replicas
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {msg.structuredDraft.summary}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Run-Rate: +{msg.structuredDraft.currency} {msg.structuredDraft.monthlyRateDelta?.toLocaleString()}/mo
                      </span>

                      <button
                        onClick={() => {
                          if (onOpenReview) onOpenReview(msg.structuredDraft);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-2xs"
                      >
                        Review Draft <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs italic p-2">
              <Sparkles className="w-4 h-4 animate-spin text-violet-600" />
              <span>Reading metrics → Checking cost data → Preparing cited answer...</span>
            </div>
          )}
        </div>

        {/* Prompt Suggestions */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleSend('Why should we scale Production API capacity?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0"
          >
            Why scale Production API?
          </button>
          <button
            onClick={() => handleSend('Why did our cost increase?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0"
          >
            Explain spend increase
          </button>
          <button
            onClick={() => handleSend('What needs attention in production?')}
            className="px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0"
          >
            Attention summary
          </button>
        </div>

        {/* Input Composer */}
        <div className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Copilot about services, costs, or policies..."
            className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Citation Detail Modal / Drawer */}
        {selectedCitation && (
          <div className="absolute inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-violet-800 font-mono">
                  Citation [{selectedCitation.number || selectedCitation.citationNumber}]
                </span>
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-xs font-semibold text-slate-900">{selectedCitation.label}</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                Source Type: {selectedCitation.sourceType}
              </p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto max-h-48 text-[11px] font-mono text-slate-700">
                <pre>{typeof selectedCitation.snapshotJson === 'string' ? JSON.stringify(JSON.parse(selectedCitation.snapshotJson), null, 2) : JSON.stringify(selectedCitation, null, 2)}</pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white"
                >
                  Close Evidence
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
