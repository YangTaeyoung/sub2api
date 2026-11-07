<template>
  <div class="usage-overview-chart">
    <div v-if="loading" class="usage-plot skeleton" role="status" aria-busy="true" :aria-label="t('common.loading')" />
    <template v-else-if="chartData">
      <div class="usage-plot">
        <component
          :is="singleBucket ? Bar : Line"
          :data="chartData"
          :options="chartOptions"
          role="img"
          :aria-label="`${t('admin.dashboard.analytics.trend')} · ${metricLabel}`"
        />
      </div>
      <details class="usage-data">
        <summary>
          {{ t('admin.dashboard.analytics.viewData') }}
          <span class="usage-bucket-count">{{ t('admin.dashboard.analytics.observedBuckets', { count: observations.length }) }}</span>
        </summary>
        <div class="usage-table-scroll" role="region" :aria-label="t('admin.dashboard.analytics.viewData')" tabindex="0">
          <table>
            <caption class="sr-only">{{ t('admin.dashboard.analytics.trend') }}</caption>
            <thead>
              <tr>
                <th scope="col">{{ t('admin.dashboard.analytics.timeBucket') }}</th>
                <th scope="col">{{ t('admin.dashboard.analytics.cost') }} (USD)</th>
                <th scope="col">{{ t('admin.dashboard.analytics.requests') }}</th>
                <th scope="col">{{ t('admin.dashboard.analytics.tokens') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="({ point }, index) in observations" :key="`${point.date}-${index}`">
                <th scope="row">{{ point.date }}</th>
                <td>{{ formatExactCost(point.actual_cost) }}</td>
                <td>{{ formatExactNumber(point.requests) }}</td>
                <td>{{ formatExactNumber(point.total_tokens) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </template>
    <div v-else class="usage-plot usage-empty" role="status">
      <p>{{ t('admin.dashboard.analytics.noActivity') }}</p>
      <p>{{ t('admin.dashboard.analytics.noActivityHint') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart as ChartJS, LinearScale, PointElement, LineElement, BarElement, Tooltip } from 'chart.js'
import type { Scale, TooltipItem } from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
import { useChartTheme } from '@/composables/useChartTheme'
import { getIntlLocale } from '@/i18n'
import type { TrendDataPoint } from '@/types'

ChartJS.register(LinearScale, PointElement, LineElement, BarElement, Tooltip)

const props = withDefaults(defineProps<{
  trendData: TrendDataPoint[]
  metric?: 'actual_cost' | 'requests' | 'tokens'
  loading?: boolean
}>(), { metric: 'actual_cost', loading: false })

const { t, locale } = useI18n()
const { colors, fontFamily } = useChartTheme()
const intlLocale = computed(() => getIntlLocale(locale?.value))
const metricLabel = computed(() => t(`admin.dashboard.analytics.${props.metric === 'actual_cost' ? 'cost' : props.metric}`))
const numberFormatter = computed(() => new Intl.NumberFormat(intlLocale.value, { maximumFractionDigits: 20 }))
const costFormatter = computed(() => new Intl.NumberFormat(intlLocale.value, {
  style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 20
}))
const compactFormatter = computed(() => new Intl.NumberFormat(intlLocale.value, { notation: 'compact', maximumFractionDigits: 1 }))
const formatExactNumber = (value: number) => numberFormatter.value.format(value)
const formatExactCost = (value: number) => costFormatter.value.format(value)

// API buckets are wall-clock labels with no offset. UTC provides uniform numeric
// spacing without applying the browser's timezone or shifting the original label.
function bucketTimestamp(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value)
  if (!match) return NaN
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4] ?? 0), Number(match[5] ?? 0), Number(match[6] ?? 0))
}

const observations = computed(() => props.trendData
  .map(point => ({ point, x: bucketTimestamp(point.date) }))
  .filter(({ x }) => Number.isFinite(x))
  .sort((a, b) => a.x - b.x))
const singleBucket = computed(() => observations.value.length === 1)
const metricValue = (point: TrendDataPoint) => props.metric === 'tokens' ? point.total_tokens : point[props.metric]

const chartData = computed(() => observations.value.length ? {
  datasets: [{
    label: metricLabel.value,
    data: observations.value.map(({ point, x }) => ({ x, y: metricValue(point) })),
    borderColor: colors.value.input,
    backgroundColor: colors.value.input,
    borderWidth: singleBucket.value ? 0 : 1.75,
    borderRadius: 3,
    maxBarThickness: 36,
    fill: false,
    tension: 0,
    pointRadius: observations.value.length <= 8 ? 2.5 : 0,
    pointHoverRadius: 4,
    pointHitRadius: 14
  }]
} : null)

const formatTimeTick = (value: string | number) => {
  const date = new Date(Number(value))
  const includesHours = observations.value.some(({ point }) => point.date.length > 10)
  const sameDay = observations.value[0]?.point.date.slice(0, 10) === observations.value.at(-1)?.point.date.slice(0, 10)
  return new Intl.DateTimeFormat(intlLocale.value, {
    timeZone: 'UTC',
    ...(includesHours && sameDay ? {} : { month: 'numeric' as const, day: 'numeric' as const }),
    ...(includesHours ? { hour: '2-digit' as const, minute: '2-digit' as const, hourCycle: 'h23' as const } : {})
  }).format(date)
}

const chartOptions = computed(() => {
  const first = observations.value[0]
  const last = observations.value.at(-1)
  const bucketWidth = first?.point.date.length === 10 ? 86_400_000 : 3_600_000
  const tooltipPoint = (item?: Pick<TooltipItem<'line' | 'bar'>, 'dataIndex'>) => item ? observations.value[item.dataIndex]?.point : undefined
  const spaceTimeTicks = (axis: Scale) => {
    const candidates = axis.ticks
    if (candidates.length < 2) return
    // fit() can reduce the initial width to accommodate the y axis. Run this
    // again after fitting so irregular, adjacent buckets cannot overlap.
    const width = Math.max(0, axis.width - 16)
    const maxTicks = width < 480 ? 4 : 6
    let labelWidth = 48
    if (axis.ctx) {
      axis.ctx.save()
      axis.ctx.font = `11px ${fontFamily}`
      labelWidth = Math.max(...candidates.map(tick => axis.ctx.measureText(formatTimeTick(tick.value)).width))
      axis.ctx.restore()
    }
    const minimumGap = Math.max(64, labelWidth + 16)
    const start = candidates[0]
    const end = candidates[candidates.length - 1]
    if (width < minimumGap || end.value === start.value) {
      axis.ticks = [start]
      return
    }
    const spacing = Math.max(minimumGap, width / (maxTicks - 1))
    const pixel = (value: number) => (value - start.value) / (end.value - start.value) * width
    const selected = [start]
    for (const tick of candidates.slice(1, -1)) {
      const position = pixel(tick.value)
      if (position - pixel(selected[selected.length - 1].value) >= spacing && width - position >= spacing) selected.push(tick)
    }
    axis.ticks = [...selected, end]
  }
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    parsing: false as const,
    layout: { padding: { top: 12, right: 8, bottom: 0, left: 0 } },
    interaction: { intersect: false, mode: 'nearest' as const, axis: 'x' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.value.tooltip,
        titleColor: colors.value.foreground,
        bodyColor: colors.value.text,
        borderColor: colors.value.grid,
        borderWidth: 1,
        cornerRadius: 6,
        padding: 12,
        caretSize: 0,
        displayColors: false,
        titleFont: { family: fontFamily, size: 12, weight: 500 },
        bodyFont: { family: fontFamily, size: 12 },
        bodySpacing: 7,
        titleMarginBottom: 9,
        callbacks: {
          title: (items: TooltipItem<'line' | 'bar'>[]) => tooltipPoint(items[0])?.date ?? '',
          label: (item: TooltipItem<'line' | 'bar'>) => {
            const point = tooltipPoint(item)
            return point ? [
              `${t('admin.dashboard.analytics.cost')} (USD): ${formatExactCost(point.actual_cost)}`,
              `${t('admin.dashboard.analytics.requests')}: ${formatExactNumber(point.requests)}`,
              `${t('admin.dashboard.analytics.tokens')}: ${formatExactNumber(point.total_tokens)}`
            ] : []
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        min: first ? first.x - (singleBucket.value ? bucketWidth / 2 : 0) : undefined,
        max: last ? last.x + (singleBucket.value ? bucketWidth / 2 : 0) : undefined,
        grid: { display: false },
        border: { display: false },
        // Select labels by their actual temporal position, never array index.
        afterBuildTicks: (axis: Scale) => {
          const times = [...new Set(observations.value.map(({ x }) => x))]
          axis.ticks = times.map(value => ({ value }))
          spaceTimeTicks(axis)
        },
        afterFit: spaceTimeTicks,
        ticks: { color: colors.value.text, autoSkip: false, maxTicksLimit: 6, maxRotation: 0, padding: 10, font: { family: fontFamily, size: 11 }, callback: formatTimeTick }
      },
      y: {
        beginAtZero: true,
        grace: '12%',
        grid: { color: colors.value.grid, drawTicks: false },
        border: { display: false, dash: [3, 4] },
        ticks: {
          color: colors.value.text,
          maxTicksLimit: 4,
          ...(props.metric === 'actual_cost' ? {} : { precision: 0 }),
          padding: 10,
          font: { family: fontFamily, size: 11 },
          callback: (value: string | number) => props.metric === 'actual_cost'
            ? new Intl.NumberFormat(intlLocale.value, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: Number(value) < 0.01 ? 6 : 2 }).format(Number(value))
            : compactFormatter.value.format(Number(value))
        }
      }
    }
  }
})
</script>

