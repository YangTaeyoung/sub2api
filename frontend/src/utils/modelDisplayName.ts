const FAMILY_LABELS: Record<string, string> = {
  gpt: 'GPT',
  claude: 'Claude',
  gemini: 'Gemini',
  grok: 'Grok',
  deepseek: 'DeepSeek'
}

const TIER_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'XHigh',
  tiered: 'Tiered'
}

const UPPERCASE_WORDS = new Set(['oss', 'tts', 'api'])

function formatSegment(segment: string): string {
  if (UPPERCASE_WORDS.has(segment)) return segment.toUpperCase()
  if (/^\d+[bkm]$/.test(segment)) return segment.toUpperCase()
  if (/^\d/.test(segment)) return segment
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

function mergeVersionSegments(segments: string[]): string[] {
  const merged: string[] = []
  for (const segment of segments) {
    const previous = merged[merged.length - 1]
    if (/^\d{1,2}$/.test(segment) && previous !== undefined && /^\d{1,2}$/.test(previous)) {
      merged[merged.length - 1] = `${previous}.${segment}`
    } else {
      merged.push(segment)
    }
  }
  return merged
}

/**
 * Returns a readable label for a model id of a known family
 * (`gpt-6.1-sol` -> `GPT-6.1 Sol`, `gemini-4-neon-high` -> `Gemini 4 Neon · High`).
 * Ids of other families, and empty ids, are returned unchanged.
 */
export function formatModelDisplayName(modelId: string | null | undefined): string {
  const raw = (modelId ?? '').trim()
  if (!raw) return ''

  const name = raw.slice(raw.lastIndexOf('/') + 1).toLowerCase()
  const segments = name.split('-').filter(Boolean)
  const family = FAMILY_LABELS[segments[0]]
  if (!family || segments.length < 2) return raw

  let rest = segments.slice(1)
  if (/^\d{8}$/.test(rest[rest.length - 1])) rest = rest.slice(0, -1)

  let tier = ''
  if (rest.length > 1 && TIER_LABELS[rest[rest.length - 1]]) {
    tier = TIER_LABELS[rest[rest.length - 1]]
    rest = rest.slice(0, -1)
  }
  if (rest.length === 0) return raw

  const words = mergeVersionSegments(rest).map(formatSegment)
  const label =
    segments[0] === 'gpt' ? `${family}-${words[0]}${words.length > 1 ? ' ' + words.slice(1).join(' ') : ''}` : `${family} ${words.join(' ')}`

  return tier ? `${label} · ${tier}` : label
}
