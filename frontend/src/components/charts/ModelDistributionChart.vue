<template>
  <div class="card p-4 distribution-panel" :class="{ 'distribution-compact': !showChart }">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        {{ !enableRankingView || activeView === 'model_distribution'
          ? t(!showChart ? 'admin.dashboard.modelUsage' : 'admin.dashboard.modelDistribution')
          : t('admin.dashboard.spendingRankingTitle') }}
      </h3>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <div
          v-if="showSourceToggle"
          class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-dark-700 dark:bg-dark-800"
        >
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="source === 'requested'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            @click="emit('update:source', 'requested')"
          >
            {{ t('usage.requestedModel') }}
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="source === 'upstream'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            @click="emit('update:source', 'upstream')"
          >
            {{ t('usage.upstreamModel') }}
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="source === 'mapping'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            @click="emit('update:source', 'mapping')"
          >
            {{ t('usage.mapping') }}
          </button>
        </div>
        <div
          v-if="showMetricToggle"
          class="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-dark-700 dark:bg-dark-800"
        >
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="metric === 'tokens'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            @click="emit('update:metric', 'tokens')"
          >
            {{ t('admin.dashboard.metricTokens') }}
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="metric === 'actual_cost'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            @click="emit('update:metric', 'actual_cost')"
          >
            {{ t('admin.dashboard.metricActualCost') }}
          </button>
        </div>
        <div v-if="enableRankingView" class="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-dark-800">
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="
              activeView === 'model_distribution'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            "
            @click="activeView = 'model_distribution'"
          >
            {{ t(!showChart ? 'admin.dashboard.model' : 'admin.dashboard.viewModelDistribution') }}
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="
              activeView === 'spending_ranking'
                ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-700 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            "
            @click="activeView = 'spending_ranking'"
          >
            {{ t('admin.dashboard.viewSpendingRanking') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="!showChart && activeView === 'model_distribution' && !loading && displayModelStats.length" class="distribution-mobile-models">
      <div v-for="model in displayModelStats" :key="model.model" class="mobile-model-row">
        <RouterLink v-if="modelUsageLinks" :to="modelUsageLocation(model.model)" class="mobile-model-name model-usage-link">{{ model.model }}</RouterLink>
        <button v-else type="button" class="mobile-model-name" :aria-expanded="expandedKey === `model-${model.model}`" @click="enableBreakdown && !modelUsageLinks && toggleBreakdown('model', model.model)">{{ model.model }}<svg v-if="enableBreakdown" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg></button>
        <div class="mobile-model-metrics">
          <span :class="{ 'active-mobile-metric': metric === 'requests' }">{{ t('admin.dashboard.requests') }} <b>{{ formatNumber(model.requests) }}</b></span>
          <span :class="{ 'active-mobile-metric': metric === 'tokens' }">{{ t('admin.dashboard.tokens') }} <b>{{ formatTokens(model.total_tokens) }}</b></span>
          <span :class="{ 'active-mobile-metric': metric === 'actual_cost' }">{{ t('usage.cost') }} <b>${{ formatCost(model.actual_cost) }}</b></span>
        </div>
        <div class="mobile-model-contribution" aria-hidden="true"><span :style="{ width: metricContribution(model) }" /></div>
        <UserBreakdownSubTable v-if="!modelUsageLinks && expandedKey === `model-${model.model}`" :items="breakdownItems" :loading="breakdownLoading" :show-account-cost="showAccountCost" />
      </div>
    </div>

    <div v-if="activeView === 'model_distribution' && loading" class="flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
    <div
      v-else-if="activeView === 'model_distribution' && displayModelStats.length > 0 && chartData"
      class="flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
    >
      <div v-if="showChart" class="h-40 w-40 shrink-0">
        <Doughnut :data="chartData" :options="doughnutOptions" />
      </div>
      <div class="distribution-table w-full min-w-0 flex-1 overflow-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-gray-500 dark:text-gray-400">
              <th class="pb-2 text-left">{{ t('admin.dashboard.model') }}</th>
              <th scope="col" class="pb-2 text-right" :aria-sort="!showChart && metric === 'requests' ? 'descending' : undefined" :class="{ 'selected-metric-heading': !showChart && metric === 'requests' }">{{ t('admin.dashboard.requests') }}</th>
              <th scope="col" class="pb-2 text-right" :aria-sort="!showChart && metric === 'tokens' ? 'descending' : undefined" :class="{ 'selected-metric-heading': !showChart && metric === 'tokens' }">{{ t('admin.dashboard.tokens') }}</th>
              <th scope="col" class="pb-2 text-right" :aria-sort="!showChart && metric === 'actual_cost' ? 'descending' : undefined" :class="{ 'selected-metric-heading': !showChart && metric === 'actual_cost' }">{{ t(!showChart ? 'usage.cost' : 'admin.dashboard.actual') }}</th>
              <th v-if="showAccountCost && showChart" class="pb-2 text-right">{{ t('admin.dashboard.accountCost') }}</th>
              <th v-if="showChart" class="pb-2 text-right">{{ t('admin.dashboard.standard') }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="model in displayModelStats" :key="model.model">
              <tr
                class="border-t border-gray-100 transition-colors dark:border-dark-700"
                :class="enableBreakdown && !modelUsageLinks ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700/40' : ''"
                @click="enableBreakdown && !modelUsageLinks && toggleBreakdown('model', model.model)"
              >
                <td
                  class="max-w-[260px] truncate py-1.5 font-medium"
                  :class="enableBreakdown ? 'text-gray-900 hover:text-primary-600 dark:text-gray-100 dark:hover:text-primary-300' : 'text-gray-900 dark:text-white'"
                  :title="model.model"
                >
                  <RouterLink v-if="modelUsageLinks" :to="modelUsageLocation(model.model)" class="model-usage-link" @click.stop>{{ model.model }}</RouterLink>
                  <button v-else type="button" class="inline-flex items-center gap-1 text-left" :disabled="!enableBreakdown" :aria-expanded="expandedKey === `model-${model.model}`" @click.stop="enableBreakdown && toggleBreakdown('model', model.model)">
                    <svg v-if="enableBreakdown && expandedKey === `model-${model.model}`" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    <svg v-else-if="enableBreakdown" class="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    {{ model.model }}
                  </button>
                </td>
                <td class="py-1.5 text-right text-gray-600 dark:text-gray-400" :class="{ 'active-metric-cell': !showChart && metric === 'requests' }">
                  <span class="metric-cell-value">
                    <span v-if="!showChart && metric === 'requests'" class="metric-contribution" :style="{ width: metricContribution(model) }" aria-hidden="true" />
                    <span class="metric-cell-label">{{ formatNumber(model.requests) }}</span>
                  </span>
                </td>
                <td class="py-1.5 text-right text-gray-600 dark:text-gray-400" :class="{ 'active-metric-cell': !showChart && metric === 'tokens' }">
                  <span class="metric-cell-value">
                    <span v-if="!showChart && metric === 'tokens'" class="metric-contribution" :style="{ width: metricContribution(model) }" aria-hidden="true" />
                    <span class="metric-cell-label">{{ formatTokens(model.total_tokens) }}</span>
                  </span>
                </td>
                <td class="py-1.5 text-right text-gray-900 dark:text-gray-100" :class="{ 'active-metric-cell': !showChart && metric === 'actual_cost' }">
                  <span class="metric-cell-value">
                    <span v-if="!showChart && metric === 'actual_cost'" class="metric-contribution" :style="{ width: metricContribution(model) }" aria-hidden="true" />
                    <span class="metric-cell-label">${{ formatCost(model.actual_cost) }}</span>
                  </span>
                </td>
                <td v-if="showAccountCost && showChart" class="py-1.5 text-right text-orange-500 dark:text-orange-400">
                  ${{ formatCost(model.account_cost) }}
                </td>
                <td v-if="showChart" class="py-1.5 text-right text-gray-400 dark:text-gray-500">
                  ${{ formatCost(model.cost) }}
                </td>
              </tr>
              <tr v-if="!modelUsageLinks && expandedKey === `model-${model.model}`">
                <td :colspan="distributionColspan" class="p-0">
                  <UserBreakdownSubTable
                    :items="breakdownItems"
                    :loading="breakdownLoading"
                    :show-account-cost="showAccountCost"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    <div
      v-else-if="activeView === 'model_distribution'"
      class="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('admin.dashboard.noDataAvailable') }}
    </div>

    <div v-else-if="rankingLoading" class="flex h-48 items-center justify-center">
      <LoadingSpinner />
    </div>
    <div
      v-else-if="rankingError"
      class="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('admin.dashboard.failedToLoad') }}
    </div>
    <div v-else-if="rankingDisplayItems.length > 0 && rankingChartData" class="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div v-if="showChart" class="h-40 w-40 shrink-0">
        <Doughnut :data="rankingChartData" :options="rankingDoughnutOptions" />
      </div>
      <div class="distribution-table w-full min-w-0 flex-1 overflow-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="text-gray-500 dark:text-gray-400">
              <th class="pb-2 text-left">{{ t('admin.dashboard.spendingRankingUser') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingRequests') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingTokens') }}</th>
              <th class="pb-2 text-right">{{ t('admin.dashboard.spendingRankingSpend') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in rankingDisplayItems"
              :key="item.isOther ? 'others' : `${item.user_id}-${index}`"
              class="border-t border-gray-100 transition-colors dark:border-dark-700"
              :class="item.isOther
                ? 'bg-gray-50/70 dark:bg-dark-700/20'
                : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-700/40'"
              @click="item.isOther ? undefined : emit('ranking-click', item)"
            >
              <td class="py-1.5">
                <div class="flex min-w-0 items-center gap-2">
                  <span class="shrink-0 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {{ item.isOther ? 'Σ' : `#${index + 1}` }}
                  </span>
                  <button
                    v-if="!item.isOther"
                    type="button"
                    class="ranking-user-button block max-w-[140px] truncate text-left font-medium text-gray-900 dark:text-white"
                    :title="getRankingRowLabel(item)"
                    @click.stop="emit('ranking-click', item)"
                  >
                    {{ getRankingRowLabel(item) }}
                  </button>
                  <span v-else class="block max-w-[140px] truncate font-medium text-gray-900 dark:text-white">
                    {{ getRankingRowLabel(item) }}
                  </span>
                </div>
              </td>
              <td class="py-1.5 text-right text-gray-600 dark:text-gray-400">
                {{ formatNumber(item.requests) }}
              </td>
              <td class="py-1.5 text-right text-gray-600 dark:text-gray-400">
                {{ formatTokens(item.tokens) }}
              </td>
              <td class="py-1.5 text-right text-gray-900 dark:text-gray-100">
                ${{ formatCost(item.actual_cost) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div
      v-else
      class="flex h-48 items-center justify-center text-sm text-gray-500 dark:text-gray-400"
    >
      {{ t('admin.dashboard.noDataAvailable') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useChartTheme } from '@/composables/useChartTheme'
import UserBreakdownSubTable from './UserBreakdownSubTable.vue'
import type { ModelStat, UserSpendingRankingItem, UserBreakdownItem } from '@/types'
import { getUserBreakdown } from '@/api/admin/dashboard'

ChartJS.register(ArcElement, Tooltip, Legend)

const { t } = useI18n()

type DistributionMetric = 'tokens' | 'actual_cost' | 'requests'
type ModelSource = 'requested' | 'upstream' | 'mapping'
type RankingDisplayItem = UserSpendingRankingItem & { isOther?: boolean }
const props = withDefaults(defineProps<{
  modelStats: ModelStat[]
  upstreamModelStats?: ModelStat[]
  mappingModelStats?: ModelStat[]
  source?: ModelSource
  enableRankingView?: boolean
  rankingItems?: UserSpendingRankingItem[]
  rankingTotalActualCost?: number
  rankingTotalRequests?: number
  rankingTotalTokens?: number
  loading?: boolean
  metric?: DistributionMetric
  showSourceToggle?: boolean
  showMetricToggle?: boolean
  enableBreakdown?: boolean
  showAccountCost?: boolean
  showChart?: boolean
  modelUsageLinks?: boolean
  rankingLoading?: boolean
  rankingError?: boolean
  startDate?: string
  endDate?: string
  filters?: Record<string, any>
}>(), {
  upstreamModelStats: () => [],
  mappingModelStats: () => [],
  source: 'requested',
  enableRankingView: false,
  rankingItems: () => [],
  rankingTotalActualCost: 0,
  rankingTotalRequests: 0,
  rankingTotalTokens: 0,
  loading: false,
  metric: 'tokens',
  showSourceToggle: false,
  showMetricToggle: false,
  enableBreakdown: true,
  showAccountCost: true,
  showChart: true,
  modelUsageLinks: false,
  rankingLoading: false,
  rankingError: false
})

const expandedKey = ref<string | null>(null)
const breakdownItems = ref<UserBreakdownItem[]>([])
const breakdownLoading = ref(false)

const toggleBreakdown = async (type: string, id: string) => {
  const key = `${type}-${id}`
  if (expandedKey.value === key) {
    expandedKey.value = null
    return
  }
  expandedKey.value = key
  breakdownLoading.value = true
  breakdownItems.value = []
  try {
    const res = await getUserBreakdown({
      ...props.filters,
      start_date: props.startDate,
      end_date: props.endDate,
      model: id,
      model_source: props.source,
    })
    breakdownItems.value = res.users || []
  } catch {
    breakdownItems.value = []
  } finally {
    breakdownLoading.value = false
  }
}

const emit = defineEmits<{
  'update:metric': [value: DistributionMetric]
  'update:source': [value: ModelSource]
  'ranking-click': [item: UserSpendingRankingItem]
}>()

const enableRankingView = computed(() => props.enableRankingView)
const showAccountCost = computed(() => props.showAccountCost)
const distributionColspan = computed(() => !props.showChart ? 4 : showAccountCost.value ? 6 : 5)
const activeView = ref<'model_distribution' | 'spending_ranking'>('model_distribution')

const { colors: themeColors, seriesColors: chartColors, fontFamily: chartFontFamily } = useChartTheme()

const displayModelStats = computed(() => {
  const sourceStats = props.source === 'upstream'
    ? props.upstreamModelStats
    : props.source === 'mapping'
      ? props.mappingModelStats
      : props.modelStats
  if (!sourceStats?.length) return []

  return [...sourceStats].sort((a, b) => getMetricValue(b) - getMetricValue(a))
})

const getMetricValue = (model: ModelStat): number => toFiniteNumber(
  props.metric === 'requests' ? model.requests : props.metric === 'actual_cost' ? model.actual_cost : model.total_tokens
)
const maximumMetricValue = computed(() => Math.max(0, ...displayModelStats.value.map(getMetricValue)))
const metricContribution = (model: ModelStat): string => {
  const percentage = maximumMetricValue.value > 0
    ? Math.max(0, getMetricValue(model)) / maximumMetricValue.value * 100
    : 0
  return `${Number(percentage.toFixed(4))}%`
}
const modelUsageLocation = (model: string) => ({
  path: '/admin/usage',
  query: { model, start_date: props.startDate, end_date: props.endDate },
})

const chartData = computed(() => {
  if (!displayModelStats.value.length) return null

  return {
    labels: displayModelStats.value.map((m) => m.model),
    datasets: [
      {
        data: displayModelStats.value.map(getMetricValue),
        backgroundColor: chartColors.value.slice(0, displayModelStats.value.length),
        borderWidth: 0
      }
    ]
  }
})

const rankingChartData = computed(() => {
  if (!props.rankingItems?.length) return null

  const labels = props.rankingItems.map((item, index) => `#${index + 1} ${getRankingUserLabel(item)}`)
  const data = props.rankingItems.map((item) => toFiniteNumber(item.actual_cost))
  const backgroundColor = chartColors.value.slice(0, props.rankingItems.length)

  if (otherRankingItem.value) {
    labels.push(t('admin.dashboard.spendingRankingOther'))
    data.push(otherRankingItem.value.actual_cost)
    backgroundColor.push('#94a3b8')
  }

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor,
        borderWidth: 0
      }
    ]
  }
})

const otherRankingItem = computed<RankingDisplayItem | null>(() => {
  if (!props.rankingItems?.length) return null

  const rankedActualCost = props.rankingItems.reduce((sum, item) => sum + toFiniteNumber(item.actual_cost), 0)
  const rankedRequests = props.rankingItems.reduce((sum, item) => sum + toFiniteNumber(item.requests), 0)
  const rankedTokens = props.rankingItems.reduce((sum, item) => sum + toFiniteNumber(item.tokens), 0)

  const otherActualCost = Math.max((props.rankingTotalActualCost || 0) - rankedActualCost, 0)
  const otherRequests = Math.max((props.rankingTotalRequests || 0) - rankedRequests, 0)
  const otherTokens = Math.max((props.rankingTotalTokens || 0) - rankedTokens, 0)

  if (otherActualCost <= 0.000001 && otherRequests <= 0 && otherTokens <= 0) return null

  return {
    user_id: 0,
    email: '',
    username: '',
    actual_cost: otherActualCost,
    requests: otherRequests,
    tokens: otherTokens,
    isOther: true
  }
})

const rankingDisplayItems = computed<RankingDisplayItem[]>(() => {
  if (!props.rankingItems?.length) return []
  return otherRankingItem.value
    ? [...props.rankingItems, otherRankingItem.value]
    : [...props.rankingItems]
})

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: themeColors.value.tooltip, titleColor: themeColors.value.foreground, bodyColor: themeColors.value.text,
      borderColor: themeColors.value.grid, borderWidth: 1, padding: 12, cornerRadius: 6,
      titleFont: { family: chartFontFamily, size: 12 }, bodyFont: { family: chartFontFamily, size: 12 },
      callbacks: {
        label: (context: any) => {
          const value = context.raw as number
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          const formattedValue = props.metric === 'actual_cost'
            ? `$${formatCost(value)}`
            : props.metric === 'requests' ? formatNumber(value) : formatTokens(value)
          return `${context.label}: ${formattedValue} (${percentage}%)`
        }
      }
    }
  }
}))

const rankingDoughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: themeColors.value.tooltip, titleColor: themeColors.value.foreground, bodyColor: themeColors.value.text,
      borderColor: themeColors.value.grid, borderWidth: 1, padding: 12, cornerRadius: 6,
      titleFont: { family: chartFontFamily, size: 12 }, bodyFont: { family: chartFontFamily, size: 12 },
      callbacks: {
        label: (context: any) => {
          const value = context.raw as number
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
          return `${context.label}: $${formatCost(value)} (${percentage}%)`
        }
      }
    }
  }
}))

const formatTokens = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toLocaleString()
}

const formatNumber = (value: number): string => {
  return toFiniteNumber(value).toLocaleString()
}

const getRankingUserLabel = (item: UserSpendingRankingItem): string => {
  if (item.username?.trim()) return item.username.trim()
  if (item.email?.trim()) return item.email.trim()
  return t('admin.redeem.userPrefix', { id: item.user_id })
}

const getRankingRowLabel = (item: RankingDisplayItem): string => {
  if (item.isOther) return t('admin.dashboard.spendingRankingOther')
  return getRankingUserLabel(item)
}

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
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
</script>

<style scoped>
.distribution-panel { color:var(--text-primary); }
.distribution-table { max-height:320px; }
.distribution-table table { min-width:490px; border-collapse:collapse; font-variant-numeric:tabular-nums; }
.distribution-table th { height:32px; padding:0 8px 8px; font-size:11px; font-weight:400; white-space:nowrap; }
.distribution-table td { height:42px; padding:8px; white-space:nowrap; font-size:12px; }
.distribution-table th:first-child,.distribution-table td:first-child { padding-left:0; }
.distribution-table th:last-child,.distribution-table td:last-child { padding-right:0; }
.distribution-compact :deep(h3) { font-size:13px; font-weight:600; }
.distribution-compact .distribution-table table { min-width:480px; }
.distribution-compact .distribution-table th { font-size:12px; }
.distribution-compact .distribution-table td { height:40px; font-size:13px; color:var(--text-secondary); }
.distribution-compact .distribution-table .selected-metric-heading { color:var(--accent-primary); font-weight:600; }
.distribution-compact .distribution-table .active-metric-cell { color:var(--text-primary); font-weight:550; }
.metric-cell-value { position:relative; display:block; padding:4px 0; isolation:isolate; }
.metric-cell-label { position:relative; }
.metric-contribution { position:absolute; inset-block:0; right:0; border-radius:3px; background:var(--accent-soft); z-index:-1; }
.model-usage-link { color:var(--text-primary); text-decoration:underline; text-decoration-color:var(--border-default); text-underline-offset:4px; }
.model-usage-link:hover { color:var(--accent-primary); text-decoration-color:currentColor; }
.distribution-compact :deep(button) { font-size:11px; line-height:16px; padding:4px 8px; border-radius:4px; }
.ranking-user-button { border-radius:3px; }
.ranking-user-button:focus-visible { outline:2px solid var(--accent-primary); outline-offset:3px; }
.distribution-compact .ranking-user-button { padding:0; font-size:13px; line-height:20px; }
.distribution-mobile-models { display:none; }
.mobile-model-row { border-top:1px solid var(--border-default); padding:13px 0; }
.mobile-model-name { display:flex; align-items:center; justify-content:space-between; width:100%; gap:8px; color:var(--text-primary); text-align:left; overflow-wrap:anywhere; font-size:13px; font-weight:500; }
.mobile-model-metrics { display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:8px; font-size:12px; color:var(--text-muted); }
.mobile-model-metrics .active-mobile-metric,.mobile-model-metrics .active-mobile-metric b { color:var(--accent-primary); font-weight:550; }
.mobile-model-contribution { margin-top:10px; height:3px; border-radius:2px; background:var(--surface-hover); overflow:hidden; }
.mobile-model-contribution span { display:block; height:100%; border-radius:inherit; background:var(--accent-primary); opacity:.55; }
.mobile-model-metrics b { margin-left:3px; color:var(--text-secondary); font-weight:500; font-variant-numeric:tabular-nums; }
@media(max-width:600px) { .distribution-compact .distribution-mobile-models { display:block; } .distribution-compact .distribution-mobile-models + .flex { display:none; } .distribution-table table,.distribution-compact .distribution-table table { min-width:460px; } }
</style>
