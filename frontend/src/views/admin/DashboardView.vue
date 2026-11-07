<template>
  <AppLayout>
    <div class="workspace-overview">
      <header class="overview-heading">
        <div><h1>{{ t('admin.dashboard.workspaceTitle') }}</h1><p>{{ t('admin.dashboard.analytics.scope') }}</p></div>
        <div class="overview-filters">
          <DateRangePicker v-model:start-date="startDate" v-model:end-date="endDate" :exclude-presets="['last24Hours']" @change="onDateRangeChange" />
          <button type="button" class="btn btn-secondary overview-refresh" :disabled="chartsLoading" :aria-label="t('common.refresh')" @click="loadDashboardStats"><Icon name="refresh" size="sm" :class="{ 'animate-spin': chartsLoading }" /><span>{{ t('common.refresh') }}</span></button>
        </div>
      </header>

      <div v-if="loading && !stats" class="overview-page-loading" aria-busy="true" :aria-label="t('common.loading')"><div class="skeleton h-20" /><div class="skeleton h-80" /></div>
      <template v-else-if="stats">
        <div v-if="hasAccountTrouble" class="overview-notice" role="status"><Icon name="exclamationTriangle" size="sm" /><span>{{ t('admin.dashboard.analytics.accountNotice') }}</span><RouterLink to="/admin/accounts">{{ t('admin.dashboard.analytics.reviewAccounts') }}<Icon name="arrowRight" size="sm" /></RouterLink></div>
        <div class="overview-context">
          <div><span>{{ t('admin.dashboard.analytics.period') }}</span><b>{{ periodLabel }}</b></div>
          <RouterLink :to="usageRoute" class="overview-text-action">{{ t('admin.dashboard.analytics.viewLogs') }}<Icon name="arrowRight" size="sm" /></RouterLink>
        </div>

        <div class="overview-grid">
          <div class="overview-primary">
            <section class="overview-analytics card" :aria-busy="chartsLoading" :aria-label="t('admin.dashboard.analytics.usageTitle')">
              <div class="overview-metrics" role="tablist" :aria-label="t('admin.dashboard.analytics.metricLabel')">
                <button v-for="metric in metricCards" :id="`metric-${metric.key}`" :key="metric.key" type="button" class="overview-metric" :class="{ selected: selectedMetric === metric.key }" role="tab" :aria-selected="selectedMetric === metric.key" aria-controls="overview-trend" :tabindex="selectedMetric === metric.key ? 0 : -1" @click="selectUsageMetric(metric.key)" @keydown="onMetricKeydown">
                  <span>{{ metric.label }}<Icon name="chart" size="xs" /></span>
                  <strong v-if="hasCurrentSnapshot">{{ metric.value }}</strong><span v-else class="skeleton metric-value-loading" aria-hidden="true" />
                  <small>{{ metric.caption }}</small>
                </button>
              </div>
              <div v-if="snapshotError" class="overview-load-error" role="alert"><Icon name="exclamationCircle" size="sm" /><span>{{ hasCurrentSnapshot ? t('admin.dashboard.analytics.refreshFailed') : t('admin.dashboard.analytics.periodFailed') }}</span><button type="button" @click="loadDashboardStats">{{ t('common.tryAgain') }}</button></div>
              <div class="overview-chart-heading"><div><h2>{{ t('admin.dashboard.analytics.trend') }}</h2><span v-if="lastUsageUpdated && hasCurrentSnapshot">{{ t('admin.dashboard.updatedAt', { time: formatUpdatedTime(lastUsageUpdated) }) }}</span></div><div class="overview-granularity"><Select v-model="granularity" :options="granularityOptions" :aria-label="t('admin.dashboard.granularity')" @change="onGranularityChange" /></div></div>
              <div id="overview-trend" role="tabpanel" :aria-labelledby="`metric-${selectedMetric}`" class="overview-chart-body">
                <UsageOverviewChart v-if="hasCurrentSnapshot || chartsLoading" :trend-data="hasCurrentSnapshot ? trendData : []" :metric="selectedMetric" :loading="chartsLoading && !hasCurrentSnapshot" />
                <div v-else class="overview-report-unavailable"><Icon name="chart" size="lg" /><p>{{ t('admin.dashboard.analytics.periodFailed') }}</p><small>{{ t('admin.dashboard.analytics.periodRetryHint') }}</small></div>
              </div>
              <div class="overview-chart-footer"><span>{{ t('admin.dashboard.analytics.costNote') }}</span><RouterLink :to="usageRoute">{{ t('admin.dashboard.analytics.inspectUsage') }}<Icon name="chevronRight" size="xs" /></RouterLink></div>
            </section>

            <ModelDistributionChart v-if="hasCurrentSnapshot || chartsLoading" :model-stats="hasCurrentSnapshot ? modelStats : []" :metric="selectedMetric" :show-chart="false" :enable-ranking-view="true" :enable-breakdown="false" :model-usage-links="true" :ranking-items="rankingItems" :ranking-total-actual-cost="rankingTotalActualCost" :ranking-total-requests="rankingTotalRequests" :ranking-total-tokens="rankingTotalTokens" :loading="chartsLoading && !hasCurrentSnapshot" :ranking-loading="rankingLoading" :ranking-error="rankingError" :start-date="startDate" :end-date="endDate" @ranking-click="goToUserUsage" />
          </div>

          <aside class="overview-aside" :class="{ 'overview-aside-attention': hasAccountTrouble }">
            <details class="overview-account-panel card" :open="!compactViewport || hasAccountTrouble">
              <summary><div><h2>{{ t('admin.dashboard.analytics.accountHealth') }}</h2><span>{{ t('admin.dashboard.analytics.accountsCount', { count: accountTotal ?? stats.total_accounts }) }}</span></div><Icon name="chevronDown" size="sm" /></summary>
              <div class="overview-account-content">
                <div v-if="accountsLoading" class="overview-account-loading" aria-busy="true"><div v-for="i in 2" :key="i" class="skeleton h-10" /></div>
                <div v-else-if="accountsError" class="overview-account-empty"><p>{{ t('admin.dashboard.accountsFailed') }}</p><button type="button" class="btn btn-secondary btn-sm" @click="loadAccounts">{{ t('common.tryAgain') }}</button></div>
                <div v-else-if="!accounts.length" class="overview-account-empty"><p>{{ t('admin.dashboard.noAccounts') }}</p><small>{{ t('admin.dashboard.noAccountsHint') }}</small></div>
                <RouterLink v-for="account in prioritizedAccounts" :key="account.id" :to="{ path: '/admin/accounts', query: { search: account.name } }" class="overview-account-row"><PlatformIcon :platform="account.platform" class="overview-provider-mark" /><span class="overview-account-name"><b :title="account.name">{{ account.name }}</b><small>{{ providerLabel(account.platform) }}</small></span><span class="overview-account-status" :class="{ 'needs-attention': account.status !== 'active' || !account.schedulable }"><i class="health-dot" />{{ account.status === 'active' && account.schedulable ? t('common.active') : t('admin.dashboard.accountNeedsAttention') }}</span></RouterLink>
                <p v-if="(accountTotal ?? stats.total_accounts) > accounts.length && !accountsLoading && !accountsError" class="overview-subset-note">{{ t('admin.dashboard.analytics.accountSubset', { count: accounts.length, total: accountTotal ?? stats.total_accounts }) }}</p>
                <RouterLink to="/admin/accounts" class="overview-panel-link">{{ t('admin.dashboard.manageAccounts') }}<Icon name="arrowRight" size="sm" /></RouterLink>
              </div>
            </details>

            <details class="overview-operations card" :open="!compactViewport">
              <summary><h2>{{ t('admin.dashboard.analytics.operations') }}</h2><Icon name="chevronDown" size="sm" /></summary>
              <div class="overview-operations-content"><p class="overview-operations-scope">{{ t('admin.dashboard.analytics.serverScope') }}</p><dl><div><dt>{{ t('admin.dashboard.avgResponse') }}</dt><dd>{{ formatDuration(stats.average_duration_ms) }}</dd></div><div><dt>{{ t('admin.dashboard.analytics.recentRpm') }}</dt><dd>{{ formatNumber(stats.rpm) }}<small> RPM</small></dd></div><div><dt>{{ t('admin.dashboard.analytics.recentTpm') }}</dt><dd>{{ formatNumber(stats.tpm) }}<small> TPM</small></dd></div></dl><div class="overview-key-stat"><span>{{ t('admin.dashboard.analytics.activeKeys') }}</span><b>{{ stats.active_api_keys }}</b></div><p v-if="stats.stats_updated_at" class="overview-snapshot-time">{{ t('admin.dashboard.analytics.serverSnapshot') }} · {{ formatUpdatedTime(stats.stats_updated_at) }}<span v-if="stats.stats_stale"> · {{ t('admin.dashboard.analytics.stale') }}</span></p></div>
            </details>

            <details class="overview-totals card"><summary><h2>{{ t('admin.dashboard.totals') }}</h2><Icon name="chevronDown" size="sm" /></summary><div class="overview-operations-content"><dl><div><dt>{{ t('admin.dashboard.totalRequests') }}</dt><dd>{{ formatNumber(stats.total_requests) }}</dd></div><div><dt>{{ t('admin.dashboard.totalTokens') }}</dt><dd>{{ formatTokens(stats.total_tokens) }}</dd></div><div><dt>{{ t('admin.dashboard.totalCost') }}</dt><dd>${{ formatCost(stats.total_actual_cost) }}</dd></div></dl><p v-if="stats.stats_updated_at" class="overview-snapshot-time">{{ t('admin.dashboard.analytics.serverSnapshot') }} · {{ formatUpdatedTime(stats.stats_updated_at) }}</p></div></details>
            <RouterLink v-if="canUseBatchImage" class="overview-panel-link overview-batch-link" to="/batch-images">{{ t('nav.batchImage') }}<Icon name="arrowRight" size="sm" /></RouterLink>
          </aside>
        </div>

        <details v-if="hasCurrentSnapshot" class="card overview-token-details"><summary><div><h2>{{ t('admin.dashboard.analytics.tokenAnalysis') }}</h2><span>{{ t('admin.dashboard.analytics.tokenAnalysisHint') }}</span></div><Icon name="chevronDown" size="sm" /></summary><TokenUsageTrend :trend-data="trendData" /></details>

        <details class="card overview-users"><summary><div><h2>{{ t('admin.dashboard.analytics.userAnalysis') }}</h2><span>{{ t('admin.dashboard.analytics.userAnalysisHint') }}</span></div><Icon name="chevronDown" size="sm" /></summary><div class="overview-users-content"><div class="overview-user-controls" role="group" :aria-label="t('admin.dashboard.recentUsage')"><button v-for="metric in (['tokens', 'actual_cost'] as const)" :key="metric" type="button" class="overview-segment" :class="{ selected: userTrendMetric === metric }" :aria-pressed="userTrendMetric === metric" @click="setUserTrendMetric(metric)">{{ t(metric === 'tokens' ? 'admin.dashboard.tokens' : 'admin.dashboard.actualSpending') }}</button></div><div class="h-56"><div v-if="userTrendLoading" class="skeleton h-full" /><div v-else-if="userTrendError" class="overview-user-error" role="alert"><p>{{ t('admin.dashboard.analytics.userAnalysisFailed') }}</p><button type="button" class="btn btn-secondary btn-sm" @click="loadUsersTrend">{{ t('common.tryAgain') }}</button></div><Line v-else-if="userTrendChartData" :data="userTrendChartData" :options="lineOptions" role="img" :aria-label="t('admin.dashboard.userUsageTrend')" /><div v-else class="overview-chart-empty">{{ t('admin.dashboard.noDataAvailable') }}</div></div></div></details>
      </template>
      <div v-else class="overview-page-error" role="alert"><Icon name="exclamationCircle" size="lg" /><h2>{{ t('admin.dashboard.failedToLoad') }}</h2><p>{{ t('admin.dashboard.analytics.periodRetryHint') }}</p><button type="button" class="btn btn-secondary" @click="loadDashboardStats">{{ t('common.tryAgain') }}</button></div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { getIntlLocale } from '@/i18n'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute, RouterLink } from 'vue-router'

