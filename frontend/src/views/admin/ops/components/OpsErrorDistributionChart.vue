<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OpsErrorDistributionResponse } from '@/api/admin/ops'
import type { ChartState } from '../types'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { formatNumber } from '@/utils/format'

interface Props {
  data: OpsErrorDistributionResponse | null
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'openDetails'): void
}>()
const { t } = useI18n()

const totalSlaErrors = computed(() =>
  (props.data?.items ?? []).reduce((total, item) => total + Number(item.sla || 0), 0)
)

const hasData = computed(() => totalSlaErrors.value > 0)

const state = computed<ChartState>(() => {
  if (hasData.value) return 'ready'
  if (props.loading) return 'loading'
  return 'empty'
})

interface ErrorCategory {
  key: string
  label: string
  count: number
}

interface ErrorCategoryRow extends ErrorCategory {
  shareLabel: string
  barWidth: string
}

const categories = computed<ErrorCategory[]>(() => {
  if (!props.data) return []

  let upstream = 0 // 502, 503, 504
  let client = 0 // 4xx
  let system = 0 // 500
  let other = 0

  for (const item of props.data.items || []) {
    const code = Number(item.status_code || 0)
    const count = Number(item.sla || 0)
    if (!Number.isFinite(code) || !Number.isFinite(count)) continue

    if ([502, 503, 504].includes(code)) upstream += count
    else if (code >= 400 && code < 500) client += count
    else if (code === 500) system += count
    else other += count
  }

  const out: ErrorCategory[] = []
  if (upstream > 0) out.push({ key: 'upstream', label: t('admin.ops.upstream'), count: upstream })
  if (client > 0) out.push({ key: 'client', label: t('admin.ops.client'), count: client })
  if (system > 0) out.push({ key: 'system', label: t('admin.ops.system'), count: system })
  if (other > 0) out.push({ key: 'other', label: t('admin.ops.other'), count: other })
  return out
})

const rows = computed<ErrorCategoryRow[]>(() => {
  const list = [...categories.value].sort((a, b) => b.count - a.count)
  const total = list.reduce((sum, item) => sum + item.count, 0)
  const max = list[0]?.count ?? 0
  return list.map((item) => ({
    ...item,
    shareLabel: total > 0 ? `${((item.count / total) * 100).toFixed(1)}%` : '—',
    barWidth: max > 0 ? `${Number(((item.count / max) * 100).toFixed(2))}%` : '0%'
  }))
})
</script>

<template>
  <div class="flex h-full flex-col rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] p-4 sm:p-5">
    <div class="mb-3 flex items-center justify-between gap-2">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        {{ t('admin.ops.errorDistribution') }}
        <HelpTooltip :content="t('admin.ops.tooltips.errorDistribution')" />
      </h3>
      <button
        type="button"
        class="inline-flex items-center rounded-md border border-[var(--border-default)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
        :disabled="state !== 'ready'"
        :title="t('admin.ops.errorTrend')"
        @click="emit('openDetails')"
      >
        {{ t('admin.ops.requestDetails.details') }}
      </button>
    </div>

    <div class="min-h-0 flex-1">
      <ol v-if="state === 'ready' && rows.length > 0" class="error-distribution">
        <li v-for="row in rows" :key="row.key" data-testid="error-distribution-row">
          <div class="error-distribution-line">
            <span class="error-distribution-label">{{ row.label }}</span>
            <span class="error-distribution-count" data-testid="error-distribution-count">{{ formatNumber(row.count) }}</span>
            <span class="error-distribution-share">{{ row.shareLabel }}</span>
          </div>
          <div class="error-distribution-track" aria-hidden="true">
            <span :style="{ width: row.barWidth }"></span>
          </div>
        </li>
      </ol>

      <div v-else class="flex h-full min-h-[160px] items-center justify-center">
        <div v-if="state === 'loading'" class="text-sm text-[var(--text-muted)]">{{ t('common.loading') }}</div>
        <EmptyState v-else :title="t('common.noData')" :description="t('admin.ops.charts.emptyError')" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-distribution li { padding:10px 0; }
.error-distribution li + li { border-top:1px solid var(--border-default); }
.error-distribution-line { display:flex; align-items:baseline; gap:12px; font-size:13px; line-height:20px; }
.error-distribution-label { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-primary); }
.error-distribution-count { color:var(--text-primary); font-weight:500; font-variant-numeric:tabular-nums; }
.error-distribution-share { width:52px; color:var(--text-muted); font-size:12px; text-align:right; font-variant-numeric:tabular-nums; }
.error-distribution-track { height:2px; margin-top:6px; background:var(--surface-hover); }
.error-distribution-track span { display:block; height:100%; background:var(--accent-primary); }
</style>
