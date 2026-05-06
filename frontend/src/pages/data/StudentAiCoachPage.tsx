import { Bot, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { postJson } from '../../lib/api'

type Message = { id: number; role: 'user' | 'assistant'; text: string }

let msgId = 0

function FormattedText({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/)
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        const isList = lines.some((l) => /^[•\-\*]\s|^\d+\.\s/.test(l.trim()))
        if (isList) {
          return (
            <ul key={i} className="space-y-1 pl-1">
              {lines
                .filter((l) => l.trim())
                .map((line, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-green-400">›</span>
                    <span>{line.replace(/^[•\-\*\d\.]+\s*/, '').trim()}</span>
                  </li>
                ))}
            </ul>
          )
        }
        return (
          <p key={i} className="whitespace-pre-wrap leading-relaxed">
            {block}
          </p>
        )
      })}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-1 py-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 rounded-full bg-slate-500 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

export function StudentAiCoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: ++msgId,
      role: 'assistant',
      text: "Hi! I'm your AI Study Coach. Ask me anything about your subjects, study strategies, or exam prep. I'm here to help!",
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setErr(null)
    const userMsg: Message = { id: ++msgId, role: 'user', text }
    setMessages((m) => [...m, userMsg])
    setBusy(true)
    try {
      const data = await postJson<{ answer?: string }>('/api/ai/ask', { prompt: text })
      const answer = typeof data.answer === 'string' ? data.answer : JSON.stringify(data)
      setMessages((m) => [...m, { id: ++msgId, role: 'assistant', text: answer }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed'
      setErr(msg)
    } finally {
      setBusy(false)
      textareaRef.current?.focus()
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  function clearChat() {
    setMessages([
      {
        id: ++msgId,
        role: 'assistant',
        text: "Hi! I'm your AI Study Coach. Ask me anything about your subjects, study strategies, or exam prep. I'm here to help!",
      },
    ])
    setErr(null)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-2xl flex-col rounded-2xl border border-white/[0.08] bg-[#111111] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm">
            <Bot className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">AI Study Coach</p>
            <p className="text-xs text-slate-500">Powered by Gemini · Press Enter to send</p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          title="Clear conversation"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                <Bot className="h-3.5 w-3.5 text-white" strokeWidth={2} />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'rounded-tr-sm bg-green-600 text-white'
                  : 'rounded-tl-sm border border-white/[0.06] bg-white/[0.04] text-slate-200'
              }`}
            >
              {msg.role === 'assistant' ? (
                <FormattedText text={msg.text} />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="ml-9 rounded-2xl rounded-tl-sm border border-white/[0.06] bg-white/[0.04] px-4 py-3 shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        )}

        {err && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {err}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
            rows={1}
            placeholder="Ask a study question… (Enter to send, Shift+Enter for newline)"
            className="flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-green-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-50 max-h-32 overflow-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm transition hover:bg-green-500 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