const { t, locale } = useI18n()
import { adminAPI } from '@/api/admin'
import type {
  DashboardStats,
  AccountListItem,
  TrendDataPoint,
  ModelStat,
  UserUsageTrendPoint,
  UserSpendingRankingItem
} from '@/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import Icon from '@/components/icons/Icon.vue'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import Select from '@/components/common/Select.vue'
import ModelDistributionChart from '@/components/charts/ModelDistributionChart.vue'
import UsageOverviewChart from '@/components/charts/UsageOverviewChart.vue'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

const router = useRouter()
const route = useRoute()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()
const stats = ref<DashboardStats | null>(null)
const accounts = ref<AccountListItem[]>([])
const accountTotal = ref<number | null>(null)
const accountsLoading = ref(false)
const accountsError = ref(false)
const loadAccounts = async () => {
  accountsLoading.value = true
  accountsError.value = false
  try {
    const response = await adminAPI.accounts.list(1, 5, { lite: 'true' })
    accounts.value = response.items
    accountTotal.value = response.total ?? response.items.length
  } catch {
    accountsError.value = true
  } finally {
    accountsLoading.value = false
  }
}
const providerLabel = (platform: string): string => ({ openai: 'OpenAI', anthropic: 'Anthropic', gemini: 'Google Gemini', antigravity: 'Antigravity', grok: 'xAI' }[platform] || platform)
const formatUpdatedTime = (value: string): string => new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

