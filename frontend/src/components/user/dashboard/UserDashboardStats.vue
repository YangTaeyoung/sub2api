<template>
  <MetricStrip :items="metricItems">
    <template #detail-todayCost>
      <span class="metric-part" :title="t('dashboard.standard')">{{ t('dashboard.standard') }} <b>${{ formatCost(stats?.today_cost || 0) }}</b></span>
      <span class="metric-part">{{ t('common.total') }} <b :title="t('dashboard.actual')">${{ formatCost(stats?.total_actual_cost || 0) }}</b></span>
      <span class="metric-part" :title="t('dashboard.standard')">/ ${{ formatCost(stats?.total_cost || 0) }}</span>
    </template>
    <template #detail-todayTokens>
      <span class="metric-part">{{ t('dashboard.input') }} <b>{{ formatTokens(stats?.today_input_tokens || 0) }}</b></span>
      <span class="metric-part">{{ t('dashboard.output') }} <b>{{ formatTokens(stats?.today_output_tokens || 0) }}</b></span>
      <span class="metric-part">{{ t('dashboard.cache') }} <b>{{ formatTokens((stats?.today_cache_creation_tokens || 0) + (stats?.today_cache_read_tokens || 0)) }}</b></span>
    </template>
    <template #detail-totalTokens>
      <span class="metric-part">{{ t('dashboard.input') }} <b>{{ formatTokens(stats?.total_input_tokens || 0) }}</b></span>
      <span class="metric-part">{{ t('dashboard.output') }} <b>{{ formatTokens(stats?.total_output_tokens || 0) }}</b></span>
      <span class="metric-part">{{ t('dashboard.cache') }} <b>{{ formatTokens((stats?.total_cache_creation_tokens || 0) + (stats?.total_cache_read_tokens || 0)) }}</b></span>
    </template>
    <template #detail-performance>
      <span class="metric-part"><b>{{ formatTokens(stats?.tpm || 0) }}</b> TPM</span>
    </template>
  </MetricStrip>

  <section v-if="!isSimple && platformCards.length > 0" class="card platform-panel">
    <header class="platform-header">
      <h3>{{ t('dashboard.platformBreakdown') }}</h3>
      <span>{{ t('dashboard.platformCount', { count: platformCount }) }}</span>
    </header>
    <div class="platform-grid">
      <div
        v-for="item in platformCards"
        :key="item.platform"
        data-testid="platform-card"
        :data-platform="item.platform"
        class="platform-item"
      >
        <div class="platform-title">
          <span>{{ item.isOther ? t('dashboard.platformOther') : platformLabel(item.platform) }}</span>
          <b :title="t('dashboard.actual')">${{ formatCost(item.total_actual_cost) }}</b>
        </div>
        <dl class="platform-facts">
          <div>
            <dt>{{ t('dashboard.todayCost') }}</dt>
            <dd>${{ formatCost(item.today_actual_cost) }}</dd>
          </div>
          <div>
            <dt>{{ t('dashboard.requests') }}</dt>
            <dd>{{ item.total_requests > 0 ? formatNumber(item.total_requests) : '-' }}</dd>
          </div>
          <div>
            <dt>{{ t('dashboard.tokens') }}</dt>
            <dd>{{ item.total_tokens > 0 ? formatTokens(item.total_tokens) : '-' }}</dd>
          </div>
        </dl>

        <div v-if="hasAnyLimit(item.quota) && !item.isOther" class="platform-quota">
          <p class="platform-quota-title">{{ t('dashboard.platformQuota.title') }}</p>
          <template v-for="w in (['daily', 'weekly', 'monthly'] as const)" :key="w">
            <div v-if="quotaVal(item.quota, `${w}_limit_usd`) != null" class="platform-quota-window">
              <template v-if="(quotaVal(item.quota, `${w}_limit_usd`) as number) === 0">
                <div class="platform-quota-line">
                  <span>{{ t(`dashboard.platformQuota.${w}`) }}</span>
                  <span class="text-red-600 dark:text-red-400">{{ t('dashboard.platformQuota.disabled') }}</span>
                </div>
                <div class="quota-track">
                  <div class="quota-fill quota-fill-blocked" style="width: 100%" />
                </div>
              </template>
              <template v-else>
                <div class="platform-quota-line">
                  <span>{{ t(`dashboard.platformQuota.${w}`) }}</span>
                  <span class="quota-amount">
                    ${{ formatUsd((quotaVal(item.quota, `${w}_usage_usd`) as number) ?? 0) }} / ${{ formatUsd(quotaVal(item.quota, `${w}_limit_usd`) as number) }}
                  </span>
                </div>
                <div class="quota-track">
                  <div
                    class="quota-fill"
                    :class="quotaBarClass(calcPercent((quotaVal(item.quota, `${w}_usage_usd`) as number) ?? 0, quotaVal(item.quota, `${w}_limit_usd`) as number))"
                    :style="{ width: calcPercent((quotaVal(item.quota, `${w}_usage_usd`) as number) ?? 0, quotaVal(item.quota, `${w}_limit_usd`) as number) + '%' }"
                  />
                </div>
                <p v-if="quotaVal(item.quota, `${w}_window_resets_at`)" class="platform-quota-reset">
                  {{ t('dashboard.platformQuota.resetsAt', { time: formatResetTime(quotaVal(item.quota, `${w}_window_resets_at`) as string) }) }}
                </p>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIntlLocale } from '@/i18n'
