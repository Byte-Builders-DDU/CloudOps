import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Sparkles,
  Send,
  ArrowRight,
  MessageSquare,
  Shield,
  Clock,
  TrendingUp,
  RefreshCw,
  X,
} from 'lucide-react';
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
    <div className="h-[calc(100vh-6.5rem)] flex gap-4 overflow-hidden">
      {/* Left Column: Investigation Threads */}
      <div className="w-64 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col shrink-0 overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
            Threads
          </span>
          <button
            onClick={() => { setActiveThreadId(null); setMessages([]); }}
            className="text-[11px] text-violet-600 font-semibold hover:underline"
          >
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {threads.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">No saved threads yet.</div>
          ) : (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs truncate transition-colors ${
                  activeThreadId === t.id
                    ? 'bg-violet-50 text-violet-900 font-semibold border border-violet-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.title}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Center Column: Active Conversation */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        {/* Thread Header */}
        <div className="p-3.5 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">Production AI Operations Copilot</h2>
              <span className="text-[10px] text-slate-500 font-mono">Model: gemini-2.0-flash-grounded</span>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Read-Only Sandboxed
          </span>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-4 rounded-xl max-w-[80%] leading-relaxed ${
                  msg.role === 'USER'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-xs'
                    : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-none space-y-3'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Verifiable Database Citations
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c) => (
                        <button
                          key={c.id || c.number}
                          onClick={() => setActiveCitation(c)}
                          className="px-2 py-1 rounded text-[10px] font-mono bg-violet-100 hover:bg-violet-200 text-violet-800 border border-violet-200 flex items-center gap-1 transition-colors"
                        >
                          [{c.number || c.citationNumber}] {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Change Draft */}
                {msg.structuredDraft && (
                  <div className="p-3.5 bg-white rounded-lg border border-violet-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                      <span className="text-violet-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Executable Review Draft
                      </span>
                      <span className="font-mono text-blue-600">
                        {msg.structuredDraft.currentCapacity} → {msg.structuredDraft.proposedCapacity} replicas
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{msg.structuredDraft.summary}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        Run-Rate Delta: +{msg.structuredDraft.currency} {msg.structuredDraft.monthlyRateDelta?.toLocaleString()}/mo
                      </span>
                      <button
                        onClick={() => openChangeReview && openChangeReview(msg.structuredDraft)}
                        className="px-3 py-1 text-xs font-semibold rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-xs"
                      >
                        Review Draft in Drawer <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs italic p-3">
              <Sparkles className="w-4 h-4 animate-spin text-violet-600" />
              <span>Retrieving workspace telemetry & policy rules...</span>
            </div>
          )}
        </div>

        {/* Input Composer */}
        <div className="p-3.5 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Copilot about services, cost variations, or capacity scaling..."
              className="flex-1 text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              Send <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Evidence / Citation Inspector */}
      {activeCitation && (
        <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col shrink-0 overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-violet-800 font-mono">
              Citation Evidence [{activeCitation.number || activeCitation.citationNumber}]
            </span>
            <button onClick={() => setActiveCitation(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs">
            <h4 className="font-semibold text-slate-900">{activeCitation.label}</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 block">
              Source: {activeCitation.sourceType}
            </span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 overflow-x-auto text-[11px] font-mono text-slate-700">
              <pre>{typeof activeCitation.snapshotJson === 'string' ? JSON.stringify(JSON.parse(activeCitation.snapshotJson), null, 2) : JSON.stringify(activeCitation, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
