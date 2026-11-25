<template>
  <section class="card rank-panel">
    <header class="rank-header">
      <h3>{{ title }}</h3>
      <div v-if="sourceOptions.length || showMetricToggle" class="rank-controls">
        <div v-if="sourceOptions.length" class="rank-segmented" role="group" :aria-label="title">
          <button
            v-for="option in sourceOptions"
            :key="option.value"
            type="button"
            :aria-pressed="source === option.value"
            :class="{ selected: source === option.value }"
            @click="emit('update:source', option.value)"
          >{{ option.label }}</button>
        </div>
        <div v-if="showMetricToggle" class="rank-segmented" role="group" :aria-label="title">
          <button
            v-for="option in metricOptions"
            :key="option.value"
            type="button"
            :aria-pressed="metric === option.value"
            :class="{ selected: metric === option.value }"
            @click="emit('update:metric', option.value)"
          >{{ option.label }}</button>
        </div>
      </div>
    </header>

    <div v-if="loading" class="rank-loading" aria-busy="true" :aria-label="t('common.loading')">
      <div v-for="index in 4" :key="index" class="skeleton" />
    </div>
    <div v-else-if="rows.length" class="rank-table">
      <table>
        <thead>
          <tr>
            <th scope="col">{{ nameLabel }}</th>
            <th scope="col" :aria-sort="metric === 'requests' ? 'descending' : undefined" :class="{ 'rank-active-heading': metric === 'requests' }">{{ t('admin.dashboard.requests') }}</th>
            <th scope="col" :aria-sort="metric === 'tokens' ? 'descending' : undefined" :class="{ 'rank-active-heading': metric === 'tokens' }">{{ t('admin.dashboard.tokens') }}</th>
            <th scope="col" :aria-sort="metric === 'actual_cost' ? 'descending' : undefined" :class="{ 'rank-active-heading': metric === 'actual_cost' }">{{ t('admin.dashboard.actual') }}</th>
            <th v-if="showAccountCost" scope="col">{{ t('admin.dashboard.accountCost') }}</th>
            <th scope="col">{{ t('admin.dashboard.standard') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in rows" :key="row.key">
            <tr
              class="rank-row"
              :class="{ 'rank-row-expandable': row.expandable }"
              :style="{ '--rank-share': share(row) }"
              @click="row.expandable && emit('toggle', row.key)"
            >
              <td class="rank-name" :title="row.title || row.label">
                <button v-if="row.expandable" type="button" :aria-expanded="expandedKey === row.key" @click.stop="emit('toggle', row.key)">
                  <Icon :name="expandedKey === row.key ? 'chevronDown' : 'chevronRight'" size="xs" :stroke-width="2" />
                  <span>{{ row.label }}</span>
                </button>
                <span v-else>{{ row.label }}</span>
              </td>
              <td :data-label="t('admin.dashboard.requests')" :class="{ 'rank-active-cell': metric === 'requests' }">
                <span class="rank-value"><span v-if="metric === 'requests'" class="metric-contribution" :style="{ width: share(row) }" aria-hidden="true" /><span class="rank-value-label">{{ formatNumber(row.requests) }}</span></span>
              </td>
              <td :data-label="t('admin.dashboard.tokens')" :class="{ 'rank-active-cell': metric === 'tokens' }">
                <span class="rank-value"><span v-if="metric === 'tokens'" class="metric-contribution" :style="{ width: share(row) }" aria-hidden="true" /><span class="rank-value-label">{{ formatTokens(row.total_tokens) }}</span></span>
              </td>
              <td :data-label="t('admin.dashboard.actual')" :class="{ 'rank-active-cell': metric === 'actual_cost' }">
                <span class="rank-value"><span v-if="metric === 'actual_cost'" class="metric-contribution" :style="{ width: share(row) }" aria-hidden="true" /><span class="rank-value-label">${{ formatCost(row.actual_cost) }}</span></span>
              </td>
              <td v-if="showAccountCost" :data-label="t('admin.dashboard.accountCost')">
                <span class="rank-value">${{ formatCost(row.account_cost) }}</span>
              </td>
              <td class="rank-standard" :data-label="t('admin.dashboard.standard')">
                <span class="rank-value">${{ formatCost(row.cost) }}</span>
              </td>
            </tr>
            <tr v-if="expandedKey === row.key" class="rank-breakdown">
              <td :colspan="showAccountCost ? 6 : 5">
                <UserBreakdownSubTable :items="breakdownItems" :loading="breakdownLoading" :show-account-cost="showAccountCost" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div v-else class="rank-empty">{{ t('admin.dashboard.noDataAvailable') }}</div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import UserBreakdownSubTable from './UserBreakdownSubTable.vue'
import type { UserBreakdownItem } from '@/types'

export type DistributionRankMetric = 'tokens' | 'actual_cost' | 'requests'

export interface DistributionRankRow {
  key: string
  label: string
  title?: string
  requests: number
  total_tokens: number
  actual_cost: number
  account_cost?: number
  cost: number
  expandable?: boolean
}

export interface DistributionRankOption {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  title: string
  nameLabel: string
  rows: DistributionRankRow[]
  metric?: DistributionRankMetric
  loading?: boolean
  showMetricToggle?: boolean
  showAccountCost?: boolean
  sourceOptions?: DistributionRankOption[]
  source?: string
  expandedKey?: string | null
  breakdownItems?: UserBreakdownItem[]
  breakdownLoading?: boolean
}>(), {
  metric: 'tokens',
  loading: false,
  showMetricToggle: false,
  showAccountCost: true,
  sourceOptions: () => [],
  source: '',
  expandedKey: null,
  breakdownItems: () => [],
  breakdownLoading: false,
})

const emit = defineEmits<{
  'update:metric': [value: 'tokens' | 'actual_cost']
  'update:source': [value: string]
  toggle: [key: string]
}>()

const { t } = useI18n()

const metricOptions = computed(() => [
  { value: 'tokens' as const, label: t('admin.dashboard.metricTokens') },
  { value: 'actual_cost' as const, label: t('admin.dashboard.metricActualCost') },
])

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const metricValue = (row: DistributionRankRow): number => toFiniteNumber(
  props.metric === 'requests' ? row.requests : props.metric === 'actual_cost' ? row.actual_cost : row.total_tokens
)
const maximumMetricValue = computed(() => Math.max(0, ...props.rows.map(metricValue)))
const share = (row: DistributionRankRow): string => {
  const percentage = maximumMetricValue.value > 0
    ? Math.max(0, metricValue(row)) / maximumMetricValue.value * 100
    : 0
  return `${Number(percentage.toFixed(4))}%`
}

const formatTokens = (value: number): string => {
  const safeValue = toFiniteNumber(value)
  if (safeValue >= 1_000_000_000) return `${(safeValue / 1_000_000_000).toFixed(2)}B`
  if (safeValue >= 1_000_000) return `${(safeValue / 1_000_000).toFixed(2)}M`
  if (safeValue >= 1_000) return `${(safeValue / 1_000).toFixed(2)}K`
  return safeValue.toLocaleString()
}

const formatNumber = (value: number): string => toFiniteNumber(value).toLocaleString()

const formatCost = (value: number | null | undefined): string => {
  const safeValue = toFiniteNumber(value)
  if (safeValue >= 1000) return (safeValue / 1000).toFixed(2) + 'K'
  if (safeValue >= 1) return safeValue.toFixed(2)
  if (safeValue >= 0.01) return safeValue.toFixed(3)
  return safeValue.toFixed(4)
}
</script>

<style scoped>
.rank-panel { container-type:inline-size; padding:16px; color:var(--text-primary); }
.rank-header { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px 12px; margin-bottom:12px; min-height:28px; }
.rank-header h3 { font-size:13px; line-height:20px; font-weight:600; white-space:nowrap; }
.rank-controls { display:flex; flex-wrap:wrap; align-items:center; gap:6px 8px; }
.rank-segmented { display:inline-flex; gap:2px; padding:2px; border:1px solid var(--border-default); border-radius:6px; background:var(--surface-canvas); }
.rank-segmented button { padding:3px 8px; border-radius:4px; color:var(--text-secondary); font-size:11px; line-height:18px; white-space:nowrap; transition:background .15s,color .15s; }
.rank-segmented button:hover { color:var(--text-primary); }
.rank-segmented button.selected { background:var(--surface-panel); color:var(--text-primary); font-weight:500; box-shadow:0 0 0 1px var(--border-default); }
.rank-loading { display:grid; gap:10px; padding:8px 0; }
.rank-loading .skeleton { height:30px; }
.rank-empty { display:grid; place-items:center; height:160px; color:var(--text-muted); font-size:12px; }
.rank-table { max-height:328px; overflow:auto; }
.rank-table table { width:100%; border-collapse:collapse; font-variant-numeric:tabular-nums; }
.rank-table th { position:sticky; top:0; z-index:1; height:30px; padding:0 8px 8px; background:var(--surface-panel); color:var(--text-muted); font-size:12px; font-weight:400; text-align:right; white-space:nowrap; }
.rank-table th:first-child { text-align:left; }
.rank-table th.rank-active-heading { color:var(--accent-text); font-weight:600; }
.rank-row td { height:40px; padding:8px; border-top:1px solid var(--border-default); color:var(--text-secondary); font-size:13px; text-align:right; white-space:nowrap; }
.rank-table th:first-child,.rank-row td:first-child { padding-left:0; }
.rank-table th:last-child,.rank-row td:last-child { padding-right:0; }
.rank-row td.rank-name { width:100%; max-width:0; overflow:hidden; color:var(--text-primary); font-weight:500; text-align:left; text-overflow:ellipsis; }
.rank-name button { display:flex; align-items:center; gap:4px; max-width:100%; border-radius:3px; text-align:left; }
.rank-name button svg { flex-shrink:0; color:var(--text-muted); }
.rank-name button span { overflow:hidden; text-overflow:ellipsis; }
.rank-row-expandable { cursor:pointer; transition:background .15s; }
.rank-row-expandable:hover { background:var(--surface-canvas); }
.rank-row-expandable:hover .rank-name button { color:var(--accent-text); }
.rank-row td.rank-active-cell { color:var(--text-primary); font-weight:550; }
.rank-row td.rank-standard { color:var(--text-muted); }
.rank-value { position:relative; display:block; padding:4px 0; isolation:isolate; }
.rank-value-label { position:relative; }
.metric-contribution { position:absolute; inset-block:0; right:0; z-index:-1; border-radius:3px; background:var(--accent-soft); }
.rank-breakdown td { padding:0; border-top:1px solid var(--border-default); }
@container (max-width:520px) {
  .rank-table { max-height:none; overflow:visible; }
  .rank-table table,.rank-table tbody,.rank-table tr,.rank-table td { display:block; }
  .rank-table thead { display:none; }
  .rank-row { display:flex !important; flex-wrap:wrap; gap:6px 16px; padding:12px 0 0; border-top:1px solid var(--border-default); }
  .rank-row::after { content:''; flex:0 0 100%; height:3px; margin-bottom:12px; border-radius:2px; background:linear-gradient(to right, var(--accent-primary) var(--rank-share), var(--surface-hover) var(--rank-share)); opacity:.6; }
  .rank-row td { height:auto; padding:0; border:0; color:var(--text-muted); font-size:12px; line-height:18px; text-align:left; }
  .rank-row td.rank-name { flex:0 0 100%; width:auto; max-width:none; overflow:visible; font-size:13px; line-height:20px; white-space:normal; overflow-wrap:anywhere; }
  .rank-name button span { overflow:visible; }
  .rank-row td[data-label]::before { content:attr(data-label); margin-right:4px; }
  .rank-value { display:inline; padding:0; color:var(--text-secondary); font-weight:500; }
  .rank-row td.rank-active-cell .rank-value { color:var(--accent-text); font-weight:550; }
  .rank-row td.rank-active-cell { color:var(--accent-text); }
  .metric-contribution { display:none; }
  .rank-breakdown td { overflow-x:auto; }
}
@media(prefers-reduced-motion:reduce) { .rank-segmented button,.rank-row-expandable { transition:none; } }
</style>
