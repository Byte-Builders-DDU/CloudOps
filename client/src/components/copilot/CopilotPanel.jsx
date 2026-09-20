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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end">
      {/* 500px Contextual Side Panel */}
      <div className="w-full max-w-[500px] h-full flex flex-col border-l border-white/[0.08] relative z-10 animate-slide-right"
           style={{ background: 'rgba(8,15,33,0.97)', boxShadow: '-24px 0 80px rgba(0,0,0,0.8)' }}>
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.4)] border border-violet-500/50">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                AI Operations Copilot
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-400">
                  Grounded
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Attributable Workspace Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm text-slate-300">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[90%] leading-relaxed ${
                  msg.role === 'USER'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-sm shadow-[0_4px_16px_rgba(37,99,235,0.2)]'
                    : 'bg-white/[0.03] text-slate-200 border border-white/[0.08] rounded-tl-sm space-y-3'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Attributable Citations List */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Verifiable Evidence Citations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((c) => (
                        <button
                          key={c.id || c.number}
                          onClick={() => setSelectedCitation(c)}
                          className="px-2 py-1 rounded-md text-[10px] font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 flex items-center gap-1.5 transition-colors"
                        >
                          <span className="text-violet-400">[{c.number || c.citationNumber}]</span> {c.label?.slice(0, 28)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Draft Card */}
                {msg.structuredDraft && (
                  <div className="p-4 bg-violet-500/5 rounded-xl border border-violet-500/20 shadow-inner mt-3 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5 text-violet-400 uppercase tracking-wider text-[11px]" style={{ filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.5))' }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        Proposed Scaling Draft
                      </span>
                      <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {msg.structuredDraft.currentCapacity} → {msg.structuredDraft.proposedCapacity} replicas
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {msg.structuredDraft.summary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Run-Rate: <span className="text-blue-400 font-bold">+{msg.structuredDraft.currency} {msg.structuredDraft.monthlyRateDelta?.toLocaleString()}/mo</span>
                      </span>

                      <button
                        onClick={() => {
                          if (onOpenReview) onOpenReview(msg.structuredDraft);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-colors"
                      >
                        Review Draft <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-violet-400 text-xs italic p-2 font-medium">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="opacity-80">Analyzing workspace context & policies...</span>
            </div>
          )}
        </div>

        {/* Prompt Suggestions */}
        <div className="px-5 py-3 bg-white/[0.02] border-t border-white/[0.06] flex gap-2 overflow-x-auto text-[11px] scrollbar-hide">
          <button
            onClick={() => handleSend('Why should we scale Production API capacity?')}
            className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white shrink-0 transition-colors"
          >
            Why scale Production API?
          </button>
          <button
            onClick={() => handleSend('Why did our cost increase?')}
            className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white shrink-0 transition-colors"
          >
            Explain spend increase
          </button>
          <button
            onClick={() => handleSend('What needs attention in production?')}
            className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:bg-white/[0.08] hover:text-white shrink-0 transition-colors"
          >
            Attention summary
          </button>
        </div>

        {/* Input Composer */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.03] flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Copilot about services, costs, or policies..."
            className="flex-1 text-sm p-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-3 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-[0_0_12px_rgba(139,92,246,0.3)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Citation Detail Modal / Drawer */}
        {selectedCitation && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
            <div className="bg-[#0B1426] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/[0.1] max-w-md w-full p-6 space-y-4 animate-slide-up">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-xs font-bold text-violet-400 font-mono bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20">
                  Citation [{selectedCitation.number || selectedCitation.citationNumber}]
                </span>
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-sm font-bold text-white leading-snug">{selectedCitation.label}</h4>
              <p className="text-[11px] text-slate-400 font-mono">
                Source Type: <span className="text-slate-300 bg-white/[0.05] px-1.5 py-0.5 rounded">{selectedCitation.sourceType}</span>
              </p>

              <div className="p-4 bg-black/40 rounded-xl border border-white/[0.05] overflow-x-auto max-h-64 text-[11px] font-mono text-slate-400 scrollbar-hide shadow-inner">
                <pre>{typeof selectedCitation.snapshotJson === 'string' ? JSON.stringify(JSON.parse(selectedCitation.snapshotJson), null, 2) : JSON.stringify(selectedCitation, null, 2)}</pre>
              </div>

              <div className="pt-2 flex justify-end border-t border-white/[0.06]">
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-white/[0.05] border border-white/[0.1] text-white hover:bg-white/[0.1] transition-colors"
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
