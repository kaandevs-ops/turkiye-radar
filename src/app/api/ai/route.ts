export const maxDuration = 300

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { provider, apiKey, model, baseUrl, messages, system } = await req.json()

  console.log('[AI] provider:', provider, 'model:', model)

  try {
    if (provider === 'ollama') {
      const url = (baseUrl || 'http://localhost:11434') + '/api/chat'

      // JSON modu için system prompt'u güçlendir
      const isJsonRequest = system?.includes('JSON') || system?.includes('json')
      const ollamaMessages = system
        ? [{ role: 'system', content: system }, ...messages]
        : messages

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'qwen3.5:latest',
          messages: ollamaMessages,
          stream: false,
          think: false,
          // JSON modu: model sadece geçerli JSON üretir
          ...(isJsonRequest ? { format: 'json' } : {}),
          options: {
            temperature: 0.1,      // Düşük sıcaklık = daha tutarlı JSON
            num_predict: 800,
            repeat_penalty: 1.1,
          },
        }),
        signal: AbortSignal.timeout(180000),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Ollama hata ${res.status}: ${err.slice(0, 200)}`)
      }
      const data = await res.json()
      const content = data.message?.content || data.response || ''
      console.log('[AI] yanıt (ilk 200):', content.slice(0, 200))
      return NextResponse.json({ content })
    }

    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || 'llama3-70b-8192',
          messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
          max_tokens: 1000, temperature: 0.3,
        }),
        signal: AbortSignal.timeout(60000),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return NextResponse.json({ content: data.choices[0]?.message?.content || '' })
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
          max_tokens: 1000, temperature: 0.3,
        }),
        signal: AbortSignal.timeout(60000),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return NextResponse.json({ content: data.choices[0]?.message?.content || '' })
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          system: system || '',
          messages,
        }),
        signal: AbortSignal.timeout(60000),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return NextResponse.json({ content: data.content?.[0]?.text || '' })
    }

    return NextResponse.json({ hata: 'Geçersiz provider' }, { status: 400 })
  } catch (err: any) {
    console.error('[AI] hata:', err.message)
    return NextResponse.json({ hata: err.message || 'AI hatası' }, { status: 500 })
  }
}