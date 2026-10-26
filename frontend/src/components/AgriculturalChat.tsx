import { useState, type FormEvent } from 'react'

type Message = {
  role: 'assistant' | 'user'
  text: string
  sources?: string[]
}

const API_URL = (
  import.meta.env.VITE_CHATBOT_API_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '')

const suggestions = [
  'How can farmers improve soil health?',
  'How should I manage irrigation?',
  'How can I prevent crop pests?',
  'How should fertilizer be applied?',
]

export default function AgriculturalChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Farm Assistant. Ask me about soil health, crop selection, irrigation, fertilizers, pest management, or water conservation.',
    },
  ])
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function sendQuestion(value: string) {
    const text = value.trim()
    if (!text || sending) return

    setMessages(current => [...current, { role: 'user', text }])
    setQuestion('')
    setSending(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : `Chat request failed (${response.status}).`,
        )
      }

      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          text: data.answer || 'I could not generate an answer.',
          sources: Array.isArray(data.sources) ? data.sources : [],
        },
      ])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to the AI Farm Assistant.',
      )
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendQuestion(question)
  }

  return (
    <section className="panel farm-chat">
      <div className="farm-chat-header">
        <div className="farm-chat-brand">
          <div className="farm-chat-avatar" aria-hidden="true">✳</div>
          <div>
            <h2>AI Farm Assistant</h2>
            <p>Gemini-powered agricultural knowledge assistant</p>
          </div>
        </div>
        <span className="farm-chat-status">
          <span className="live-dot" /> AI assistant
        </span>
      </div>

      <div className="farm-chat-intro">
        <span className="eyebrow">AGRICULTURAL KNOWLEDGE</span>
        <h3>How can we help your farm today?</h3>
        <p>
          Ask a question and get an answer grounded in the agriculture
          knowledge base. Verify important decisions with local agricultural
          experts.
        </p>
      </div>

      {messages.length === 1 && (
        <div className="farm-chat-suggestions">
          {suggestions.map(item => (
            <button
              type="button"
              key={item}
              className="farm-chat-suggestion"
              disabled={sending}
              onClick={() => void sendQuestion(item)}
            >
              <span aria-hidden="true">↗</span> {item}
            </button>
          ))}
        </div>
      )}

      <div className="farm-chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <article
            key={`${index}-${message.role}`}
            className={`farm-chat-message ${message.role}`}
          >
            <div className="farm-chat-message-label">
              {message.role === 'assistant' ? 'AI FARM ASSISTANT' : 'YOU'}
            </div>
            <p>{message.text}</p>

            {!!message.sources?.length && (
              <details className="farm-chat-sources">
                <summary>Knowledge sources ({message.sources.length})</summary>
                <ul>
                  {message.sources.map((source, sourceIndex) => (
                    <li key={`${sourceIndex}-${source.slice(0, 30)}`}>
                      {source}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        ))}

        {sending && (
          <div className="farm-chat-thinking" role="status">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span>Researching your question…</span>
          </div>
        )}
      </div>

      {error && (
        <div className="farm-chat-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <form className="farm-chat-form" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="farm-chat-question">
          Ask an agricultural question
        </label>
        <input
          id="farm-chat-question"
          value={question}
          onChange={event => setQuestion(event.target.value)}
          placeholder="Ask about soil, irrigation, pests..."
          disabled={sending}
          maxLength={2000}
        />
        <button
          className="btn btn-primary"
          type="submit"
          disabled={sending || !question.trim()}
        >
          {sending ? 'Thinking…' : 'Ask AI ↗'}
        </button>
      </form>

      <p className="farm-chat-disclaimer">
        AI-generated guidance can be incomplete. Confirm pesticide, fertilizer,
        and crop-treatment decisions with qualified local experts.
      </p>
    </section>
  )
}
