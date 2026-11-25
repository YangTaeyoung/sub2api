import { describe, expect, it } from 'vitest'
import { formatModelDisplayName } from '../modelDisplayName'

describe('formatModelDisplayName', () => {
  it.each([
    ['gpt-6.1-sol', 'GPT-6.1 Sol'],
    ['gpt-6-luna', 'GPT-6 Luna'],
    ['gpt-6.2-terra', 'GPT-6.2 Terra'],
    ['gpt-oss-120b-medium', 'GPT-OSS 120B · Medium'],
    ['gemini-4-neon-medium', 'Gemini 4 Neon · Medium'],
    ['gemini-4-neon-xhigh', 'Gemini 4 Neon · XHigh'],
    ['gemini-3.1-pro', 'Gemini 3.1 Pro'],
    ['gemini-2.5-flash-lite', 'Gemini 2.5 Flash Lite'],
    ['models/gemini-3.8-flash-high', 'Gemini 3.8 Flash · High'],
    ['claude-sonnet-5-5', 'Claude Sonnet 5.5'],
    ['claude-haiku-4-5-20251001', 'Claude Haiku 4.5'],
    ['claude-opus-5-5-high', 'Claude Opus 5.5 · High'],
    ['claude-opus-4-6-thinking', 'Claude Opus 4.6 Thinking'],
    ['Claude-Fable-5-2', 'Claude Fable 5.2']
  ])('formats %s as %s', (id, label) => {
    expect(formatModelDisplayName(id)).toBe(label)
  })

  it.each(['o3-mini', 'tab_flash_lite_preview', 'glm-5', 'gpt'])('returns %s unchanged', (id) => {
    expect(formatModelDisplayName(id)).toBe(id)
  })

  it('returns an empty string for a missing id', () => {
    expect(formatModelDisplayName(undefined)).toBe('')
    expect(formatModelDisplayName('  ')).toBe('')
  })
})
