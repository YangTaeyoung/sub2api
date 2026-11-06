import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import en from '../locales/en'
import ko from '../locales/ko'
import { baseCompile } from '@intlify/message-compiler'

function flatten(value: unknown, prefix = '', result: Record<string, string> = {}): Record<string, string> {
  if (typeof value === 'string') result[prefix] = value
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, result)
  }
  return result
}

const english = flatten(en)
const korean = flatten(ko)
const tokens = (value: string) => [...value.matchAll(/\{(?:[^{}]|'\{'|'\}')+\}/g)].map(([token]) => token).sort()

describe('Korean locale completeness', () => {
  it('contains no temporary preview fallback modules', () => {
    const sources = import.meta.glob('../locales/ko/**/*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
    expect(Object.keys(sources).length).toBeGreaterThan(0)
    expect(Object.entries(sources).filter(([, source]) => source.includes('PREVIEW ONLY')).map(([name]) => name)).toEqual([])
  })

  it('translates the complete English schema without empty values', () => {
    expect(Object.keys(korean).sort()).toEqual(Object.keys(english).sort())
    expect(Object.entries(korean).filter(([, value]) => !value.trim())).toEqual([])
  })

  it('preserves interpolation and literal tokens for every message', () => {
    const mismatches = Object.keys(english).filter((key) => JSON.stringify(tokens(english[key])) !== JSON.stringify(tokens(korean[key])) ||
      english[key].split('|').length !== korean[key].split('|').length)
    expect(mismatches).toEqual([])
  })

  it('compiles every message before it reaches a page', () => {
    const errors: string[] = []
    for (const [key, value] of Object.entries(korean)) {
      baseCompile(value, { onError: (error) => errors.push(`${key}: ${error.message}`) })
    }
    expect(errors).toEqual([])
  })

  it('preserves HTML, URLs, code snippets, and environment variables', () => {
    const tags = (value: string) => value.match(/<\/?[a-z][^>]*>/gi) ?? []
    const urls = (value: string) => (value.match(/https?:\/\/[a-zA-Z0-9./?=_&%:+#~-]+/g) ?? []).map((url) => url.replace(/:$/, ''))
    const code = (value: string) => (value.match(/`[^`]+`/g) ?? []).sort()
    const env = (value: string) => (value.match(/(?<![A-Za-z0-9_])[A-Z][A-Z0-9]*_[A-Z0-9_]+(?![A-Za-z0-9_])/g) ?? []).sort()
    const mismatches = Object.keys(english).filter((key) =>
      JSON.stringify(code(english[key])) !== JSON.stringify(code(korean[key])) ||
      JSON.stringify(env(english[key])) !== JSON.stringify(env(korean[key])) ||
      JSON.stringify(tags(english[key])) !== JSON.stringify(tags(korean[key])) ||
      JSON.stringify(urls(english[key])) !== JSON.stringify(urls(korean[key]))
    )
    expect(mismatches).toEqual([])
  })

  it('uses native Korean for primary product navigation', () => {
    expect(ko.common.save).toBe('저장')
    expect(ko.admin.dashboard.workspaceTitle).toBe('개요')
    expect(ko.admin.dashboard.noAccountsHint).toContain('계정')
    expect(Object.values(korean).filter((value) => /[가-힣]/.test(value)).length).toBeGreaterThan(7500)
  })
})

describe('Korean locale initialization', () => {
  afterEach(() => vi.unstubAllGlobals())

  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  it('detects Korean browser language and exposes native language names', async () => {
    vi.stubGlobal('navigator', { language: 'ko-KR' })
    const { getLocale, getIntlLocale, availableLocales } = await import('../index')
    expect(getLocale()).toBe('ko')
    expect(getIntlLocale()).toBe('ko-KR')
    expect(availableLocales.find(({ code }) => code === 'ko')?.name).toBe('한국어')
  })

  it.each(['en', 'zh', 'ko'])('preserves the saved %s preference', async (locale) => {
    vi.stubGlobal('navigator', { language: 'ko-KR' })
    localStorage.setItem('sub2api_locale', locale)
    const { getLocale } = await import('../index')
    expect(getLocale()).toBe(locale)
  })

  it('loads Korean messages and updates the document language', async () => {
    vi.stubGlobal('navigator', { language: 'ko-KR' })
    const { initI18n, i18n } = await import('../index')
    await initI18n()
    expect(document.documentElement.lang).toBe('ko')
    expect(i18n.global.getLocaleMessage('ko')).toMatchObject({ common: { save: '저장' } })
  })
})
