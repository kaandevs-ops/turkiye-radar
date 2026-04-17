export type AIProvider = 'ollama' | 'groq' | 'openai' | 'anthropic'

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
  model?: string
  baseUrl?: string
}

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  ollama: 'llama3',
  groq: 'llama3-70b-8192',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
}

export function aiConfigAl(): AIConfig {
  if (typeof window === 'undefined') return { provider: 'ollama' }
  try {
    const json = localStorage.getItem('tr-radar-ai-config')
    return json ? JSON.parse(json) : { provider: 'ollama' }
  } catch { return { provider: 'ollama' } }
}

export function aiConfigKaydet(config: AIConfig) {
  localStorage.setItem('tr-radar-ai-config', JSON.stringify(config))
}