import MetricStrip, { type MetricStripItem } from '@/components/charts/MetricStrip.vue'
import type { PlatformDashboardStats, UserDashboardStats as UserStatsType } from '@/api/usage'
import type { PlatformQuotaItem } from '@/types'

interface FusedPlatformCard {
  platform: string
  total_actual_cost: number
  today_actual_cost: number
  total_requests: number
  total_tokens: number
  isOther?: boolean
  quota?: PlatformQuotaItem
}

const props = defineProps<{
  stats: UserStatsType
  balance: number
  isSimple: boolean
  platformQuotas?: PlatformQuotaItem[] | null
}>()
const { t } = useI18n()

const PLATFORM_LABELS: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'OpenAI',
  gemini: 'Gemini',
  antigravity: 'Antigravity',
  grok: 'Grok',
  kimi: 'Kimi',
  zhipu: 'Zhipu GLM',
  deepseek: 'DeepSeek',
  minimax: 'MiniMax',
  typesafe: 'TypeSafe / Jev',
}

const platformLabel = (p: string) => PLATFORM_LABELS[p] ?? p

// 处理"各平台之和 < 总值"的差值：后端按平台聚合时过滤了无法归属平台的行
// （group 与 account 都缺 platform）。这里把差值作为"其他"卡片显式展示，
// 避免 Row 1 总值与 Row 3 平台拆分加总对不上、用户困惑。
const OTHER_THRESHOLD = 0.0001
const platformCards = computed<FusedPlatformCard[]>(() => {
  // 建立 by_platform Map
  const byPlat = new Map<string, PlatformDashboardStats>()
  for (const item of props.stats?.by_platform ?? []) byPlat.set(item.platform, item)

  // 建立 quota Map。三档全空的记录不产生卡片，挂到卡片上也不渲染配额区。
  const byQuota = new Map<string, PlatformQuotaItem>()
  for (const q of props.platformQuotas ?? []) byQuota.set(q.platform, q)

  // 卡片集合 = 有用量的平台 ∪ 至少配置了一档限额的平台。
  // 三档全空的限额记录等价于不限额，不单独产生卡片。
  // 后端 by_platform / quota 接口均不会返回 platform='__other__'，
  // 无需显式排除；__other__ 由下方差值补差逻辑单独追加。
  const platforms = new Set<string>(byPlat.keys())
  for (const [platform, q] of byQuota) {
    if (hasAnyLimit(q)) platforms.add(platform)
  }

  const PLATFORM_ORDER = ['anthropic', 'openai', 'gemini', 'antigravity', 'grok', 'typesafe']
  const cards: FusedPlatformCard[] = []

  for (const p of platforms) {
    const stat = byPlat.get(p)
    cards.push({
      platform: p,
      total_actual_cost: stat?.total_actual_cost ?? 0,
      today_actual_cost: stat?.today_actual_cost ?? 0,
      total_requests: stat?.total_requests ?? 0,
      total_tokens: stat?.total_tokens ?? 0,
      quota: byQuota.get(p),
    })
  }

  // 排序：按 PLATFORM_ORDER，未知平台按名称排序
  cards.sort((a, b) => {
    const ai = PLATFORM_ORDER.indexOf(a.platform)
    const bi = PLATFORM_ORDER.indexOf(b.platform)
    if (ai === -1 && bi === -1) return a.platform.localeCompare(b.platform)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  // __other__ 补差逻辑：只对 by_platform 有 usage 数据的总和计算
  const total = props.stats?.total_actual_cost ?? 0
  const today = props.stats?.today_actual_cost ?? 0
  const sumTotal = cards.reduce((s, c) => s + c.total_actual_cost, 0)
  const sumToday = cards.reduce((s, c) => s + c.today_actual_cost, 0)
  const diffTotal = Math.max(0, total - sumTotal)
  const diffToday = Math.max(0, today - sumToday)

  if (diffTotal > OTHER_THRESHOLD || diffToday > OTHER_THRESHOLD) {
    cards.push({
      platform: '__other__',
      total_actual_cost: diffTotal,
      today_actual_cost: diffToday,
      total_requests: 0,
      total_tokens: 0,
      isOther: true,
    })
  }

  return cards
})

// 标题右侧的平台计数 = 实际渲染的平台卡片数，不含"其他"差额卡。
const platformCount = computed(() => platformCards.value.filter((c) => !c.isOther).length)

// Quota helpers

type QuotaWindow = 'daily' | 'weekly' | 'monthly'
type QuotaField = `${QuotaWindow}_limit_usd` | `${QuotaWindow}_usage_usd` | `${QuotaWindow}_window_resets_at`

function quotaVal(q: PlatformQuotaItem | undefined, key: QuotaField): PlatformQuotaItem[QuotaField] {
  return q?.[key]
}

function hasAnyLimit(q: PlatformQuotaItem | undefined): boolean {
  if (!q) return false
  return q.daily_limit_usd != null || q.weekly_limit_usd != null || q.monthly_limit_usd != null
}

function calcPercent(usage: number, limit: number): number {
  if (!limit || limit <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((usage / limit) * 100)))
}

function quotaBarClass(p: number): string {
  if (p >= 95) return 'quota-fill-blocked'
  if (p >= 75) return 'quota-fill-warning'
  return ''
}

// 与 formatBalance 一致使用 Intl.NumberFormat 做半偶舍入，避免 toFixed 在不同 JS 引擎
// 下偶发截断而非四舍五入（与后端展示精度不一致）。
const usdFormatter = computed(() => new Intl.NumberFormat(getIntlLocale(), {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}))
function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '0.00'
  return usdFormatter.value.format(n)
}

function formatResetTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(getIntlLocale(), {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const formatBalance = (b: number) =>
  new Intl.NumberFormat(getIntlLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(b)

const formatNumber = (n: number) => n.toLocaleString(getIntlLocale())
const formatCost = (c: number) => c.toFixed(4)
const formatTokens = (t: number) => {
  if (t >= 1_000_000) return `${(t / 1_000_000).toFixed(1)}M`
  if (t >= 1000) return `${(t / 1000).toFixed(1)}K`
  return t.toString()
}
const formatDuration = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(0)}ms`

const metricItems = computed<MetricStripItem[]>(() => {
  const stats = props.stats
  const items: MetricStripItem[] = [
    { key: 'apiKeys', label: t('dashboard.apiKeys'), value: String(stats?.total_api_keys || 0), detail: `${stats?.active_api_keys || 0} ${t('common.active')}` },
    { key: 'todayRequests', label: t('dashboard.todayRequests'), value: formatNumber(stats?.today_requests || 0), detail: `${t('common.total')} ${formatNumber(stats?.total_requests || 0)}` },
    { key: 'todayCost', label: t('dashboard.todayCost'), value: `$${formatCost(stats?.today_actual_cost || 0)}` },
    { key: 'todayTokens', label: t('dashboard.todayTokens'), value: formatTokens(stats?.today_tokens || 0) },
    { key: 'totalTokens', label: t('dashboard.totalTokens'), value: formatTokens(stats?.total_tokens || 0) },
    { key: 'performance', label: t('dashboard.performance'), value: formatTokens(stats?.rpm || 0), unit: 'RPM' },
    { key: 'avgResponse', label: t('dashboard.avgResponse'), value: formatDuration(stats?.average_duration_ms || 0) },
  ]
  if (!props.isSimple) {
    items.unshift({ key: 'balance', label: t('dashboard.balance'), value: `$${formatBalance(props.balance)}`, detail: t('common.available') })
  }
  return items
})
</script>

<style scoped>
.platform-panel { padding:16px; color:var(--text-primary); }
.platform-header { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:4px; }
.platform-header h3 { font-size:13px; line-height:20px; font-weight:600; }
.platform-header span { color:var(--text-muted); font-size:12px; }
.platform-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:0 32px; }
.platform-item { margin-top:8px; padding:12px 0; border-top:1px solid var(--border-default); font-variant-numeric:tabular-nums; }
.platform-title { display:flex; align-items:baseline; justify-content:space-between; gap:12px; font-size:13px; line-height:20px; font-weight:550; }
.platform-facts { margin-top:6px; font-size:12px; line-height:18px; }
.platform-facts > div { display:flex; justify-content:space-between; gap:12px; padding:2px 0; }
.platform-facts dt { color:var(--text-muted); }
.platform-facts dd { color:var(--text-secondary); }
.platform-quota { display:grid; gap:8px; margin-top:10px; }
.platform-quota-title { color:var(--text-muted); font-size:11px; line-height:16px; }
.platform-quota-window { display:grid; gap:4px; }
.platform-quota-line { display:flex; justify-content:space-between; gap:12px; color:var(--text-secondary); font-size:12px; line-height:18px; }
.quota-track { height:4px; overflow:hidden; border-radius:999px; background:var(--surface-hover); }
.quota-fill { height:100%; border-radius:inherit; background:var(--accent-primary); transition:width .2s; }
.quota-fill-warning { background:#c49b54; }
.quota-fill-blocked { background:#c2413b; }
.platform-quota-reset { color:var(--text-muted); font-size:11px; line-height:16px; }
@media(prefers-reduced-motion:reduce) { .quota-fill { transition:none; } }
</style>
