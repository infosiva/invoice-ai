'use client'

import { useState, useRef, useCallback } from 'react'

interface Props {
  onTranscript: (text: string) => void
  onParsing: (loading: boolean) => void
}

export default function VoiceInput({ onTranscript, onParsing }: Props) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [text, setText] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SR) {
      alert('Voice input is not supported in this browser. Try Chrome or Edge.')
      return
    }
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      if (!e.results.length) return
      const t = Array.from(e.results).map(r => r[0].transcript).join('')
      setTranscript(t)
      if (e.results[0].isFinal) {
        setText(t)
        setTranscript('')
      }
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const handleSubmit = useCallback(async () => {
    const input = text.trim()
    if (!input) return
    onParsing(true)
    onTranscript(input)
    setText('')
  }, [text, onTranscript, onParsing])

  return (
    <div className="space-y-4">
      {/* Mic button */}
      <div className="flex justify-center">
        <button
          onClick={listening ? stopListening : startListening}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
            listening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-red-500/40'
              : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/30'
          }`}
          aria-label={listening ? 'Stop listening' : 'Start voice input'}
        >
          <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zM7 10a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.93V20h3v2H8v-2h3v-3.07A7 7 0 0 1 5 10h2z"/>
          </svg>
        </button>
      </div>

      {/* Live transcript */}
      {(listening || transcript) && (
        <p className="text-center text-slate-400 text-sm italic animate-pulse min-h-[1.5rem]">
          {transcript || 'Listening…'}
        </p>
      )}

      {/* Text input fallback */}
      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit() } }}
          placeholder={'Try: "Charge Sarah $2,500 for logo design, 3 revisions, due in 2 weeks"'}
          rows={3}
          className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500 transition-colors"
        />
        <p className="absolute bottom-3 right-4 text-slate-600 text-xs">⌘↵ to parse</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-colors text-sm"
      >
        Parse Invoice →
      </button>
    </div>
  )
}