const compactViewport = useMediaQuery('(max-width: 1180px)')
const selectedMetric = ref<'actual_cost' | 'requests' | 'tokens'>('actual_cost')
const loadedRange = ref<{ start: string; end: string; granularity: string } | null>(null)
const lastUsageUpdated = ref('')
const snapshotError = ref(false)
const loading = ref(false)
const chartsLoading = ref(false)
const userTrendLoading = ref(false)
const userTrendError = ref(false)
const rankingLoading = ref(false)
const rankingError = ref(false)

// Chart data
const trendData = ref<TrendDataPoint[]>([])
const modelStats = ref<ModelStat[]>([])
// Period totals share the exact model snapshot, rather than mixing cached
// all-time/today counters with the independently selected chart date range.
const selectedTotals = computed(() => modelStats.value.reduce((sum, model) => ({
  requests: sum.requests + model.requests,
  tokens: sum.tokens + model.total_tokens,
  input: sum.input + model.input_tokens,
  output: sum.output + model.output_tokens,
  actualCost: sum.actualCost + model.actual_cost,
  standardCost: sum.standardCost + model.cost
}), { requests: 0, tokens: 0, input: 0, output: 0, actualCost: 0, standardCost: 0 }))

const userTrend = ref<UserUsageTrendPoint[]>([])
const userTrendMetric = ref<'tokens' | 'actual_cost'>('tokens')
const rankingItems = ref<UserSpendingRankingItem[]>([])
const rankingTotalActualCost = ref(0)
const rankingTotalRequests = ref(0)
const rankingTotalTokens = ref(0)
let chartLoadSeq = 0
let usersTrendLoadSeq = 0
let rankingLoadSeq = 0
const rankingLimit = 12