<style scoped>
.usage-overview-chart { min-width:0; color:var(--text-primary); }
.usage-plot { position:relative; height:240px; }
.usage-data { margin-top:12px; color:var(--text-secondary); font-size:12px; line-height:20px; }
.usage-data summary { width:fit-content; cursor:pointer; border-radius:4px; }
.usage-data summary:hover { color:var(--text-primary); }
.usage-data summary:focus-visible,.usage-table-scroll:focus-visible { outline:2px solid var(--accent-primary); outline-offset:4px; }
.usage-bucket-count { margin-left:10px; color:var(--text-muted); }
.usage-table-scroll { overflow:auto; margin-top:12px; max-height:280px; border-radius:4px; }
.usage-data table { width:100%; min-width:520px; border-collapse:collapse; font-variant-numeric:tabular-nums; }
.usage-data th,.usage-data td { padding:8px 12px; text-align:right; white-space:nowrap; border-bottom:1px solid var(--border-default); }
.usage-data th:first-child { text-align:left; padding-left:0; }
.usage-data th:last-child,.usage-data td:last-child { padding-right:0; }
.usage-data thead th { color:var(--text-muted); font-weight:500; }
.usage-data tbody th { font-weight:400; }
.usage-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; text-align:center; padding:24px; }
.usage-empty p:first-child { font-size:13px; font-weight:500; }
.usage-empty p + p { max-width:44ch; color:var(--text-muted); font-size:12px; line-height:1.6; }
@media(max-width:600px) { .usage-plot { height:200px; } .usage-bucket-count { margin-left:6px; } }
@media(pointer:coarse) { .usage-data summary { min-height:44px; align-content:center; } }
</style>
