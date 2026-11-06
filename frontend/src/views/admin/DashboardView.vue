<template>
  <AppLayout>
    <div class="workspace-overview">
      <header class="overview-heading">
        <div>
          <h1>{{ t('admin.dashboard.workspaceTitle') }}</h1>
          <p>{{ t('admin.dashboard.workspaceDescription') }}</p>
        </div>
        <div class="overview-filters">
          <DateRangePicker v-model:start-date="startDate" v-model:end-date="endDate" @change="onDateRangeChange" />
          <button type="button" class="btn btn-secondary overview-refresh" :disabled="chartsLoading" :aria-label="t('common.refresh')" @click="loadDashboardStats">
            <Icon name="refresh" size="sm" :class="{ 'animate-spin': chartsLoading }" />
          </button>
        </div>
      </header>

      <div v-if="loading && !stats" class="overview-skeleton" aria-busy="true" :aria-label="t('common.loading')">
        <div v-for="i in 4" :key="i" class="skeleton h-20" />
      </div>
      <template v-else-if="stats">
        <section class="overview-metrics" :aria-label="t('admin.dashboard.performance')">
          <div class="overview-metric"><span>{{ t('admin.dashboard.requests') }}</span><strong>{{ formatNumber(selectedTotals.requests) }}</strong><small :title="`${startDate} – ${endDate}`">{{ t('admin.dashboard.timeRange') }} · {{ startDate.slice(5).replace('-', '.') }}<template v-if="startDate !== endDate"> – {{ endDate.slice(5).replace('-', '.') }}</template></small></div>
          <div class="overview-metric"><span>{{ t('admin.dashboard.tokens') }}</span><strong>{{ formatTokens(selectedTotals.tokens) }}</strong><small>{{ t('admin.dashboard.input') }} {{ formatTokens(selectedTotals.input) }} · {{ t('admin.dashboard.output') }} {{ formatTokens(selectedTotals.output) }}</small></div>
          <div class="overview-metric"><span>{{ t('usage.cost') }}</span><strong><span class="metric-currency">$</span>{{ formatCost(selectedTotals.actualCost) }}</strong><small>{{ t('admin.dashboard.standard') }} ${{ formatCost(selectedTotals.standardCost) }}</small></div>
          <div class="overview-metric"><span>{{ t('admin.dashboard.avgResponse') }}</span><strong>{{ formatDuration(stats.average_duration_ms) }}</strong><small>{{ t('dates.today') }} · {{ formatNumber(stats.rpm) }} RPM <span aria-hidden="true">·</span> {{ formatNumber(stats.tpm) }} TPM</small></div>
        </section>

        <div class="overview-health">
          <span><i class="health-dot" :class="{ 'health-dot-warning': stats.normal_accounts < stats.total_accounts }" />{{ t('admin.dashboard.readyAccounts') }} <b>{{ stats.normal_accounts }}/{{ stats.total_accounts }}</b></span>
          <span>{{ t('admin.dashboard.activeKeys') }} <b>{{ stats.active_api_keys }}</b></span>
          <span v-if="stats.stats_updated_at" class="overview-updated">{{ t('admin.dashboard.updatedAt', { time: formatUpdatedTime(stats.stats_updated_at) }) }}</span>
        </div>

        <div class="overview-grid">
          <div class="overview-primary">
            <ModelDistributionChart
              :model-stats="modelStats" :show-chart="false" :enable-ranking-view="true"
              :ranking-items="rankingItems" :ranking-total-actual-cost="rankingTotalActualCost"
              :ranking-total-requests="rankingTotalRequests" :ranking-total-tokens="rankingTotalTokens"
              :loading="chartsLoading" :ranking-loading="rankingLoading" :ranking-error="rankingError"
              :start-date="startDate" :end-date="endDate" @ranking-click="goToUserUsage"
            />
            <TokenUsageTrend :trend-data="trendData" :loading="chartsLoading">
              <template #controls>
                <div class="overview-granularity"><Select v-model="granularity" :options="granularityOptions" @change="loadChartData" /></div>
              </template>
            </TokenUsageTrend>
          </div>
          <aside class="overview-aside">
            <section class="card overview-accounts">
              <div class="overview-panel-heading"><h2>{{ t('admin.dashboard.connectedAccounts') }}</h2><RouterLink to="/admin/accounts" :aria-label="t('admin.dashboard.manageAccounts')"><Icon name="externalLink" size="sm" /></RouterLink></div>
              <div v-if="accountsLoading" class="space-y-3 p-4" aria-busy="true"><div v-for="i in 2" :key="i" class="skeleton h-10" /></div>
              <div v-else-if="accountsError" class="overview-account-empty"><p>{{ t('admin.dashboard.accountsFailed') }}</p><button type="button" class="btn btn-secondary btn-sm" @click="loadAccounts">{{ t('common.tryAgain') }}</button></div>
              <div v-else-if="!accounts.length" class="overview-account-empty"><p>{{ t('admin.dashboard.noAccounts') }}</p><small>{{ t('admin.dashboard.noAccountsHint') }}</small><RouterLink class="btn btn-secondary btn-sm" to="/admin/accounts">{{ t('admin.dashboard.manageAccounts') }}</RouterLink></div>
              <RouterLink v-for="account in accounts" :key="account.id" :to="{ path: '/admin/accounts', query: { search: account.name } }" class="overview-account-row">
                <span class="overview-provider-mark"><PlatformIcon :platform="account.platform" class="h-5 w-5" /></span>
                <span class="overview-account-name"><b :title="account.name">{{ account.name }}</b><small>{{ providerLabel(account.platform) }}</small></span>
                <span class="overview-account-status" :class="{ 'needs-attention': account.status !== 'active' || !account.schedulable }"><i class="health-dot" /><span>{{ account.status === 'active' && account.schedulable ? t('common.active') : t('admin.dashboard.accountNeedsAttention') }}</span></span>
              </RouterLink>
              <RouterLink to="/admin/accounts" class="overview-panel-link">{{ t('admin.dashboard.manageAccounts') }}<Icon name="chevronRight" size="sm" /></RouterLink>
            </section>
            <section class="card overview-totals">
              <div class="overview-panel-heading"><h2>{{ t('admin.dashboard.totals') }}</h2></div>
              <p v-if="stats.stats_updated_at" class="overview-totals-updated">{{ t('admin.dashboard.updatedAt', { time: formatUpdatedTime(stats.stats_updated_at) }) }}</p>
              <dl><div><dt>{{ t('admin.dashboard.totalRequests') }}</dt><dd>{{ formatNumber(stats.total_requests) }}</dd></div><div><dt>{{ t('admin.dashboard.totalTokens') }}</dt><dd>{{ formatTokens(stats.total_tokens) }}</dd></div><div><dt>{{ t('admin.dashboard.totalCost') }}</dt><dd>${{ formatCost(stats.total_actual_cost) }}</dd></div><div><dt>{{ t('admin.dashboard.activeUsers') }}</dt><dd>{{ formatNumber(stats.hourly_active_users ?? stats.active_users) }}</dd></div></dl>
            </section>
            <div v-if="canUseBatchImage" class="overview-resource-links"><RouterLink to="/batch-images"><Icon name="document" size="sm" />{{ t('nav.batchImage') }}<Icon name="chevronRight" size="sm" /></RouterLink></div>
          </aside>
        </div>

        <details class="card overview-users">
          <summary>{{ t('admin.dashboard.userUsageTrend') }}<Icon name="chevronDown" size="sm" /></summary>
          <div class="overview-users-content">
            <div class="mb-4 flex justify-end gap-1" role="group" :aria-label="t('admin.dashboard.recentUsage')"><button v-for="metric in (['tokens', 'actual_cost'] as const)" :key="metric" type="button" class="overview-segment" :class="{ selected: userTrendMetric === metric }" :aria-pressed="userTrendMetric === metric" @click="setUserTrendMetric(metric)">{{ t(metric === 'tokens' ? 'admin.dashboard.tokens' : 'admin.dashboard.actualSpending') }}</button></div>
            <div class="h-56"><div v-if="userTrendLoading" class="skeleton h-full" /><Line v-else-if="userTrendChartData" :data="userTrendChartData" :options="lineOptions" role="img" :aria-label="t('admin.dashboard.userUsageTrend')" /><div v-else class="overview-chart-empty">{{ t('admin.dashboard.noDataAvailable') }}</div></div>
          </div>
        </details>
      </template>
      <div v-else class="overview-account-empty"><p>{{ t('admin.dashboard.failedToLoad') }}</p><button type="button" class="btn btn-secondary" @click="loadDashboardStats">{{ t('common.tryAgain') }}</button></div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, RouterLink } from 'vue-router'