// Helper function to format date in local timezone
const formatLocalDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

type OverviewMetric = 'actual_cost' | 'requests' | 'tokens'
function parseOverviewQuery() {
  const today = formatLocalDate(new Date())
  const validDate = (value: unknown): string | undefined => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
    const date = new Date(value + 'T00:00:00')
    return Number.isFinite(date.getTime()) && formatLocalDate(date) === value ? value : undefined
  }
  const candidateStart = validDate(route.query.start_date) || today
  const candidateEnd = validDate(route.query.end_date) || today
  const validRange = candidateStart <= candidateEnd
  const start = validRange ? candidateStart : today
  const end = validRange ? candidateEnd : today
  const metric: OverviewMetric = route.query.metric === 'requests' || route.query.metric === 'tokens' ? route.query.metric : 'actual_cost'
  const granularity: 'day' | 'hour' = route.query.granularity === 'day' || route.query.granularity === 'hour'
    ? route.query.granularity : (new Date(end).getTime() - new Date(start).getTime() > 86400000 ? 'day' : 'hour')
  return { start, end, metric, granularity }
}
// Calendar-date reports are reflected in the URL so log drilldown/back keeps context.
const initialReport = parseOverviewQuery()
const granularity = ref<'day' | 'hour'>(initialReport.granularity)
const startDate = ref(initialReport.start)
const endDate = ref(initialReport.end)
selectedMetric.value = initialReport.metric
const syncOverviewQuery = () => {
  void router.replace({ path: route.path, query: { ...route.query, start_date: startDate.value, end_date: endDate.value, metric: selectedMetric.value, granularity: granularity.value } })
}
function selectUsageMetric(metric: OverviewMetric) {
  selectedMetric.value = metric
  syncOverviewQuery()
}
function onGranularityChange() {
  syncOverviewQuery()
  void loadChartData()
}
watch(() => [route.query.start_date, route.query.end_date, route.query.metric, route.query.granularity], () => {
  const next = parseOverviewQuery()
  selectedMetric.value = next.metric
  if (startDate.value === next.start && endDate.value === next.end && granularity.value === next.granularity) return
  startDate.value = next.start
  endDate.value = next.end
  granularity.value = next.granularity
  void loadChartData()
})
const hasCurrentSnapshot = computed(() => loadedRange.value?.start === startDate.value && loadedRange.value?.end === endDate.value && loadedRange.value?.granularity === granularity.value)
const periodLabel = computed(() => {
  const formatter = new Intl.DateTimeFormat(getIntlLocale(locale.value), { year: 'numeric', month: 'short', day: 'numeric' })
  const start = formatter.format(new Date(startDate.value + 'T00:00:00'))
  return startDate.value === endDate.value ? start : `${start} – ${formatter.format(new Date(endDate.value + 'T00:00:00'))}`
})
const usageRoute = computed(() => ({ path: '/admin/usage', query: { start_date: startDate.value, end_date: endDate.value } }))
const prioritizedAccounts = computed(() => [...accounts.value].sort((a, b) => Number(b.status !== 'active' || !b.schedulable) - Number(a.status !== 'active' || !a.schedulable)))
const hasAccountTrouble = computed(() => Boolean(stats.value && (stats.value.error_accounts > 0 || stats.value.ratelimit_accounts > 0 || stats.value.overload_accounts > 0)) || accounts.value.some(account => account.status !== 'active' || !account.schedulable))
const metricCards = computed(() => [
  { key: 'actual_cost' as const, label: t('admin.dashboard.analytics.cost'), value: `$${formatCost(selectedTotals.value.actualCost)}`, caption: t('admin.dashboard.analytics.usdCost') },
  { key: 'requests' as const, label: t('admin.dashboard.analytics.requests'), value: formatNumber(selectedTotals.value.requests), caption: t('admin.dashboard.analytics.requestCaption') },
  { key: 'tokens' as const, label: t('admin.dashboard.analytics.tokens'), value: formatTokens(selectedTotals.value.tokens), caption: t('admin.dashboard.analytics.tokenCaption') }
])
function onMetricKeydown(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const index = metricCards.value.findIndex(metric => metric.key === selectedMetric.value)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowLeft' ? -1 : 1) + 3) % 3
  selectUsageMetric(metricCards.value[next]!.key)
  ;(event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
}

// Granularity options for Select component
const granularityOptions = computed(() => [
  { value: 'day', label: t('admin.dashboard.day') },
  { value: 'hour', label: t('admin.dashboard.hour') }
])

// Dark mode detection
const { isDark: isDarkMode, seriesColors, fontFamily: chartFontFamily } = useChartTheme()

// Chart colors
const chartColors = computed(() => ({
  text: isDarkMode.value ? '#a1a2ab' : '#656570',
  grid: isDarkMode.value ? '#292a31' : '#ececf0'
}))

// Line chart options (for user trend chart)
const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index' as const
  },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: chartColors.value.text,
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 15,
        font: {
          family: chartFontFamily, size: 11
        }
      }
    },
    tooltip: {
      backgroundColor: isDarkMode.value ? '#222328' : '#ffffff',
      titleColor: isDarkMode.value ? '#f0f0f2' : '#24252a',
      bodyColor: chartColors.value.text,
      borderColor: chartColors.value.grid, borderWidth: 1, padding: 12, cornerRadius: 6,
      titleFont: { family: chartFontFamily, size: 12 }, bodyFont: { family: chartFontFamily, size: 12 },
      itemSort: (a: any, b: any) => {
        const aValue = typeof a?.raw === 'number' ? a.raw : Number(a?.parsed?.y ?? 0)
        const bValue = typeof b?.raw === 'number' ? b.raw : Number(b?.parsed?.y ?? 0)
        return bValue - aValue
      },
      callbacks: {
        label: (context: any) => {
          return `${context.dataset.label}: ${formatUserTrendValue(Number(context.raw))}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      border: { display: false },
      ticks: {
        maxTicksLimit: 6,
        maxRotation: 0,
        color: chartColors.value.text,
        font: {
          family: chartFontFamily, size: 11
        }
      }
    },
    y: {
      grid: {
        color: chartColors.value.grid, drawTicks: false
      },
      border: { display: false, dash: [3, 4] },
      ticks: {
        maxTicksLimit: 4,
        color: chartColors.value.text,
        font: {
          family: chartFontFamily, size: 11
        },
        callback: (value: string | number) => formatUserTrendValue(Number(value))
      }
    }
  }
}))

// User trend chart data
const userTrendChartData = computed(() => {
  if (!userTrend.value?.length) return null

  const getDisplayName = (point: UserUsageTrendPoint): string => {
    const username = point.username?.trim()
    if (username) {
      return username
    }

    const email = point.email?.trim()
    if (email) {
      return email
    }

    return t('admin.redeem.userPrefix', { id: point.user_id })
  }

  // Group by user_id to avoid merging different users with the same display name
  const userGroups = new Map<number, { name: string; data: Map<string, number> }>()
  const allDates = new Set<string>()

  userTrend.value.forEach((point) => {
    allDates.add(point.date)
    const key = point.user_id
    if (!userGroups.has(key)) {
      userGroups.set(key, { name: getDisplayName(point), data: new Map() })
    }
    userGroups.get(key)!.data.set(point.date, userTrendMetric.value === 'tokens' ? point.tokens : point.actual_cost)
  })

  const sortedDates = Array.from(allDates).sort()
  const colors = seriesColors.value

  const datasets = Array.from(userGroups.values()).map((group, idx) => ({
    label: group.name,
    data: sortedDates.map((date) => group.data.get(date) || 0),
    borderColor: colors[idx % colors.length],
    backgroundColor: `${colors[idx % colors.length]}20`,
    fill: false,
    borderWidth: 2,
    pointRadius: sortedDates.length === 1 ? 4 : 0,
    pointHoverRadius: 4,
    tension: 0.15
  }))

  return {
    labels: sortedDates,
    datasets
  }
})

// Format helpers
const formatUserTrendValue = (value: number): string =>
  userTrendMetric.value === 'tokens' ? formatTokens(value) : `$${formatCost(value)}`

const formatTokens = (value: number | undefined): string => {
  if (value === undefined || value === null) return '0'
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const formatNumber = (value: number | null | undefined): string => {
  return toFiniteNumber(value).toLocaleString()
}

const formatCost = (value: number | null | undefined): string => {
  const safeValue = toFiniteNumber(value)
  if (safeValue >= 1000) {
    return (safeValue / 1000).toFixed(2) + 'K'
  } else if (safeValue >= 1) {
    return safeValue.toFixed(2)
  } else if (safeValue >= 0.01) {
    return safeValue.toFixed(3)
  }
  return safeValue.toFixed(4)
}

const formatDuration = (ms: number): string => {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`
  }
  return `${Math.round(ms)}ms`
}

const goToUserUsage = (item: UserSpendingRankingItem) => {
  void router.push({
    path: '/admin/usage',
    query: {
      user_id: String(item.user_id),
      start_date: startDate.value,
      end_date: endDate.value
    }
  })
}

// Date range change handler
const onDateRangeChange = (range: {
  startDate: string
  endDate: string
  preset: string | null
}) => {
  // Auto-select granularity based on date range
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  // If range is 1 day, use hourly granularity
  if (daysDiff <= 1) {
    granularity.value = 'hour'
  } else {
    granularity.value = 'day'
  }

  syncOverviewQuery()
  loadChartData()
}

// Load data
const loadDashboardSnapshot = async (includeStats: boolean) => {
  const currentSeq = ++chartLoadSeq
  if (includeStats && !stats.value) {
    loading.value = true
  }
  chartsLoading.value = true
  snapshotError.value = false
  const requestedRange = { start: startDate.value, end: endDate.value, granularity: granularity.value }
  try {
    const response = await adminAPI.dashboard.getSnapshotV2({
      start_date: startDate.value,
      end_date: endDate.value,
      granularity: granularity.value,
      include_stats: includeStats,
      include_trend: true,
      include_model_stats: true,
      include_group_stats: false,
      include_users_trend: false
    })
    if (currentSeq !== chartLoadSeq) return
    if (includeStats && response.stats) {
      stats.value = response.stats
    }
    trendData.value = response.trend || []
    modelStats.value = response.models || []
    loadedRange.value = requestedRange
    lastUsageUpdated.value = new Date().toISOString()
  } catch (error) {
    if (currentSeq !== chartLoadSeq) return
    snapshotError.value = true
    console.error('Error loading dashboard snapshot:', error)
  } finally {
    if (currentSeq === chartLoadSeq) {
      loading.value = false
      chartsLoading.value = false
    }
  }
}

const setUserTrendMetric = (metric: 'tokens' | 'actual_cost') => {
  if (userTrendMetric.value === metric) return
  userTrendMetric.value = metric
  userTrend.value = []
  loadUsersTrend()
}

const loadUsersTrend = async () => {
  const currentSeq = ++usersTrendLoadSeq
  userTrendLoading.value = true
  userTrendError.value = false
  try {
    const response = await adminAPI.dashboard.getUserUsageTrend({
      start_date: startDate.value,
      end_date: endDate.value,
      granularity: granularity.value,
      limit: 12,
      metric: userTrendMetric.value
    })
    if (currentSeq !== usersTrendLoadSeq) return
    userTrend.value = response.trend || []
  } catch (error) {
    if (currentSeq !== usersTrendLoadSeq) return
    console.error('Error loading users trend:', error)
    userTrendError.value = true
    userTrend.value = []
  } finally {
    if (currentSeq === usersTrendLoadSeq) {
      userTrendLoading.value = false
    }
  }
}

const loadUserSpendingRanking = async () => {
  const currentSeq = ++rankingLoadSeq
  rankingLoading.value = true
  rankingError.value = false
  try {
    const response = await adminAPI.dashboard.getUserSpendingRanking({
      start_date: startDate.value,
      end_date: endDate.value,
      limit: rankingLimit
    })
    if (currentSeq !== rankingLoadSeq) return
    rankingItems.value = response.ranking || []
    rankingTotalActualCost.value = response.total_actual_cost || 0
    rankingTotalRequests.value = response.total_requests || 0
    rankingTotalTokens.value = response.total_tokens || 0
  } catch (error) {
    if (currentSeq !== rankingLoadSeq) return
    console.error('Error loading user spending ranking:', error)
    rankingItems.value = []
    rankingTotalActualCost.value = 0
    rankingTotalRequests.value = 0
    rankingTotalTokens.value = 0
    rankingError.value = true
  } finally {
    if (currentSeq === rankingLoadSeq) {
      rankingLoading.value = false
    }
  }
}

const loadDashboardStats = async () => {
  await Promise.all([
    loadDashboardSnapshot(true),
    loadUsersTrend(),
    loadUserSpendingRanking(),
    loadAccounts()
  ])
}

const loadChartData = async () => {
  await Promise.all([
    loadDashboardSnapshot(true),
    loadUsersTrend(),
    loadUserSpendingRanking()
  ])
}

onMounted(() => {
  void refreshBatchImageAccess()
  loadDashboardStats()
})
</script>

<style scoped>
.workspace-overview { max-width:1440px; margin:0 auto; color:var(--text-primary); font-size:13px; }
.overview-heading { display:flex; align-items:center; justify-content:space-between; gap:24px; margin-bottom:28px; }
.overview-heading h1 { font-size:24px; line-height:32px; font-weight:600; letter-spacing:-.02em; }
.overview-heading p { margin-top:5px; color:var(--text-muted); font-size:13px; line-height:20px; }
.overview-filters { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.overview-refresh { gap:7px; min-height:32px; padding-inline:10px; font-size:12px; }
.overview-context { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:14px; font-size:12px; }
.overview-context > div { display:flex; gap:12px; align-items:center; color:var(--text-muted); }
.overview-context b { color:var(--text-secondary); font-weight:400; font-variant-numeric:tabular-nums; }
.overview-text-action { display:inline-flex; align-items:center; gap:7px; color:var(--text-secondary); font-size:12px; }
.overview-text-action:hover { color:var(--accent-primary); }
.overview-grid { display:grid; grid-template-columns:minmax(0,1fr) 296px; align-items:start; gap:24px; }
.overview-primary,.overview-aside { display:flex; flex-direction:column; gap:24px; min-width:0; }
.overview-analytics { overflow:hidden; }
.overview-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-bottom:1px solid var(--border-default); }
.overview-metric { position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:9px; min-width:0; padding:20px 24px 18px; text-align:left; transition:background .15s; border-right:1px solid var(--border-default); }
.overview-metric:last-child { border-right:0; }
.overview-metric:hover { background:var(--surface-hover); }
.overview-metric.selected { background:var(--surface-canvas); }
.overview-metric.selected::after { content:''; position:absolute; height:2px; left:24px; right:24px; bottom:0; background:var(--accent-primary); }
.overview-metric > span:first-child { display:flex; width:100%; justify-content:space-between; align-items:center; gap:8px; color:var(--text-secondary); font-size:13px; line-height:20px; }
.overview-metric > span > svg { opacity:0; color:var(--accent-primary); }
.overview-metric.selected > span > svg { opacity:1; }
.overview-metric strong { font-size:30px; line-height:36px; font-weight:550; letter-spacing:-.025em; font-variant-numeric:tabular-nums; }
.overview-metric small { color:var(--text-muted); font-size:11px; line-height:18px; white-space:nowrap; }
.metric-value-loading { width:72px; height:36px; }
.overview-chart-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:20px 24px 8px; }
.overview-chart-heading > div:first-child { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
.overview-chart-heading h2 { font-size:13px; font-weight:500; }
.overview-chart-heading span { font-size:11px; color:var(--text-muted); }
.overview-granularity { width:82px; }
.overview-chart-body { padding:4px 20px 0; min-height:265px; }
.overview-chart-footer { display:flex; justify-content:space-between; gap:16px; align-items:center; border-top:1px solid var(--border-default); padding:12px 24px; margin-top:10px; color:var(--text-muted); font-size:11px; line-height:18px; }
.overview-chart-footer a { display:flex; gap:4px; align-items:center; color:var(--text-secondary); white-space:nowrap; }
.overview-chart-footer a:hover { color:var(--accent-primary); }
.overview-notice { display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:20px; border:1px solid #b58b42; background:var(--surface-panel); border-radius:6px; padding:12px 14px; color:var(--text-primary); font-size:13px; }
.overview-notice > svg { color:#b58b42; flex-shrink:0; }
.overview-notice a { margin-left:auto; display:flex; align-items:center; gap:6px; text-decoration:underline; text-underline-offset:3px; }
.overview-load-error { display:flex; align-items:flex-start; flex-wrap:wrap; gap:8px; padding:12px 24px; font-size:12px; border-bottom:1px solid var(--border-default); color:var(--text-secondary); }
.overview-load-error svg { color:#c06c59; flex-shrink:0; margin-top:2px; }
.overview-load-error button { margin-left:auto; color:var(--accent-primary); text-decoration:underline; text-underline-offset:3px; }
.overview-report-unavailable { min-height:240px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; color:var(--text-muted); text-align:center; }
.overview-report-unavailable p { color:var(--text-primary); font-size:13px; }
.overview-report-unavailable small { max-width:300px; font-size:12px; line-height:1.6; }
.overview-aside details > summary,.overview-users > summary,.overview-token-details > summary { display:flex; justify-content:space-between; gap:12px; align-items:center; min-height:56px; padding:16px; list-style:none; cursor:pointer; }
.overview-aside details > summary::-webkit-details-marker,.overview-users > summary::-webkit-details-marker,.overview-token-details > summary::-webkit-details-marker { display:none; }
.overview-aside details > summary h2,.overview-users > summary h2,.overview-token-details > summary h2 { font-size:13px; line-height:20px; font-weight:550; }
.overview-aside details > summary > div { display:flex; align-items:center; gap:10px; }
.overview-aside details > summary span { color:var(--text-muted); font-size:11px; }
.overview-aside details > summary > svg,.overview-users > summary > svg,.overview-token-details > summary > svg { color:var(--text-muted); transition:transform .15s; flex-shrink:0; }
.overview-aside details[open] > summary > svg,.overview-users[open] > summary > svg,.overview-token-details[open] > summary > svg { transform:rotate(180deg); }
.overview-account-row { display:flex; align-items:center; gap:10px; padding:14px 16px; border-top:1px solid var(--border-default); }
.overview-account-row:hover { background:var(--surface-hover); }
.overview-provider-mark { width:20px; height:20px; flex-shrink:0; color:var(--text-secondary); }
.overview-account-name { display:flex; flex-direction:column; gap:4px; flex:1; min-width:0; }
.overview-account-name b { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; font-weight:500; }
.overview-account-name small { color:var(--text-muted); font-size:12px; }
.overview-account-status { display:flex; align-items:center; gap:5px; color:var(--text-secondary); font-size:12px; flex-shrink:0; }
.health-dot { width:5px; height:5px; border-radius:50%; background:#559f87; flex-shrink:0; }
.needs-attention { color:var(--text-primary); }
.needs-attention .health-dot { background:#c49b54; }
.overview-account-loading { padding:16px; display:grid; gap:12px; }
.overview-account-empty { padding:16px; display:flex; align-items:flex-start; flex-direction:column; gap:10px; font-size:12px; color:var(--text-secondary); }
.overview-account-empty small { font-size:12px; line-height:1.6; }
.overview-panel-link { display:flex; justify-content:space-between; align-items:center; padding:13px 16px; border-top:1px solid var(--border-default); color:var(--text-secondary); font-size:12px; }
.overview-panel-link:hover { color:var(--accent-primary); }
.overview-subset-note { padding:12px 16px; color:var(--text-muted); font-size:11px; border-top:1px solid var(--border-default); }
.overview-operations-scope { font-size:11px; line-height:1.6; color:var(--text-muted); margin-bottom:10px; }
.overview-user-error { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; height:100%; color:var(--text-secondary); font-size:13px; }
.overview-operations-content { padding:0 16px 16px; }
.overview-operations-content dl > div { display:flex; justify-content:space-between; gap:16px; align-items:center; padding:9px 0; font-size:12px; }
.overview-operations-content dt { color:var(--text-secondary); }
.overview-operations-content dd { font-variant-numeric:tabular-nums; font-weight:500; }
.overview-operations-content dd small { color:var(--text-muted); font-weight:400; font-size:10px; }
.overview-key-stat { display:flex; align-items:center; gap:8px; border-top:1px solid var(--border-default); margin-top:8px; padding-top:14px; font-size:12px; color:var(--text-secondary); }
.overview-key-stat b { margin-left:auto; color:var(--text-primary); font-weight:500; }
.overview-snapshot-time { margin-top:16px; font-size:11px; color:var(--text-muted); line-height:1.6; }
.overview-snapshot-time span { color:var(--text-secondary); }
.overview-batch-link { border:1px solid var(--border-default); border-radius:6px; }
.overview-users,.overview-token-details { margin-top:24px; }
.overview-token-details :deep(.token-trend-panel) { border:0; background:transparent; box-shadow:none; }
.overview-users > summary,.overview-token-details > summary { padding:16px 20px; }
.overview-users > summary > div,.overview-token-details > summary > div { display:flex; align-items:baseline; flex-wrap:wrap; gap:12px; }
.overview-users > summary span,.overview-token-details > summary span { color:var(--text-muted); font-size:12px; }
.overview-users-content { padding:8px 20px 20px; }
.overview-user-controls { display:flex; justify-content:flex-end; gap:4px; margin-bottom:16px; }
.overview-segment { border-radius:5px; padding:6px 10px; color:var(--text-secondary); font-size:12px; }
.overview-segment.selected { color:var(--text-primary); background:var(--surface-hover); }
.overview-chart-empty { display:grid; place-items:center; height:100%; color:var(--text-muted); }
.overview-page-loading { display:grid; gap:24px; }
.overview-page-error { display:flex; align-items:center; flex-direction:column; gap:16px; padding:80px 24px; text-align:center; color:var(--text-secondary); }
.overview-page-error h2 { font-size:16px; color:var(--text-primary); font-weight:550; }
.overview-page-error p { max-width:400px; line-height:1.7; }
@media(max-width:1180px) { .overview-grid { display:flex; flex-direction:column; gap:16px; } .overview-aside { order:1; display:grid; grid-template-columns:1fr 1fr; gap:12px; width:100%; align-items:start; } .overview-primary { width:100%; gap:20px; } .overview-aside-attention { order:-1; } .overview-aside details > summary { min-height:52px; } .overview-heading { margin-bottom:22px; } }
@media(max-width:640px) { .overview-heading { align-items:flex-start; gap:18px; flex-direction:column; margin-bottom:22px; } .overview-heading h1 { font-size:22px; line-height:30px; } .overview-filters { width:100%; } .overview-filters > :first-child { flex:1; } .overview-refresh { height:36px; } .overview-context { align-items:flex-start; font-size:11px; } .overview-context > div { gap:5px; flex-direction:column; align-items:flex-start; } .overview-text-action { font-size:12px; padding-top:4px; } .overview-metric { padding:16px 12px; gap:6px; } .overview-metric > span:first-child { font-size:12px; } .overview-metric > span > svg { display:none; } .overview-metric strong { font-size:22px; line-height:28px; } .overview-metric small { font-size:10px; line-height:16px; white-space:normal; text-wrap:balance; } .overview-metric.selected::after { left:12px; right:12px; } .overview-chart-heading { padding:16px 16px 8px; } .overview-chart-heading > div:first-child { gap:5px; flex-direction:column; } .overview-chart-body { padding:0 12px; min-height:240px; } .overview-chart-footer { padding:12px 16px; flex-direction:column; align-items:flex-start; gap:8px; } .overview-aside { grid-template-columns:1fr; gap:10px; } .overview-account-row { padding:12px 16px; } .overview-notice { font-size:12px; } .overview-notice a { margin-left:25px; } .overview-users > summary,.overview-token-details > summary { padding:16px; } .overview-users > summary span,.overview-token-details > summary span { font-size:11px; } .overview-users-content { padding-inline:16px; } }
@media(prefers-reduced-motion:reduce) { .overview-metric,.overview-aside details > summary > svg,.overview-users > summary,.overview-token-details > summary > svg { transition:none; } }
</style>
