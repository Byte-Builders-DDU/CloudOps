import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Sparkles, Send, ArrowRight, MessageSquare, Shield, Clock, TrendingUp, RefreshCw, X } from 'lucide-react';
import api from '../services/api';

export function Copilot() {
  const { openChangeReview } = useOutletContext() || {};
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'ASSISTANT',
      content: 'Welcome to the **AI Operations Copilot Workspace**.\n\nI have direct access to your workspace telemetry, real-time metrics, cost allocations, and governance policies. Every factual claim is backed by a verifiable database citation.\n\nWhat would you like to investigate?',
      citations: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const res = await api.get('/copilot/threads');
      if (res.data.success) {
        setThreads(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching threads:', err);
    }
  };

  const handleSend = async (textToSend) => {
    const prompt = textToSend || input;
    if (!prompt.trim() || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'USER', content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/copilot/chat', {
        prompt,
        threadId: activeThreadId,
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        if (!activeThreadId) {
          setActiveThreadId(res.data.data.threadId);
          fetchThreads();
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ASSISTANT',
          content: '⚠️ Unable to complete Copilot query. Please verify backend connectivity.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 overflow-hidden animate-fade-in">
      {/* Left Column: Investigation Threads */}
      <div className="w-64 glass-card rounded-2xl flex flex-col shrink-0 overflow-hidden border border-white/[0.08]">
        <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            Threads
          </span>
          <button
            onClick={() => { setActiveThreadId(null); setMessages([]); }}
            className="text-[11px] text-violet-400 font-bold hover:text-violet-300 transition-colors uppercase tracking-wide"
          >
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs font-mono">No saved threads yet.</div>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full text-left p-3 rounded-xl text-xs truncate transition-all duration-200 ${
                  activeThreadId === t.id
                    ? 'bg-violet-500/10 text-violet-300 font-bold border border-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent'
                }`}
              >
                {t.title}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Center Column: Active Conversation */}
      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/[0.08] relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        
        {/* Thread Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.4)] border border-violet-500/50">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">Production AI Operations Copilot</h2>
              <span className="text-[10px] text-slate-400 font-mono">Model: gemini-2.0-flash-grounded</span>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Read-Only Sandboxed
          </span>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-4 rounded-2xl max-w-[85%] leading-relaxed ${
                  msg.role === 'USER'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-sm shadow-[0_4px_16px_rgba(37,99,235,0.2)]'
                    : 'bg-white/[0.03] text-slate-200 border border-white/[0.08] rounded-tl-sm space-y-3'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-3 border-t border-white/[0.06] space-y-2 mt-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Verifiable Database Citations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.citations.map((c) => (
                        <button
                          key={c.id || c.number}
                          onClick={() => setActiveCitation(c)}
                          className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 flex items-center gap-1.5 transition-colors"
                        >
                          <span className="text-violet-400">[{c.number || c.citationNumber}]</span> {c.label?.slice(0, 30)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Change Draft */}
                {msg.structuredDraft && (
                  <div className="p-4 bg-violet-500/5 rounded-xl border border-violet-500/20 shadow-inner mt-3 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5 text-violet-400 uppercase tracking-wider text-[11px]" style={{ filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.5))' }}>
                        <Sparkles className="w-3.5 h-3.5" />
                        Executable Review Draft
                      </span>
                      <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {msg.structuredDraft.currentCapacity} → {msg.structuredDraft.proposedCapacity} replicas
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{msg.structuredDraft.summary}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Run-Rate Delta: <span className="text-blue-400 font-bold">+{msg.structuredDraft.currency} {msg.structuredDraft.monthlyRateDelta?.toLocaleString()}/mo</span>
                      </span>
                      <button
                        onClick={() => openChangeReview && openChangeReview(msg.structuredDraft)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1.5 shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-colors"
                      >
                        Review Draft in Drawer <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-violet-400 text-xs italic p-3 font-medium">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span className="opacity-80">Retrieving workspace telemetry &amp; policy rules...</span>
            </div>
          )}
        </div>

        {/* Input Composer */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.03] flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Copilot about services, cost variations, or capacity scaling..."
            className="flex-1 text-sm p-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all shadow-inner"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="p-3 px-5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition-colors shadow-[0_0_12px_rgba(139,92,246,0.3)] font-bold flex items-center gap-2"
          >
            Send <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Column: Evidence / Citation Inspector */}
      {activeCitation && (
        <div className="w-80 glass-card rounded-2xl flex flex-col shrink-0 overflow-hidden border border-white/[0.08] animate-slide-right relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
          <div className="p-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
            <span className="text-[11px] font-bold text-violet-400 font-mono uppercase tracking-wider">
              Evidence <span className="bg-violet-500/20 px-1.5 py-0.5 rounded ml-1">[{activeCitation.number || activeCitation.citationNumber}]</span>
            </span>
            <button onClick={() => setActiveCitation(null)} className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.08] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <h4 className="text-sm font-bold text-white leading-snug">{activeCitation.label}</h4>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.05] text-slate-400 block uppercase tracking-wider">
              Source: <span className="text-white">{activeCitation.sourceType}</span>
            </span>
            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.05] overflow-x-auto text-[11px] font-mono text-slate-400 shadow-inner scrollbar-hide">
              <pre>{typeof activeCitation.snapshotJson === 'string' ? JSON.stringify(JSON.parse(activeCitation.snapshotJson), null, 2) : JSON.stringify(activeCitation, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