import { useAppStore } from '@/stores/app'

const { t } = useI18n()
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

const appStore = useAppStore()
const router = useRouter()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()
const stats = ref<DashboardStats | null>(null)
const accounts = ref<AccountListItem[]>([])
const accountsLoading = ref(false)
const accountsError = ref(false)
const loadAccounts = async () => {
  accountsLoading.value = true
  accountsError.value = false
  try {
    const response = await adminAPI.accounts.list(1, 5, { lite: 'true' })
    accounts.value = response.items
  } catch {
    accountsError.value = true
  } finally {
    accountsLoading.value = false
  }
}
const providerLabel = (platform: string): string => ({ openai: 'OpenAI', anthropic: 'Anthropic', gemini: 'Google Gemini', antigravity: 'Antigravity', grok: 'xAI' }[platform] || platform)
const formatUpdatedTime = (value: string): string => new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

const loading = ref(false)
const chartsLoading = ref(false)
const userTrendLoading = ref(false)
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

const getLast24HoursRangeDates = (): { start: string; end: string } => {
  const end = new Date()
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end)
  }
}

// Date range
const granularity = ref<'day' | 'hour'>('hour')
const defaultRange = getLast24HoursRangeDates()
const startDate = ref(defaultRange.start)
const endDate = ref(defaultRange.end)

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

  loadChartData()
}

