/**
 * Centralized platform color definitions.
 *
 * Platform styling helpers. Every platform resolves to the same neutral
 * classes; the platform is identified by its glyph and label.
 */

import { getPlatformSpec } from '@/constants/platformCatalog'

export type Platform =
  | 'anthropic'
  | 'openai'
  | 'antigravity'
  | 'gemini'
  | 'grok'
  | 'kimi'
  | 'zhipu'
  | 'deepseek'
  | 'minimax'
  | 'opencode_go'
  | 'typesafe'
  | 'command_code'
  | 'cline'
  | 'composite'

const BADGE = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-dark-700 dark:text-dark-200 dark:border-dark-600'
const BADGE_LIGHT = 'bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-dark-200'
const BORDER = 'border-gray-200 dark:border-dark-700'
const BORDER_STRONG = 'border-gray-300 dark:border-dark-600'
const ACCENT = '#68707e'
const ACCENT_BAR = 'bg-gray-300 dark:bg-dark-600'
const TEXT = 'text-gray-700 dark:text-dark-200'
const ICON = 'text-gray-500 dark:text-dark-300'
const BUTTON = 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500'
const GRADIENT = 'from-gray-800 to-gray-800 dark:from-dark-700 dark:to-dark-700'
const GRADIENT_TEXT = 'text-gray-200'
const GRADIENT_SUBTEXT = 'text-gray-300'

export function platformBadgeClass(_p: string): string {
  return BADGE
}

export function platformBadgeLightClass(_p: string): string {
  return BADGE_LIGHT
}

export function platformBorderClass(_p: string): string {
  return BORDER
}

export function platformBorderStrongClass(_p: string): string {
  return BORDER_STRONG
}

export function platformAccentColor(_p: string): string {
  return ACCENT
}

export function platformAccentBarClass(_p: string): string {
  return ACCENT_BAR
}

export function platformTextClass(_p: string): string {
  return TEXT
}

export function platformIconClass(_p: string): string {
  return ICON
}

export function platformButtonClass(_p: string): string {
  return BUTTON
}

export function platformDiscountClass(_p: string): string {
  return BADGE_LIGHT
}

export function platformGradientClass(_p: string): string {
  return GRADIENT
}

export function platformGradientTextClass(_p: string): string {
  return GRADIENT_TEXT
}

export function platformGradientSubtextClass(_p: string): string {
  return GRADIENT_SUBTEXT
}

/** 平台展示名：来自平台清单（后端 domain/platforms.go），新登记的平台同样适用。 */
export function platformLabel(p: string): string {
  if (p === 'composite') return 'Composite'
  return getPlatformSpec(p)?.display_name ?? (p || 'API')
}
