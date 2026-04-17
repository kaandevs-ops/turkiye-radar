'use client'
import { useState, useEffect } from 'react'
import { aiConfigAl, aiConfigKaydet, DEFAULT_MODELS } from '@/lib/ai'
import type { AIConfig, AIProvider } from '@/lib/ai'

interface Props { onKapat: () => void }

const PROVIDERLAR: { id: AIProvider; label: string; aciklama: string; ucretsiz: boolean }[] = [
  { id: 'ollama', label: 'Ollama', aciklama: 'Local çalışır, tamamen ücretsiz', ucretsiz: true },
  { id: 'groq', label: 'Groq', aciklama: 'Ücretsiz tier, çok hızlı', ucretsiz: true },
  { id: 'openai', label: 'OpenAI', aciklama: 'GPT-4o-mini, ücretli', ucretsiz: false },
  { id: 'anthropic', label: 'Anthropic', aciklama: 'Claude Haiku, ücretli', ucretsiz: false },
]

export default function AIAyarlar({ onKapat }: Props) {
  const [config, setConfig] = useState<AIConfig>({ provider: 'ollama' })
  const [test, setTest] = useState<'bosta' | 'yukleniyor' | 'basarili' | 'hata'>('bosta')
  const [testMesaj, setTestMesaj] = useState('')
  const [kayitMesaj, setKayitMesaj] = useState('')

  useEffect(() => { setConfig(aiConfigAl()) }, [])

  async function testEt() {
    setTest('yukleniyor')
    setTestMesaj('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          baseUrl: config.baseUrl,
          system: 'Kısa yanıt ver.',
          messages: [{ role: 'user', content: 'Merhaba, çalışıyor musun? 1 cümle yanıt ver.' }],
        }),
      })
      const data = await res.json()
      if (data.hata) throw new Error(data.hata)
      setTest('basarili')
      setTestMesaj(data.content?.slice(0, 100) || 'Bağlantı başarılı')
    } catch (err: any) {
      setTest('hata')
      setTestMesaj(err.message || 'Bağlantı hatası')
    }
  }

  function kaydet() {
    aiConfigKaydet(config)
    setKayitMesaj('Kaydedildi ✓')
    setTimeout(() => setKayitMesaj(''), 2000)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: '#0d1117ee', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onKapat}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 'min(480px, 95vw)', background: '#0d1117',
        border: '1px solid #21262d', borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <div>
            <div style={{ color: '#e6edf3', fontWeight: 700, fontSize: '15px' }}>AI Ayarları</div>
            <div style={{ color: '#555', fontSize: '11px' }}>Yapay zeka provider seçin</div>
          </div>
          <button onClick={onKapat} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '20px' }}>✕</button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Provider Seçimi */}
          <div>
            <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Provider</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PROVIDERLAR.map(p => (
                <button key={p.id} onClick={() => setConfig(c => ({ ...c, provider: p.id, model: c.provider !== p.id ? DEFAULT_MODELS[p.id] : (c.model || DEFAULT_MODELS[p.id]) }))} style={{
                  background: config.provider === p.id ? '#161b22' : 'transparent',
                  border: `1px solid ${config.provider === p.id ? '#58a6ff' : '#21262d'}`,
                  borderRadius: '8px', padding: '10px 12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
                }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: config.provider === p.id ? '#58a6ff' : '#333',
                    boxShadow: config.provider === p.id ? '0 0 6px #58a6ff' : 'none',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: config.provider === p.id ? '#e6edf3' : '#8b949e', fontSize: '13px', fontWeight: 600 }}>{p.label}</div>
                    <div style={{ color: '#555', fontSize: '11px' }}>{p.aciklama}</div>
                  </div>
                  {p.ucretsiz && (
                    <span style={{ background: '#00cc8822', border: '1px solid #00cc8844', borderRadius: '4px', padding: '2px 6px', color: '#00cc88', fontSize: '10px', fontWeight: 700 }}>
                      ÜCRETSİZ
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Model</div>
            <input
              value={config.model ?? DEFAULT_MODELS[config.provider]}
              onChange={e => setConfig(c => ({ ...c, model: e.target.value }))}
              placeholder={DEFAULT_MODELS[config.provider]}
              style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 10px', color: '#e6edf3', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* API Key (ollama hariç) */}
          {config.provider !== 'ollama' && (
            <div>
              <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>API Key</div>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
                placeholder={`${config.provider} API key...`}
                style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 10px', color: '#e6edf3', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
              {config.provider === 'groq' && (
                <div style={{ color: '#555', fontSize: '10px', marginTop: '4px' }}>
                  Ücretsiz key için: <span style={{ color: '#58a6ff' }}>console.groq.com</span>
                </div>
              )}
            </div>
          )}

          {/* Ollama URL */}
          {config.provider === 'ollama' && (
            <div>
              <div style={{ color: '#8b949e', fontSize: '11px', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ollama URL</div>
              <input
                value={config.baseUrl || 'http://localhost:11434'}
                onChange={e => setConfig(c => ({ ...c, baseUrl: e.target.value }))}
                style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', borderRadius: '6px', padding: '8px 10px', color: '#e6edf3', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ color: '#555', fontSize: '10px', marginTop: '4px' }}>
                Ollama yüklü değilse: <span style={{ color: '#58a6ff' }}>ollama.com</span> → ollama pull llama3
              </div>
            </div>
          )}

          {/* Test */}
          <div>
            <button onClick={testEt} disabled={test === 'yukleniyor'} style={{
              width: '100%', background: '#161b22', border: '1px solid #30363d',
              borderRadius: '8px', padding: '10px', color: '#8b949e',
              fontSize: '12px', cursor: test === 'yukleniyor' ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              {test === 'yukleniyor' ? '⏳ Test ediliyor...' : '🔌 Bağlantıyı Test Et'}
            </button>
            {testMesaj && (
              <div style={{
                marginTop: '6px', padding: '8px 10px', borderRadius: '6px', fontSize: '11px',
                background: test === 'basarili' ? '#00cc8822' : '#ff444422',
                border: `1px solid ${test === 'basarili' ? '#00cc8844' : '#ff444444'}`,
                color: test === 'basarili' ? '#00cc88' : '#ff6666',
              }}>
                {test === 'basarili' ? '✓ ' : '✗ '}{testMesaj}
              </div>
            )}
          </div>

          {/* Kaydet */}
          <button onClick={kaydet} style={{
            width: '100%', background: '#1f6feb', border: 'none',
            borderRadius: '8px', padding: '11px', color: '#fff',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          }}>
            {kayitMesaj || 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