// Load data
const loadDashboardSnapshot = async (includeStats: boolean) => {
  const currentSeq = ++chartLoadSeq
  if (includeStats && !stats.value) {
    loading.value = true
  }
  chartsLoading.value = true
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
  } catch (error) {
    if (currentSeq !== chartLoadSeq) return
    appStore.showError(t('admin.dashboard.failedToLoad'))
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
    loadDashboardSnapshot(false),
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

.workspace-overview { max-width: 1440px; margin: 0 auto; color: var(--text-primary); }
.overview-heading { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-bottom:24px; }
.overview-heading h1 { font-size:24px; line-height:32px; letter-spacing:-.025em; font-weight:600; }
.overview-heading p { margin-top:5px; font-size:13px; line-height:20px; color:var(--text-secondary); }
.overview-filters { display:flex; gap:8px; align-items:center; flex-shrink:0; }
.overview-refresh { width:32px; padding:0; }
.overview-skeleton { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
.overview-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); padding:20px 0; border-top:1px solid var(--border-default); border-bottom:1px solid var(--border-default); }
.overview-metric { display:flex; flex-direction:column; gap:7px; min-width:0; padding:0 24px; }
.overview-metric:first-child { padding-left:0; }
.overview-metric > span { font-size:12px; line-height:18px; color:var(--text-secondary); }
.overview-metric strong { font-size:28px; line-height:34px; font-weight:550; font-variant-numeric:tabular-nums; letter-spacing:-.025em; }
.overview-metric small { font-size:11px; line-height:17px; color:var(--text-muted); white-space:nowrap; }
.metric-currency { color:var(--text-primary); font-weight:400; margin-right:2px; }
.overview-health { display:flex; align-items:center; flex-wrap:wrap; gap:18px; padding:13px 0 22px; font-size:11px; color:var(--text-secondary); }
.overview-health > span { display:inline-flex; align-items:center; gap:6px; }
.overview-health b { font-weight:500; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.health-dot { display:inline-block; width:6px; height:6px; flex-shrink:0; border-radius:50%; background:#559f87; }
.health-dot-warning,.needs-attention .health-dot { background:#bd9147; }
.overview-health .overview-updated { margin-left:auto; color:var(--text-muted); }
.overview-grid { display:grid; grid-template-columns:minmax(0,1fr) 296px; align-items:start; gap:20px; }
.overview-primary,.overview-aside { display:flex; flex-direction:column; gap:20px; min-width:0; }
.overview-panel-heading { display:flex; align-items:center; justify-content:space-between; min-height:52px; padding:0 16px; }
.overview-panel-heading h2 { font-size:13px; font-weight:600; }
.overview-panel-heading a { display:grid; place-items:center; width:28px; height:28px; color:var(--text-muted); border-radius:5px; }
.overview-panel-heading a:hover { color:var(--text-primary); background:var(--surface-raised); }
.overview-account-row { display:flex; align-items:center; gap:10px; padding:12px 16px; border-top:1px solid var(--border-default); transition:background .15s ease; }
.overview-account-row:hover { background:var(--surface-raised); }
.overview-provider-mark { display:grid; place-items:center; width:26px; height:30px; flex-shrink:0; color:var(--text-secondary); }
.overview-account-name { display:flex; flex:1; min-width:0; flex-direction:column; gap:3px; }
.overview-account-name b { font-size:12px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.overview-account-name small { font-size:11px; color:var(--text-muted); }
.overview-account-status { display:flex; align-items:center; gap:5px; font-size:10px; color:var(--text-secondary); flex-shrink:0; }
.overview-panel-link { display:flex; align-items:center; justify-content:space-between; padding:11px 16px; font-size:11px; color:var(--text-secondary); border-top:1px solid var(--border-default); }
.overview-panel-link:hover { color:var(--accent-primary); }
.overview-totals dl { padding:0 16px 16px; }
.overview-totals-updated { padding:0 16px 8px; color:var(--text-muted); font-size:11px; }
.overview-totals dl > div { display:flex; justify-content:space-between; align-items:center; padding:7px 0; font-size:12px; }
.overview-totals dt { color:var(--text-secondary); }
.overview-totals dd { font-variant-numeric:tabular-nums; font-weight:500; }
.overview-resource-links { display:flex; flex-direction:column; padding:0 4px; gap:3px; }
.overview-resource-links a { display:flex; gap:8px; align-items:center; min-height:32px; padding:0 8px; font-size:12px; color:var(--text-secondary); border-radius:5px; }
.overview-resource-links a > :last-child { margin-left:auto; }
.overview-resource-links a:hover { background:var(--surface-raised); color:var(--text-primary); }
.overview-granularity { width:96px; }
.overview-users { margin-top:20px; }
.overview-users summary { display:flex; align-items:center; justify-content:space-between; padding:15px 16px; cursor:pointer; font-size:12px; font-weight:500; list-style:none; }
.overview-users summary::-webkit-details-marker { display:none; }
.overview-users[open] summary { border-bottom:1px solid var(--border-default); }
.overview-users-content { padding:16px; }
.overview-segment { border-radius:5px; padding:5px 9px; font-size:11px; color:var(--text-secondary); }
.overview-segment.selected { background:var(--surface-raised); color:var(--text-primary); }
.overview-account-empty { padding:18px 16px; display:flex; flex-direction:column; gap:12px; align-items:flex-start; color:var(--text-secondary); font-size:12px; }
.overview-account-empty small { line-height:1.6; color:var(--text-muted); }
.overview-chart-empty { display:grid; place-items:center; height:100%; font-size:12px; color:var(--text-muted); }
@media(max-width:1200px) { .overview-grid { grid-template-columns:minmax(0,1fr) 268px; gap:16px; } .overview-metric { padding:0 16px; } }
@media(max-width:900px) { .overview-grid { grid-template-columns:1fr; } .overview-aside { display:grid; grid-template-columns:1fr 1fr; } .overview-resource-links { grid-column:1 / -1; flex-direction:row; } .overview-resource-links a { flex:1; } }
@media(max-width:600px) { .overview-heading { align-items:flex-start; flex-direction:column; gap:16px; margin-bottom:20px; } .overview-heading h1 { font-size:22px; } .overview-filters { width:100%; } .overview-metrics { grid-template-columns:1fr 1fr; row-gap:24px; padding:18px 0; } .overview-metric { padding:0 14px 0 0; } .overview-metric strong { font-size:26px; } .overview-metric small { white-space:normal; } .overview-aside { display:flex; } .overview-health { gap:12px; padding-bottom:18px; } .overview-health .overview-updated { width:100%; margin-left:0; } .overview-resource-links { flex-direction:column; } }
</style>
