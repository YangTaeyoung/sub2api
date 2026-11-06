<template>
  <section class="card token-trend-panel">
    <div class="trend-heading">
      <div><h3>{{ t('admin.dashboard.usageOverTime') }}</h3><p v-if="trendData.length && trendData.length < 3">{{ t('admin.dashboard.observedBuckets', { count: trendData.length }) }}</p></div>
      <div class="trend-controls"><div class="trend-switch" role="group" :aria-label="t('admin.dashboard.tokenUsageTrend')"><button type="button" :aria-pressed="mode === 'tokens'" :class="{ selected: mode === 'tokens' }" @click="mode = 'tokens'">{{ t('admin.dashboard.tokens') }}</button><button type="button" :aria-pressed="mode === 'cache'" :class="{ selected: mode === 'cache' }" @click="mode = 'cache'">{{ t('usage.cacheHitRate') }}</button></div><slot name="controls" /></div>
    </div>
    <div v-if="loading" class="skeleton trend-canvas" aria-busy="true" :aria-label="t('common.loading')" />
    <template v-else-if="chartData">
      <div class="trend-canvas"><component :is="singleBucket ? Bar : Line" :data="chartData" :options="lineOptions" role="img" :aria-label="t('admin.dashboard.tokenUsageTrend')" /></div>
      <div class="trend-legend"><template v-for="(dataset, index) in chartData.datasets" :key="dataset.label"><button v-if="mode === 'cache' ? index === 4 : index < 4" type="button" :aria-pressed="!hiddenSeries.has(index)" :class="{ muted: hiddenSeries.has(index) }" @click="toggleSeries(index)"><i :style="{ backgroundColor: dataset.borderColor }" />{{ dataset.label }}</button></template></div>
      <details class="trend-data"><summary>{{ t('admin.dashboard.viewTokenData') }}</summary><div class="trend-table-scroll"><table><thead><tr><th>{{ t('common.timeLabel') }}</th><th>{{ t('admin.dashboard.input') }}</th><th>{{ t('admin.dashboard.output') }}</th><th>{{ t('usage.cacheCreationTokensLabel') }}</th><th>{{ t('usage.cacheReadTokensLabel') }}</th></tr></thead><tbody><tr v-for="point in trendData" :key="point.date"><td>{{ point.date }}</td><td>{{ formatTokens(point.input_tokens) }}</td><td>{{ formatTokens(point.output_tokens) }}</td><td>{{ formatTokens(point.cache_creation_tokens) }}</td><td>{{ formatTokens(point.cache_read_tokens) }}</td></tr></tbody></table></div></details>
    </template>
    <div v-else class="trend-empty">{{ t('admin.dashboard.noDataAvailable') }}</div>
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Bar } from 'vue-chartjs'
import type { TrendDataPoint } from '@/types'
import { useChartTheme } from '@/composables/useChartTheme'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)
const { t } = useI18n()
const props = defineProps<{ trendData: TrendDataPoint[]; loading?: boolean }>()
const { colors, fontFamily } = useChartTheme()
const mode = ref<'tokens' | 'cache'>('tokens')
const hiddenSeries = ref(new Set<number>())
const singleBucket = computed(() => props.trendData.length === 1)
const toggleSeries = (index: number) => { const next = new Set(hiddenSeries.value); if (next.has(index)) next.delete(index); else next.add(index); hiddenSeries.value = next }
const formatTokens = (value = 0): string => new Intl.NumberFormat(undefined, { notation: Math.abs(value) >= 1000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
const formatCost = (value = 0): string => value.toFixed(value < 1 ? 4 : 2)
const formatTimeTick = (value: string): string => /\d{4}-\d{2}-\d{2}.\d{2}/.test(value) ? value.slice(11, 16) : value.slice(5)
const chartData = computed(() => {
  if (!props.trendData.length) return null
  const series = [
    { label: t('admin.dashboard.input'), key: 'input_tokens', color: colors.value.input },
    { label: t('admin.dashboard.output'), key: 'output_tokens', color: colors.value.output },
    { label: t('usage.cacheCreationTokensLabel'), key: 'cache_creation_tokens', color: colors.value.cacheCreation },
    { label: t('usage.cacheReadTokensLabel'), key: 'cache_read_tokens', color: colors.value.cacheRead },
    { label: t('usage.cacheHitRate'), key: 'rate', color: colors.value.cacheHitRate }
  ]
  return { labels: props.trendData.map(point => point.date), datasets: series.map((series, index) => ({
    label: series.label,
    data: props.trendData.map(point => { if (series.key !== 'rate') return Number(point[series.key as keyof TrendDataPoint]) || 0; const total = point.input_tokens + point.cache_read_tokens + point.cache_creation_tokens; return total > 0 ? point.cache_read_tokens / total * 100 : 0 }),
    borderColor: series.color, backgroundColor: singleBucket.value ? series.color : `${series.color}0d`, borderWidth: singleBucket.value ? 0 : 2,
    borderRadius: singleBucket.value ? 3 : 0, maxBarThickness: 32, fill: !singleBucket.value && index === 0, tension: 0.15,
    pointRadius: 0, pointHoverRadius: 4, pointHitRadius: 12,
    hidden: (mode.value === 'cache' ? index !== 4 : index === 4) || hiddenSeries.value.has(index), yAxisID: index === 4 ? 'yPercent' : 'y'
  })) }
})
const lineOptions = computed(() => ({
  responsive: true, maintainAspectRatio: false, animation: { duration: 180 },
  layout: { padding: { top: 12, right: 8, bottom: 0, left: 0 } }, interaction: { intersect: false, mode: 'index' as const },
  plugins: { legend: { display: false }, tooltip: {
    backgroundColor: colors.value.tooltip, titleColor: colors.value.foreground, bodyColor: colors.value.text, footerColor: colors.value.text,
    borderColor: colors.value.grid, borderWidth: 1, cornerRadius: 6, padding: 12, caretSize: 0, displayColors: true, boxWidth: 6, boxHeight: 6, boxPadding: 4,
    titleFont: { family: fontFamily, size: 12, weight: 500 }, bodyFont: { family: fontFamily, size: 12 }, footerFont: { family: fontFamily, size: 11, weight: 400 }, bodySpacing: 7, titleMarginBottom: 10,
    callbacks: {
      label: (context: any) => `${context.dataset.label}: ${context.dataset.yAxisID === 'yPercent' ? Number(context.raw).toFixed(1) + '%' : formatTokens(Number(context.raw))}`,
      footer: (items: any[]) => { const point = props.trendData[items[0]?.dataIndex]; return point ? `${t('usage.actualCost')} $${formatCost(point.actual_cost)} · ${t('usage.standardCost')} $${formatCost(point.cost)}` : '' }
    }
  } },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: colors.value.text, maxTicksLimit: 6, maxRotation: 0, padding: 10, font: { family: fontFamily, size: 11 }, callback: (_: string | number, index: number) => formatTimeTick(props.trendData[index]?.date || '') } },
    y: { display: mode.value === 'tokens', beginAtZero: true, grid: { color: colors.value.grid, drawTicks: false }, border: { display: false, dash: [3, 4] }, ticks: { color: colors.value.text, maxTicksLimit: 4, padding: 10, font: { family: fontFamily, size: 11 }, callback: (value: string | number) => formatTokens(Number(value)) } },
    yPercent: { display: mode.value === 'cache', position: 'left' as const, min: 0, max: 100, grid: { color: colors.value.grid, drawTicks: false }, border: { display: false, dash: [3, 4] }, ticks: { color: colors.value.text, maxTicksLimit: 4, padding: 10, font: { family: fontFamily, size: 11 }, callback: (value: string | number) => `${value}%` } }
  }
}))
</script>
<style scoped>
.token-trend-panel { padding:16px; color:var(--text-primary); }
.trend-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
.trend-heading h3 { font-size:13px; font-weight:600; line-height:20px; }
.trend-heading p { color:var(--text-muted); font-size:11px; margin-top:3px; }
.trend-controls { display:flex; align-items:center; gap:8px; }
.trend-switch { display:flex; gap:2px; padding:2px; border:1px solid var(--border-default); border-radius:6px; }
.trend-switch button { padding:4px 8px; color:var(--text-secondary); font-size:11px; line-height:18px; border-radius:4px; white-space:nowrap; }
.trend-switch button.selected { background:var(--surface-raised); color:var(--text-primary); }
.trend-canvas,.trend-empty { height:224px; }
.trend-empty { display:grid; place-items:center; font-size:12px; color:var(--text-muted); }
.trend-legend { display:flex; flex-wrap:wrap; justify-content:center; gap:8px 18px; margin-top:14px; }
.trend-legend button { display:flex; gap:6px; align-items:center; color:var(--text-secondary); font-size:11px; line-height:20px; }
.trend-legend i { width:7px; height:7px; border-radius:2px; }
.trend-legend .muted { opacity:.45; text-decoration:line-through; }
.trend-data { margin-top:12px; font-size:11px; color:var(--text-muted); }
.trend-data summary { cursor:pointer; width:fit-content; }
.trend-table-scroll { overflow:auto; margin-top:10px; }
.trend-data table { min-width:480px; width:100%; font-variant-numeric:tabular-nums; }
.trend-data th,.trend-data td { text-align:right; padding:6px; white-space:nowrap; }
.trend-data th:first-child,.trend-data td:first-child { text-align:left; }
.trend-data th { font-weight:400; }
.trend-data td { color:var(--text-secondary); border-top:1px solid var(--border-default); }
@media(max-width:600px) { .trend-heading { align-items:flex-start; flex-direction:column; } .trend-controls { width:100%; justify-content:space-between; } .trend-canvas,.trend-empty { height:200px; } }
</style>
