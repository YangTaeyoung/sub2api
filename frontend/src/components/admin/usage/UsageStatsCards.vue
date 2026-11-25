<template>
  <MetricStrip :items="metricItems">
    <template #detail-totalTokens>
      <span class="metric-part">{{ t('usage.in') }} <b>{{ formatTokens(stats?.total_input_tokens || 0) }}</b></span>
      <span class="metric-part">{{ t('usage.out') }} <b>{{ formatTokens(stats?.total_output_tokens || 0) }}</b></span>
      <span
        class="metric-part group inline-flex cursor-help items-center gap-1"
        tabindex="0"
        @mouseenter="placeCacheTooltip"
        @focus="placeCacheTooltip"
      >
        <span>{{ t('usage.cacheTotal') }} <b>{{ formatTokens(stats?.total_cache_tokens || 0) }}</b></span>
        <Icon name="infoCircle" size="xs" />
        <span
          class="pointer-events-none fixed z-50 hidden w-56 whitespace-normal rounded-md border border-[var(--border-default)] bg-[var(--surface-raised)] p-3 text-left text-xs text-[var(--text-secondary)] shadow-lg group-hover:block group-focus:block"
          :style="cacheTooltipStyle"
        >
          <span class="mb-2 block font-medium text-[var(--text-primary)]">
            {{ t('usage.cacheBreakdown') }}
          </span>
          <span class="flex items-center justify-between gap-3">
            <span>{{ t('usage.cacheCreationTokensLabel') }}</span>
            <span class="tabular-nums">
              {{ formatTokens(stats?.total_cache_creation_tokens || 0) }}
            </span>
          </span>
          <span class="mt-1 flex items-center justify-between gap-3">
            <span>{{ t('usage.cacheReadTokensLabel') }}</span>
            <span class="tabular-nums">
              {{ formatTokens(stats?.total_cache_read_tokens || 0) }}
            </span>
          </span>
        </span>
      </span>
    </template>
    <template #detail-totalCost>
      <span v-if="showAccountCost && totalAccountCost != null" class="metric-part">{{ t('usage.accountCost') }} <b>${{ totalAccountCost.toFixed(4) }}</b></span>
      <span class="metric-part">
        {{ t('usage.standardCost') }}
        <b :class="{ 'line-through': strikeStandardCost }">${{ (stats?.total_cost || 0).toFixed(4) }}</b>
      </span>
    </template>
  </MetricStrip>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AdminUsageStatsResponse } from '@/api/admin/usage'
import type { UsageStatsResponse } from '@/types'
import Icon from '@/components/icons/Icon.vue'
import MetricStrip, { type MetricStripItem } from '@/components/charts/MetricStrip.vue'

const props = withDefaults(defineProps<{
  stats: (AdminUsageStatsResponse | UsageStatsResponse) | null
  showAccountCost?: boolean
  strikeStandardCost?: boolean
}>(), {
  showAccountCost: true,
  strikeStandardCost: false,
})

const { t } = useI18n()

const EMPTY_VALUE = '—'

const totalAccountCost = computed(() => {
  const stats = props.stats as (AdminUsageStatsResponse & { total_account_cost?: number }) | null
  return stats?.total_account_cost ?? null
})
const showAccountCost = computed(() => props.showAccountCost)
const strikeStandardCost = computed(() => props.strikeStandardCost)

const formatDuration = (ms: number) =>
  ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`

const formatTokens = (value: number) => {
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B'
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M'
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K'
  return value.toLocaleString()
}

const metricItems = computed<MetricStripItem[]>(() => {
  const stats = props.stats
  return [
    { key: 'totalRequests', label: t('usage.totalRequests'), value: stats ? (stats.total_requests?.toLocaleString() || '0') : EMPTY_VALUE, detail: t('usage.inSelectedRange') },
    { key: 'totalTokens', label: t('usage.totalTokens'), value: stats ? formatTokens(stats.total_tokens || 0) : EMPTY_VALUE },
    { key: 'totalCost', label: t('usage.totalCost'), value: stats ? `$${(stats.total_actual_cost || 0).toFixed(4)}` : EMPTY_VALUE },
    { key: 'avgDuration', label: t('usage.avgDuration'), value: stats ? formatDuration(stats.average_duration_ms || 0) : EMPTY_VALUE },
  ]
})

const TOOLTIP_WIDTH = 224
const cacheTooltipStyle = ref<Record<string, string>>({})
const placeCacheTooltip = (event: Event) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2), window.innerWidth - TOOLTIP_WIDTH - 8)
  cacheTooltipStyle.value = { top: `${rect.bottom + 8}px`, left: `${left}px` }
}
</script>
