<script setup lang="ts">
import { computed, onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIntlLocale } from '@/i18n'
import Select from '@/components/common/Select.vue'
import { CONCRETE_PLATFORM_OPTIONS } from '@/constants/platforms'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import Icon from '@/components/icons/Icon.vue'
import { adminAPI } from '@/api'
import { opsAPI, type OpsDashboardOverview, type OpsMetricThresholds, type OpsRealtimeTrafficSummary } from '@/api/admin/ops'
import type { OpsRequestDetailsPreset } from './OpsRequestDetailsModal.vue'
import { useAdminSettingsStore } from '@/stores'
import { formatDateTimeLocalInput, formatNumber } from '@/utils/format'
import { formatMemorySizeMB } from '../utils/opsFormatters'

type RealtimeWindow = '1min' | '5min' | '30min' | '1h'

interface Props {
  overview?: OpsDashboardOverview | null
  platform: string
  groupId: number | null
  timeRange: string
  queryMode: string
  loading: boolean
  lastUpdated: Date | null
  thresholds?: OpsMetricThresholds | null // 阈值配置
  autoRefreshEnabled?: boolean
  autoRefreshCountdown?: number
  fullscreen?: boolean
  customStartTime?: string | null
  customEndTime?: string | null
}

interface Emits {
  (e: 'update:platform', value: string): void
  (e: 'update:group', value: number | null): void
  (e: 'update:timeRange', value: string): void
  (e: 'update:queryMode', value: string): void
  (e: 'update:customTimeRange', startTime: string, endTime: string): void
  (e: 'refresh'): void
  (e: 'openRequestDetails', preset?: OpsRequestDetailsPreset): void
  (e: 'openErrorDetails', kind: 'request' | 'upstream'): void
  (e: 'openSettings'): void
  (e: 'openAlertRules'): void
  (e: 'enterFullscreen'): void
  (e: 'exitFullscreen'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const adminSettingsStore = useAdminSettingsStore()

const realtimeWindow = ref<RealtimeWindow>('1min')

const overview = computed(() => props.overview ?? null)
const systemMetrics = computed(() => overview.value?.system_metrics ?? null)

const REALTIME_WINDOW_MINUTES: Record<RealtimeWindow, number> = {
  '1min': 1,
  '5min': 5,
  '30min': 30,
  '1h': 60
}

const TOOLBAR_RANGE_MINUTES: Record<string, number> = {
  '5m': 5,
  '30m': 30,
  '1h': 60,
  '6h': 6 * 60,
  '24h': 24 * 60
}

const availableRealtimeWindows = computed(() => {
  const toolbarMinutes = TOOLBAR_RANGE_MINUTES[props.timeRange] ?? 60
  return (['1min', '5min', '30min', '1h'] as const).filter((w) => REALTIME_WINDOW_MINUTES[w] <= toolbarMinutes)
})

watch(
  () => props.timeRange,
  () => {
    // The realtime window must be inside the toolbar window; reset to keep UX predictable.
    realtimeWindow.value = '1min'
    // Keep realtime traffic consistent with toolbar changes even when the window is already 1min.
    loadRealtimeTrafficSummary()
  }
)

// --- Filters ---

const showCustomTimeRangeDialog = ref(false)
const customStartTimeInput = ref('')
const customEndTimeInput = ref('')

function formatCustomTimeRangeLabel(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const formatDate = (d: Date) => {
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  }
  return `${formatDate(start)} ~ ${formatDate(end)}`
}

const groups = ref<Array<{ id: number; name: string; platform: string }>>([])

const platformOptions = computed(() => [
  { value: '', label: t('common.all') },
  ...CONCRETE_PLATFORM_OPTIONS
])

const timeRangeOptions = computed(() => [
  { value: '5m', label: t('admin.ops.timeRange.5m') },
  { value: '30m', label: t('admin.ops.timeRange.30m') },
  { value: '1h', label: t('admin.ops.timeRange.1h') },
  { value: '6h', label: t('admin.ops.timeRange.6h') },
  { value: '24h', label: t('admin.ops.timeRange.24h') },
  {
    value: 'custom',
    label: props.timeRange === 'custom' && props.customStartTime && props.customEndTime
      ? `${t('admin.ops.timeRange.custom')} (${formatCustomTimeRangeLabel(props.customStartTime, props.customEndTime)})`
      : t('admin.ops.timeRange.custom')
  }
])

const queryModeOptions = computed(() => [
  { value: 'auto', label: t('admin.ops.queryMode.auto') },
  { value: 'raw', label: t('admin.ops.queryMode.raw') },
  { value: 'preagg', label: t('admin.ops.queryMode.preagg') }
])

const groupOptions = computed(() => {
  const filtered = props.platform ? groups.value.filter((g) => g.platform === props.platform) : groups.value
  return [{ value: null, label: t('common.all') }, ...filtered.map((g) => ({ value: g.id, label: g.name }))]
})

watch(
  () => props.platform,
  (newPlatform) => {
    if (!newPlatform) return
    const currentGroup = groups.value.find((g) => g.id === props.groupId)
    if (currentGroup && currentGroup.platform !== newPlatform) {
      emit('update:group', null)
    }
  }
)

onMounted(async () => {
  try {
    const list = await adminAPI.groups.getAll()
    groups.value = list.map((g) => ({ id: g.id, name: g.name, platform: g.platform }))
  } catch (e) {
    console.error('[OpsDashboardHeader] Failed to load groups', e)
    groups.value = []
  }
})

function handlePlatformChange(val: string | number | boolean | null) {
  emit('update:platform', String(val || ''))
}

function handleGroupChange(val: string | number | boolean | null) {
  if (val === null || val === '' || typeof val === 'boolean') {
    emit('update:group', null)
    return
  }
  const id = typeof val === 'number' ? val : Number.parseInt(String(val), 10)
  emit('update:group', Number.isFinite(id) && id > 0 ? id : null)
}

function handleTimeRangeChange(val: string | number | boolean | null) {
  const newValue = String(val || '1h')
  if (newValue === 'custom') {
    // 初始化为最近1小时
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    customStartTimeInput.value = formatDateTimeLocalInput(oneHourAgo.getTime() / 1000)
    customEndTimeInput.value = formatDateTimeLocalInput(now.getTime() / 1000)
    showCustomTimeRangeDialog.value = true
  } else {
    emit('update:timeRange', newValue)
  }
}

function handleCustomTimeRangeConfirm() {
  if (!customStartTimeInput.value || !customEndTimeInput.value) return
  const startTime = new Date(customStartTimeInput.value).toISOString()
  const endTime = new Date(customEndTimeInput.value).toISOString()
  // Emit custom time range first so the parent can build correct API params
  // when it reacts to timeRange switching to "custom".
  emit('update:customTimeRange', startTime, endTime)
  emit('update:timeRange', 'custom')
  showCustomTimeRangeDialog.value = false
}

function handleCustomTimeRangeCancel() {
  showCustomTimeRangeDialog.value = false
  // 如果当前不是 custom，不需要做任何事
  // 如果当前是 custom，保持不变
}

function handleQueryModeChange(val: string | number | boolean | null) {
  emit('update:queryMode', String(val || 'auto'))
}

function openDetails(preset?: OpsRequestDetailsPreset) {
  emit('openRequestDetails', preset)
}

function openErrorDetails(kind: 'request' | 'upstream') {
  emit('openErrorDetails', kind)
}

// --- Threshold checking helpers ---
type ThresholdLevel = 'normal' | 'warning' | 'critical'

function getSLAThresholdLevel(slaPercent: number | null): ThresholdLevel {
  if (slaPercent == null) return 'normal'
  const threshold = props.thresholds?.sla_percent_min
  if (threshold == null) return 'normal'

  // SLA is "higher is better":
  // - below threshold => critical
  // - within +0.1% buffer => warning
  const warningBuffer = 0.1

  if (slaPercent < threshold) return 'critical'
  if (slaPercent < threshold + warningBuffer) return 'warning'
  return 'normal'
}

function getTTFTThresholdLevel(ttftMs: number | null): ThresholdLevel {
  if (ttftMs == null) return 'normal'
  const threshold = props.thresholds?.ttft_p99_ms_max
  if (threshold == null) return 'normal'
  if (ttftMs >= threshold) return 'critical'
  if (ttftMs >= threshold * 0.8) return 'warning'
  return 'normal'
}

function getRequestErrorRateThresholdLevel(errorRatePercent: number | null): ThresholdLevel {
  if (errorRatePercent == null) return 'normal'
  const threshold = props.thresholds?.request_error_rate_percent_max
  if (threshold == null) return 'normal'
  if (errorRatePercent >= threshold) return 'critical'
  if (errorRatePercent >= threshold * 0.8) return 'warning'
  return 'normal'
}

function getUpstreamErrorRateThresholdLevel(upstreamErrorRatePercent: number | null): ThresholdLevel {
  if (upstreamErrorRatePercent == null) return 'normal'
  const threshold = props.thresholds?.upstream_error_rate_percent_max
  if (threshold == null) return 'normal'
  if (upstreamErrorRatePercent >= threshold) return 'critical'
  if (upstreamErrorRatePercent >= threshold * 0.8) return 'warning'
  return 'normal'
}

function stateClass(level: ThresholdLevel): string {
  switch (level) {
    case 'critical':
      return 'is-critical'
    case 'warning':
      return 'is-warning'
    default:
      return ''
  }
}

function plainLabel(key: string): string {
  return t(key).replace(/\s*[:：]\s*$/, '')
}

const diagnosisId = useId()
const customStartId = useId()
const customEndId = useId()

// --- Realtime / Overview labels ---

const totalRequestsLabel = computed(() => formatNumber(overview.value?.request_count_total ?? 0))
const totalTokensLabel = computed(() => formatNumber(overview.value?.token_consumed ?? 0))

const realtimeTrafficSummary = ref<OpsRealtimeTrafficSummary | null>(null)
const realtimeTrafficLoading = ref(false)

function makeZeroRealtimeTrafficSummary(): OpsRealtimeTrafficSummary {
  const now = new Date().toISOString()
  return {
    window: realtimeWindow.value,
    start_time: now,
    end_time: now,
    platform: props.platform,
    group_id: props.groupId,
    qps: { current: 0, peak: 0, avg: 0 },
    tps: { current: 0, peak: 0, avg: 0 }
  }
}

async function loadRealtimeTrafficSummary() {
  if (realtimeTrafficLoading.value) return
  if (!adminSettingsStore.opsRealtimeMonitoringEnabled) {
    realtimeTrafficSummary.value = makeZeroRealtimeTrafficSummary()
    return
  }
  realtimeTrafficLoading.value = true
  try {
    const res = await opsAPI.getRealtimeTrafficSummary(realtimeWindow.value, props.platform, props.groupId)
    if (res && res.enabled === false) {
      adminSettingsStore.setOpsRealtimeMonitoringEnabledLocal(false)
    }
    realtimeTrafficSummary.value = res?.summary ?? null
  } catch (err) {
    console.error('[OpsDashboardHeader] Failed to load realtime traffic summary', err)
    realtimeTrafficSummary.value = null
  } finally {
    realtimeTrafficLoading.value = false
  }
}

watch(
  () => [realtimeWindow.value, props.platform, props.groupId] as const,
  () => {
    loadRealtimeTrafficSummary()
  },
  { immediate: true }
)

watch(
  () => adminSettingsStore.opsRealtimeMonitoringEnabled,
  (enabled) => {
    if (!enabled) {
      // Keep UI stable when realtime monitoring is turned off.
      realtimeTrafficSummary.value = makeZeroRealtimeTrafficSummary()
    } else {
      loadRealtimeTrafficSummary()
    }
  },
  { immediate: true }
)

// Realtime traffic refresh follows the parent (OpsDashboard) refresh cadence.
watch(
  () => [props.autoRefreshEnabled, props.autoRefreshCountdown, props.loading] as const,
  ([enabled, countdown, loading]) => {
    if (!enabled) return
    if (loading) return
    // Treat countdown reset (or reaching 0) as a refresh boundary.
    if (countdown === 0) {
      loadRealtimeTrafficSummary()
    }
  }
)

// no-op: parent controls refresh cadence

const displayRealTimeQps = computed(() => {
  const v = realtimeTrafficSummary.value?.qps?.current
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
})

const displayRealTimeTps = computed(() => {
  const v = realtimeTrafficSummary.value?.tps?.current
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
})

const realtimeQpsPeakLabel = computed(() => {
  const v = realtimeTrafficSummary.value?.qps?.peak
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(1) : '-'
})
const realtimeTpsPeakLabel = computed(() => {
  const v = realtimeTrafficSummary.value?.tps?.peak
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(1) : '-'
})
const realtimeQpsAvgLabel = computed(() => {
  const v = realtimeTrafficSummary.value?.qps?.avg
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(1) : '-'
})
const realtimeTpsAvgLabel = computed(() => {
  const v = realtimeTrafficSummary.value?.tps?.avg
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(1) : '-'
})

const qpsAvgLabel = computed(() => {
  const v = overview.value?.qps?.avg
  if (typeof v !== 'number') return '-'
  return v.toFixed(1)
})

const tpsAvgLabel = computed(() => {
  const v = overview.value?.tps?.avg
  if (typeof v !== 'number') return '-'
  return v.toFixed(1)
})

const slaPercent = computed(() => {
  const v = overview.value?.sla
  if (typeof v !== 'number') return null
  if ((overview.value?.request_count_sla ?? 0) <= 0) return null
  return v * 100
})

const errorRatePercent = computed(() => {
  const v = overview.value?.error_rate
  if (typeof v !== 'number') return null
  return v * 100
})

const upstreamErrorRatePercent = computed(() => {
  const v = overview.value?.upstream_error_rate
  if (typeof v !== 'number') return null
  return v * 100
})

const durationP99Ms = computed(() => overview.value?.duration?.p99_ms ?? null)
const durationP95Ms = computed(() => overview.value?.duration?.p95_ms ?? null)
const durationP90Ms = computed(() => overview.value?.duration?.p90_ms ?? null)
const durationP50Ms = computed(() => overview.value?.duration?.p50_ms ?? null)
const durationAvgMs = computed(() => overview.value?.duration?.avg_ms ?? null)
const durationMaxMs = computed(() => overview.value?.duration?.max_ms ?? null)

const ttftP99Ms = computed(() => overview.value?.ttft?.p99_ms ?? null)
const ttftP95Ms = computed(() => overview.value?.ttft?.p95_ms ?? null)
const ttftP90Ms = computed(() => overview.value?.ttft?.p90_ms ?? null)
const ttftP50Ms = computed(() => overview.value?.ttft?.p50_ms ?? null)
const ttftAvgMs = computed(() => overview.value?.ttft?.avg_ms ?? null)
const ttftMaxMs = computed(() => overview.value?.ttft?.max_ms ?? null)

const durationBreakdown = computed(() => [
  { label: 'P95', value: durationP95Ms.value },
  { label: 'P90', value: durationP90Ms.value },
  { label: 'P50', value: durationP50Ms.value },
  { label: 'Avg', value: durationAvgMs.value },
  { label: 'Max', value: durationMaxMs.value }
])

const ttftBreakdown = computed(() => [
  { label: 'P95', value: ttftP95Ms.value },
  { label: 'P90', value: ttftP90Ms.value },
  { label: 'P50', value: ttftP50Ms.value },
  { label: 'Avg', value: ttftAvgMs.value },
  { label: 'Max', value: ttftMaxMs.value }
])

// --- Health Score & Diagnosis (primary) ---

const isSystemIdle = computed(() => {
  const ov = overview.value
  if (!ov) return true
  const qps = ov.qps?.current
  const errorRate = ov.error_rate ?? 0
  return (qps ?? 0) === 0 && errorRate === 0
})

const healthScoreValue = computed<number | null>(() => {
  const v = overview.value?.health_score
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const healthLevel = computed<ThresholdLevel>(() => {
  if (isSystemIdle.value) return 'normal'
  const score = healthScoreValue.value
  if (score == null) return 'normal'
  if (score >= 90) return 'normal'
  if (score >= 60) return 'warning'
  return 'critical'
})

interface DiagnosisItem {
  type: 'critical' | 'warning' | 'info'
  message: string
  impact: string
  action?: string
}

const diagnosisReport = computed<DiagnosisItem[]>(() => {
  const ov = overview.value
  if (!ov) return []

  const report: DiagnosisItem[] = []

  if (isSystemIdle.value) {
    report.push({
      type: 'info',
      message: t('admin.ops.diagnosis.idle'),
      impact: t('admin.ops.diagnosis.idleImpact')
    })
    return report
  }

  // Resource diagnostics (highest priority)
  const sm = ov.system_metrics
  if (sm) {
    if (sm.db_ok === false) {
      report.push({
        type: 'critical',
        message: t('admin.ops.diagnosis.dbDown'),
        impact: t('admin.ops.diagnosis.dbDownImpact'),
        action: t('admin.ops.diagnosis.dbDownAction')
      })
    }
    if (sm.redis_ok === false) {
      report.push({
        type: 'warning',
        message: t('admin.ops.diagnosis.redisDown'),
        impact: t('admin.ops.diagnosis.redisDownImpact'),
        action: t('admin.ops.diagnosis.redisDownAction')
      })
    }

    const cpuPct = sm.cpu_usage_percent ?? 0
    if (cpuPct > 90) {
      report.push({
        type: 'critical',
        message: t('admin.ops.diagnosis.cpuCritical', { usage: cpuPct.toFixed(1) }),
        impact: t('admin.ops.diagnosis.cpuCriticalImpact'),
        action: t('admin.ops.diagnosis.cpuCriticalAction')
      })
    } else if (cpuPct > 80) {
      report.push({
        type: 'warning',
        message: t('admin.ops.diagnosis.cpuHigh', { usage: cpuPct.toFixed(1) }),
        impact: t('admin.ops.diagnosis.cpuHighImpact'),
        action: t('admin.ops.diagnosis.cpuHighAction')
      })
    }

    const memPct = sm.memory_usage_percent ?? 0
    if (memPct > 90) {
      report.push({
        type: 'critical',
        message: t('admin.ops.diagnosis.memoryCritical', { usage: memPct.toFixed(1) }),
        impact: t('admin.ops.diagnosis.memoryCriticalImpact'),
        action: t('admin.ops.diagnosis.memoryCriticalAction')
      })
    } else if (memPct > 85) {
      report.push({
        type: 'warning',
        message: t('admin.ops.diagnosis.memoryHigh', { usage: memPct.toFixed(1) }),
        impact: t('admin.ops.diagnosis.memoryHighImpact'),
        action: t('admin.ops.diagnosis.memoryHighAction')
      })
    }
  }

  const ttftP99 = ov.ttft?.p99_ms ?? 0
  if (ttftP99 > 500) {
    report.push({
      type: 'warning',
      message: t('admin.ops.diagnosis.ttftHigh', { ttft: ttftP99.toFixed(0) }),
      impact: t('admin.ops.diagnosis.ttftHighImpact'),
      action: t('admin.ops.diagnosis.ttftHighAction')
    })
  }

  // Error rate diagnostics (adjusted thresholds)
  const upstreamRatePct = (ov.upstream_error_rate ?? 0) * 100
  if (upstreamRatePct > 5) {
    report.push({
      type: 'critical',
      message: t('admin.ops.diagnosis.upstreamCritical', { rate: upstreamRatePct.toFixed(2) }),
      impact: t('admin.ops.diagnosis.upstreamCriticalImpact'),
      action: t('admin.ops.diagnosis.upstreamCriticalAction')
    })
  } else if (upstreamRatePct > 2) {
    report.push({
      type: 'warning',
      message: t('admin.ops.diagnosis.upstreamHigh', { rate: upstreamRatePct.toFixed(2) }),
      impact: t('admin.ops.diagnosis.upstreamHighImpact'),
      action: t('admin.ops.diagnosis.upstreamHighAction')
    })
  }

  const errorPct = (ov.error_rate ?? 0) * 100
  if (errorPct > 3) {
    report.push({
      type: 'critical',
      message: t('admin.ops.diagnosis.errorHigh', { rate: errorPct.toFixed(2) }),
      impact: t('admin.ops.diagnosis.errorHighImpact'),
      action: t('admin.ops.diagnosis.errorHighAction')
    })
  } else if (errorPct > 0.5) {
    report.push({
      type: 'warning',
      message: t('admin.ops.diagnosis.errorElevated', { rate: errorPct.toFixed(2) }),
      impact: t('admin.ops.diagnosis.errorElevatedImpact'),
      action: t('admin.ops.diagnosis.errorElevatedAction')
    })
  }

  // SLA diagnostics
  const slaPct = (ov.sla ?? 0) * 100
  if (slaPct < 90) {
    report.push({
      type: 'critical',
      message: t('admin.ops.diagnosis.slaCritical', { sla: slaPct.toFixed(2) }),
      impact: t('admin.ops.diagnosis.slaCriticalImpact'),
      action: t('admin.ops.diagnosis.slaCriticalAction')
    })
  } else if (slaPct < 98) {
    report.push({
      type: 'warning',
      message: t('admin.ops.diagnosis.slaLow', { sla: slaPct.toFixed(2) }),
      impact: t('admin.ops.diagnosis.slaLowImpact'),
      action: t('admin.ops.diagnosis.slaLowAction')
    })
  }

  // Health score diagnostics (lowest priority)
  if (healthScoreValue.value != null) {
    if (healthScoreValue.value < 60) {
      report.push({
        type: 'critical',
        message: t('admin.ops.diagnosis.healthCritical', { score: healthScoreValue.value }),
        impact: t('admin.ops.diagnosis.healthCriticalImpact'),
        action: t('admin.ops.diagnosis.healthCriticalAction')
      })
    } else if (healthScoreValue.value < 90) {
      report.push({
        type: 'warning',
        message: t('admin.ops.diagnosis.healthLow', { score: healthScoreValue.value }),
        impact: t('admin.ops.diagnosis.healthLowImpact'),
        action: t('admin.ops.diagnosis.healthLowAction')
      })
    }
  }

  if (report.length === 0) {
    report.push({
      type: 'info',
      message: t('admin.ops.diagnosis.healthy'),
      impact: t('admin.ops.diagnosis.healthyImpact')
    })
  }

  return report
})

// --- System health (secondary) ---

function formatTimeShort(ts?: string | null): string {
  if (!ts) return '-'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleTimeString(getIntlLocale())
}

const cpuPercentValue = computed<number | null>(() => {
  const v = systemMetrics.value?.cpu_usage_percent
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const cpuLevel = computed<ThresholdLevel>(() => {
  const v = cpuPercentValue.value
  if (v == null) return 'normal'
  if (v >= 95) return 'critical'
  if (v >= 80) return 'warning'
  return 'normal'
})

const memPercentValue = computed<number | null>(() => {
  const v = systemMetrics.value?.memory_usage_percent
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const memLevel = computed<ThresholdLevel>(() => {
  const v = memPercentValue.value
  if (v == null) return 'normal'
  if (v >= 95) return 'critical'
  if (v >= 85) return 'warning'
  return 'normal'
})

const dbConnActiveValue = computed<number | null>(() => {
  const v = systemMetrics.value?.db_conn_active
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const dbConnIdleValue = computed<number | null>(() => {
  const v = systemMetrics.value?.db_conn_idle
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const dbConnWaitingValue = computed<number | null>(() => {
  const v = systemMetrics.value?.db_conn_waiting
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const dbConnOpenValue = computed<number | null>(() => {
  if (dbConnActiveValue.value == null || dbConnIdleValue.value == null) return null
  return dbConnActiveValue.value + dbConnIdleValue.value
})

const dbMaxOpenConnsValue = computed<number | null>(() => {
  const v = systemMetrics.value?.db_max_open_conns
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const dbUsagePercent = computed<number | null>(() => {
  if (dbConnOpenValue.value == null || dbMaxOpenConnsValue.value == null || dbMaxOpenConnsValue.value <= 0) return null
  return Math.min(100, Math.max(0, (dbConnOpenValue.value / dbMaxOpenConnsValue.value) * 100))
})

const dbMiddleLabel = computed(() => {
  if (systemMetrics.value?.db_ok === false) return 'FAIL'
  if (dbUsagePercent.value != null) return `${dbUsagePercent.value.toFixed(0)}%`
  if (systemMetrics.value?.db_ok === true) return t('admin.ops.ok')
  return t('admin.ops.noData')
})

const dbLevel = computed<ThresholdLevel>(() => {
  if (systemMetrics.value?.db_ok === false) return 'critical'
  if (dbUsagePercent.value != null) {
    if (dbUsagePercent.value >= 90) return 'critical'
    if (dbUsagePercent.value >= 70) return 'warning'
    return 'normal'
  }
  if (systemMetrics.value?.db_ok === true) return 'normal'
  return 'normal'
})

const redisConnTotalValue = computed<number | null>(() => {
  const v = systemMetrics.value?.redis_conn_total
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const redisConnIdleValue = computed<number | null>(() => {
  const v = systemMetrics.value?.redis_conn_idle
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const redisConnActiveValue = computed<number | null>(() => {
  if (redisConnTotalValue.value == null || redisConnIdleValue.value == null) return null
  return Math.max(redisConnTotalValue.value - redisConnIdleValue.value, 0)
})

const redisPoolSizeValue = computed<number | null>(() => {
  const v = systemMetrics.value?.redis_pool_size
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const redisUsagePercent = computed<number | null>(() => {
  if (redisConnTotalValue.value == null || redisPoolSizeValue.value == null || redisPoolSizeValue.value <= 0) return null
  return Math.min(100, Math.max(0, (redisConnTotalValue.value / redisPoolSizeValue.value) * 100))
})

const redisMiddleLabel = computed(() => {
  if (systemMetrics.value?.redis_ok === false) return 'FAIL'
  if (redisUsagePercent.value != null) return `${redisUsagePercent.value.toFixed(0)}%`
  if (systemMetrics.value?.redis_ok === true) return t('admin.ops.ok')
  return t('admin.ops.noData')
})

const redisLevel = computed<ThresholdLevel>(() => {
  if (systemMetrics.value?.redis_ok === false) return 'critical'
  if (redisUsagePercent.value != null) {
    if (redisUsagePercent.value >= 90) return 'critical'
    if (redisUsagePercent.value >= 70) return 'warning'
    return 'normal'
  }
  if (systemMetrics.value?.redis_ok === true) return 'normal'
  return 'normal'
})

const goroutineCountValue = computed<number | null>(() => {
  const v = systemMetrics.value?.goroutine_count
  return typeof v === 'number' && Number.isFinite(v) ? v : null
})

const goroutinesWarnThreshold = 8_000
const goroutinesCriticalThreshold = 15_000

const goroutineStatus = computed<'ok' | 'warning' | 'critical' | 'unknown'>(() => {
  const n = goroutineCountValue.value
  if (n == null) return 'unknown'
  if (n >= goroutinesCriticalThreshold) return 'critical'
  if (n >= goroutinesWarnThreshold) return 'warning'
  return 'ok'
})

const goroutineStatusLabel = computed(() => {
  switch (goroutineStatus.value) {
    case 'ok':
      return t('admin.ops.ok')
    case 'warning':
      return t('common.warning')
    case 'critical':
      return t('common.critical')
    default:
      return t('admin.ops.noData')
  }
})

const goroutineLevel = computed<ThresholdLevel>(() => {
  switch (goroutineStatus.value) {
    case 'ok':
      return 'normal'
    case 'warning':
      return 'warning'
    case 'critical':
      return 'critical'
    default:
      return 'normal'
  }
})

const jobHeartbeats = computed(() => overview.value?.job_heartbeats ?? [])

const jobsStatus = computed<'ok' | 'warn' | 'unknown'>(() => {
  const list = jobHeartbeats.value
  if (!list.length) return 'unknown'
  for (const hb of list) {
    if (!hb) continue
    if (hb.last_error_at && (!hb.last_success_at || hb.last_error_at > hb.last_success_at)) return 'warn'
  }
  return 'ok'
})

const jobsWarnCount = computed(() => {
  let warn = 0
  for (const hb of jobHeartbeats.value) {
    if (!hb) continue
    if (hb.last_error_at && (!hb.last_success_at || hb.last_error_at > hb.last_success_at)) warn++
  }
  return warn
})

const jobsStatusLabel = computed(() => {
  switch (jobsStatus.value) {
    case 'ok':
      return t('admin.ops.ok')
    case 'warn':
      return t('common.warning')
    default:
      return t('admin.ops.noData')
  }
})

const jobsLevel = computed<ThresholdLevel>(() => {
  switch (jobsStatus.value) {
    case 'ok':
      return 'normal'
    case 'warn':
      return 'warning'
    default:
      return 'normal'
  }
})

const showJobsDetails = ref(false)

function openJobsDetails() {
  showJobsDetails.value = true
}

function handleToolbarRefresh() {
  loadRealtimeTrafficSummary()
  emit('refresh')
}
</script>

<template>
  <div class="ops-header" :class="{ 'is-fullscreen': props.fullscreen }">
    <header class="ops-heading">
      <div class="ops-heading-text">
        <h1>{{ t('admin.ops.title') }}</h1>

        <p v-if="!props.fullscreen" class="ops-heading-meta">
          <span :title="props.loading ? t('admin.ops.loadingText') : t('admin.ops.ready')">
            {{ props.loading ? t('admin.ops.loadingText') : t('admin.ops.ready') }}
          </span>
          <span>{{ t('common.refresh') }}: {{ props.lastUpdated ? props.lastUpdated.toLocaleString(getIntlLocale(), { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-') : t('common.unknown') }}</span>
          <span v-if="props.autoRefreshEnabled && props.autoRefreshCountdown !== undefined">
            {{ t('admin.ops.autoRefreshRemaining', { seconds: props.autoRefreshCountdown }) }}
          </span>
        </p>
      </div>

      <div v-if="!props.fullscreen" class="ops-toolbar">
        <div class="ops-toolbar-filters">
          <Select
            :model-value="platform"
            :options="platformOptions"
            class="ops-toolbar-select"
            @update:model-value="handlePlatformChange"
          />

          <Select
            :model-value="groupId"
            :options="groupOptions"
            class="ops-toolbar-select"
            @update:model-value="handleGroupChange"
          />

          <Select
            :model-value="timeRange"
            :options="timeRangeOptions"
            class="ops-toolbar-select"
            @update:model-value="handleTimeRangeChange"
          />

          <Select
            v-if="false"
            :model-value="queryMode"
            :options="queryModeOptions"
            class="ops-toolbar-select"
            @update:model-value="handleQueryModeChange"
          />
        </div>

        <div class="ops-toolbar-actions">
          <button
            type="button"
            class="btn btn-secondary btn-icon"
            :disabled="loading"
            :title="t('common.refresh')"
            :aria-label="t('common.refresh')"
            @click="handleToolbarRefresh"
          >
            <svg class="h-4 w-4" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.75"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            type="button"
            class="btn btn-secondary ops-toolbar-button"
            :title="t('admin.ops.alertRules.title')"
            :aria-label="t('admin.ops.alertRules.manage')"
            @click="emit('openAlertRules')"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="hidden sm:inline">{{ t('admin.ops.alertRules.manage') }}</span>
          </button>

          <button
            type="button"
            class="btn btn-secondary ops-toolbar-button"
            :title="t('admin.ops.settings.title')"
            :aria-label="t('common.settings')"
            @click="emit('openSettings')"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="hidden sm:inline">{{ t('common.settings') }}</span>
          </button>

          <button
            type="button"
            class="btn btn-secondary btn-icon"
            :title="t('admin.ops.fullscreen.enter')"
            :aria-label="t('admin.ops.fullscreen.enter')"
            @click="emit('enterFullscreen')"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <section v-if="overview" class="ops-panel">
      <!-- Health score + realtime traffic -->
      <div class="ops-band ops-band-lead">
        <div class="ops-cell ops-health">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.systemHealth') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.healthHelp')" />
            <button v-if="!props.fullscreen" class="ops-link" type="button" :aria-describedby="diagnosisId">
              {{ t('admin.ops.diagnosis.title') }}
            </button>
          </div>

          <div class="ops-value" :class="stateClass(healthLevel)">
            <i v-if="healthLevel !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ isSystemIdle ? t('admin.ops.idleStatus') : (healthScoreValue ?? '—') }}</span>
            <small v-if="!isSystemIdle && healthScoreValue != null">/ 100</small>
          </div>

          <dl v-if="!isSystemIdle" class="ops-dl">
            <div>
              <dt>{{ t('admin.ops.health') }}</dt>
              <dd :class="stateClass(healthLevel)">
                {{
                  healthScoreValue == null
                    ? '—'
                    : healthScoreValue >= 90
                      ? t('admin.ops.healthyStatus')
                      : t('admin.ops.riskyStatus')
                }}
              </dd>
            </div>
          </dl>

          <div :id="diagnosisId" class="ops-diagnosis" role="tooltip">
            <h4>{{ t('admin.ops.diagnosis.title') }}</h4>

            <ul>
              <li v-for="(item, idx) in diagnosisReport" :key="idx">
                <svg v-if="item.type === 'critical'" class="ops-diagnosis-icon is-critical" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
                <svg v-else-if="item.type === 'warning'" class="ops-diagnosis-icon is-warning" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                <svg v-else class="ops-diagnosis-icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 100 2 1 1 0 000-2zm-1 3a1 1 0 012 0v4a1 1 0 11-2 0v-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <div>
                  <p class="ops-diagnosis-message">{{ item.message }}</p>
                  <p class="ops-diagnosis-impact">{{ item.impact }}</p>
                  <p v-if="item.action" class="ops-diagnosis-action">
                    <Icon name="lightbulb" size="xs" />
                    {{ item.action }}
                  </p>
                </div>
              </li>
            </ul>

            <p class="ops-diagnosis-footer">{{ t('admin.ops.diagnosis.footer') }}</p>
          </div>
        </div>

        <div class="ops-cell ops-realtime">
          <div class="ops-cell-head">
            <h3 class="ops-label">{{ t('admin.ops.realtime.title') }}</h3>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.qps')" />

            <div class="ops-windows">
              <button
                v-for="window in availableRealtimeWindows"
                :key="window"
                type="button"
                class="ops-window"
                :class="{ selected: realtimeWindow === window }"
                :aria-pressed="realtimeWindow === window"
                @click="realtimeWindow = window"
              >
                {{ window }}
              </button>
            </div>
          </div>

          <dl class="ops-realtime-grid">
            <div class="ops-realtime-current">
              <dt>{{ t('admin.ops.current') }}</dt>
              <dd class="ops-value">
                <span class="ops-pair">
                  <span>{{ realtimeTrafficSummary ? displayRealTimeQps.toFixed(1) : '—' }}</span>
                  <small>QPS</small>
                </span>
                <span class="ops-pair">
                  <span>{{ realtimeTrafficSummary ? displayRealTimeTps.toFixed(1) : '—' }}</span>
                  <small>{{ plainLabel('admin.ops.tps') }}</small>
                </span>
              </dd>
            </div>

            <div>
              <dt>{{ t('admin.ops.peak') }}</dt>
              <dd class="ops-realtime-secondary">
                <span class="ops-pair">
                  <span>{{ realtimeQpsPeakLabel }}</span>
                  <small>QPS</small>
                </span>
                <span class="ops-pair">
                  <span>{{ realtimeTpsPeakLabel }}</span>
                  <small>{{ plainLabel('admin.ops.tps') }}</small>
                </span>
              </dd>
            </div>

            <div>
              <dt>{{ t('admin.ops.average') }}</dt>
              <dd class="ops-realtime-secondary">
                <span class="ops-pair">
                  <span>{{ realtimeQpsAvgLabel }}</span>
                  <small>QPS</small>
                </span>
                <span class="ops-pair">
                  <span>{{ realtimeTpsAvgLabel }}</span>
                  <small>{{ plainLabel('admin.ops.tps') }}</small>
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Requests, SLA and error rates -->
      <div class="ops-band ops-band-quad">
        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.requestsTitle') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.totalRequests')" />
            <button
              v-if="!props.fullscreen"
              class="ops-link"
              type="button"
              @click="openDetails({ title: t('admin.ops.requestDetails.title') })"
            >
              {{ t('admin.ops.requestDetails.details') }}
            </button>
          </div>
          <div class="ops-value">
            <span>{{ totalRequestsLabel }}</span>
          </div>
          <dl class="ops-dl">
            <div>
              <dt>{{ t('admin.ops.tokens') }}</dt>
              <dd>{{ totalTokensLabel }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.ops.avgQps') }}</dt>
              <dd>{{ qpsAvgLabel }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.ops.avgTps') }}</dt>
              <dd>{{ tpsAvgLabel }}</dd>
            </div>
          </dl>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.sla') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.sla')" />
            <button
              v-if="!props.fullscreen"
              class="ops-link"
              type="button"
              @click="openDetails({ title: t('admin.ops.requestDetails.title'), kind: 'error' })"
            >
              {{ t('admin.ops.requestDetails.details') }}
            </button>
          </div>
          <div class="ops-value" :class="stateClass(getSLAThresholdLevel(slaPercent))">
            <i v-if="getSLAThresholdLevel(slaPercent) !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ slaPercent == null ? '—' : `${slaPercent.toFixed(3)}%` }}</span>
          </div>
          <dl class="ops-dl">
            <div>
              <dt>{{ t('admin.ops.exceptions') }}</dt>
              <dd>{{ formatNumber((overview.request_count_sla ?? 0) - (overview.success_count ?? 0)) }}</dd>
            </div>
          </dl>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.requestErrors') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.errors')" />
            <button v-if="!props.fullscreen" class="ops-link" type="button" @click="openErrorDetails('request')">
              {{ t('admin.ops.requestDetails.details') }}
            </button>
          </div>
          <div class="ops-value" :class="stateClass(getRequestErrorRateThresholdLevel(errorRatePercent))">
            <i v-if="getRequestErrorRateThresholdLevel(errorRatePercent) !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ errorRatePercent == null ? '—' : `${errorRatePercent.toFixed(2)}%` }}</span>
          </div>
          <dl class="ops-dl">
            <div>
              <dt>{{ t('admin.ops.errorCount') }}</dt>
              <dd>{{ formatNumber(overview.error_count_sla ?? 0) }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.ops.errorDetail.businessLimited') }}</dt>
              <dd>{{ formatNumber(overview.business_limited_count ?? 0) }}</dd>
            </div>
          </dl>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.upstreamErrors') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.upstreamErrors')" />
            <button v-if="!props.fullscreen" class="ops-link" type="button" @click="openErrorDetails('upstream')">
              {{ t('admin.ops.requestDetails.details') }}
            </button>
          </div>
          <div class="ops-value" :class="stateClass(getUpstreamErrorRateThresholdLevel(upstreamErrorRatePercent))">
            <i v-if="getUpstreamErrorRateThresholdLevel(upstreamErrorRatePercent) !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ upstreamErrorRatePercent == null ? '—' : `${upstreamErrorRatePercent.toFixed(2)}%` }}</span>
          </div>
          <dl class="ops-dl">
            <div>
              <dt>{{ t('admin.ops.errorCountExcl429529') }}</dt>
              <dd>{{ formatNumber(overview.upstream_error_count_excl_429_529 ?? 0) }}</dd>
            </div>
            <div>
              <dt>429/529</dt>
              <dd>{{ formatNumber((overview.upstream_429_count ?? 0) + (overview.upstream_529_count ?? 0)) }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Duration, TTFT and per-request output speed -->
      <div class="ops-band ops-band-triple">
        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.latencyDuration') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.latency')" />
            <button
              v-if="!props.fullscreen"
              class="ops-link"
              type="button"
              @click="openDetails({ title: t('admin.ops.latencyDuration'), sort: 'duration_desc' })"
            >
              {{ t('admin.ops.requestDetails.details') }}
            </button>
          </div>
          <div class="ops-value">
            <span>{{ durationP99Ms ?? '—' }}</span>
            <small>ms (P99)</small>
          </div>
          <dl class="ops-dl ops-dl-inline">
            <div v-for="row in durationBreakdown" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd><span>{{ row.value ?? '—' }}</span><small>ms</small></dd>
            </div>
          </dl>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">TTFT</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.ttft')" />
            <button
              v-if="!props.fullscreen"
              class="ops-link"
              type="button"
              @click="openDetails({ title: t('admin.ops.ttftLabel'), kind: 'success', sort: 'ttft_desc' })"
            >
              {{ t('admin.ops.requestDetails.details') }}
            </button>
          </div>
          <div class="ops-value" :class="stateClass(getTTFTThresholdLevel(ttftP99Ms))">
            <i v-if="getTTFTThresholdLevel(ttftP99Ms) !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ ttftP99Ms ?? '—' }}</span>
            <small>ms (P99)</small>
          </div>
          <dl class="ops-dl ops-dl-inline">
            <div v-for="row in ttftBreakdown" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>
                <span :class="stateClass(getTTFTThresholdLevel(row.value))">{{ row.value ?? '—' }}</span>
                <small>ms</small>
              </dd>
            </div>
          </dl>
        </div>

        <div class="ops-cell" data-testid="output-tps-card">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.outputTps') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.outputTps')" />
          </div>
          <div class="ops-value">
            <span data-testid="output-tps-p50">{{ overview.output_tps?.p50?.toFixed(1) ?? '—' }}</span>
            <small>tok/s (P50)</small>
          </div>
          <dl class="ops-dl ops-dl-inline">
            <div v-for="metric in ['p5', 'p10', 'avg'] as const" :key="metric">
              <dt>{{ metric === 'avg' ? 'Avg' : metric.toUpperCase() }}</dt>
              <dd>
                <span :data-testid="`output-tps-${metric}`">{{ overview.output_tps?.[metric]?.toFixed(1) ?? '—' }}</span>
                <small>tok/s</small>
              </dd>
            </div>
          </dl>
          <p class="ops-caption" data-testid="output-tps-samples">
            {{ t('admin.ops.outputTpsSamples', { count: overview.output_tps == null ? '—' : formatNumber(overview.output_tps.sample_count) }) }}
          </p>
        </div>
      </div>

      <!-- System resources -->
      <div class="ops-band ops-band-system">
        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">CPU</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.cpu')" />
          </div>
          <div class="ops-system-value" :class="stateClass(cpuLevel)">
            <i v-if="cpuLevel !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ cpuPercentValue == null ? '—' : `${cpuPercentValue.toFixed(1)}%` }}</span>
          </div>
          <p v-if="!props.fullscreen" class="ops-caption">
            {{ t('common.warning') }} 80% · {{ t('common.critical') }} 95%
          </p>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.memory') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.memory')" />
          </div>
          <div class="ops-system-value" :class="stateClass(memLevel)">
            <i v-if="memLevel !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ memPercentValue == null ? '—' : `${memPercentValue.toFixed(1)}%` }}</span>
          </div>
          <p v-if="!props.fullscreen" class="ops-caption">
            {{
              systemMetrics?.memory_used_mb == null || systemMetrics?.memory_total_mb == null
                ? '—'
                : `${formatMemorySizeMB(systemMetrics.memory_used_mb)} / ${formatMemorySizeMB(systemMetrics.memory_total_mb)}`
            }}
          </p>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.db') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.db')" />
          </div>
          <div class="ops-system-value" :class="stateClass(dbLevel)">
            <i v-if="dbLevel !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ dbMiddleLabel }}</span>
          </div>
          <p v-if="!props.fullscreen" class="ops-caption">
            {{ t('admin.ops.conns') }} {{ dbConnOpenValue ?? '—' }} / {{ dbMaxOpenConnsValue ?? '—' }}
            · {{ t('admin.ops.active') }} {{ dbConnActiveValue ?? '—' }}
            · {{ t('admin.ops.idle') }} {{ dbConnIdleValue ?? '—' }}
            <span v-if="dbConnWaitingValue != null"> · {{ t('admin.ops.waiting') }} {{ dbConnWaitingValue }} </span>
          </p>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">Redis</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.redis')" />
          </div>
          <div class="ops-system-value" :class="stateClass(redisLevel)">
            <i v-if="redisLevel !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ redisMiddleLabel }}</span>
          </div>
          <p v-if="!props.fullscreen" class="ops-caption">
            {{ t('admin.ops.conns') }} {{ redisConnTotalValue ?? '—' }} / {{ redisPoolSizeValue ?? '—' }}
            <span v-if="redisConnActiveValue != null"> · {{ t('admin.ops.active') }} {{ redisConnActiveValue }} </span>
            <span v-if="redisConnIdleValue != null"> · {{ t('admin.ops.idle') }} {{ redisConnIdleValue }} </span>
          </p>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.goroutines') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.goroutines')" />
          </div>
          <div class="ops-system-value" :class="stateClass(goroutineLevel)">
            <i v-if="goroutineLevel !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ goroutineStatusLabel }}</span>
          </div>
          <p v-if="!props.fullscreen" class="ops-caption">
            {{ t('admin.ops.current') }} {{ goroutineCountValue ?? '—' }}
            · {{ t('common.warning') }} {{ goroutinesWarnThreshold }}
            · {{ t('common.critical') }} {{ goroutinesCriticalThreshold }}
            <span v-if="systemMetrics?.concurrency_queue_depth != null">
              · {{ t('admin.ops.queue') }} {{ systemMetrics.concurrency_queue_depth }}
            </span>
          </p>
        </div>

        <div class="ops-cell">
          <div class="ops-cell-head">
            <span class="ops-label">{{ t('admin.ops.jobs') }}</span>
            <HelpTooltip v-if="!props.fullscreen" :content="t('admin.ops.tooltips.jobs')" />
            <button v-if="!props.fullscreen" class="ops-link" type="button" @click="openJobsDetails">
              {{ t('admin.ops.requestDetails.details') }}
            </button>
          </div>
          <div class="ops-system-value" :class="stateClass(jobsLevel)">
            <i v-if="jobsLevel !== 'normal'" class="ops-state-dot" aria-hidden="true"></i>
            <span>{{ jobsStatusLabel }}</span>
          </div>
          <p v-if="!props.fullscreen" class="ops-caption">
            {{ t('common.total') }} {{ jobHeartbeats.length }}
            · {{ t('common.warning') }} {{ jobsWarnCount }}
          </p>
        </div>
      </div>
    </section>

    <BaseDialog :show="showJobsDetails" :title="t('admin.ops.jobs')" width="wide" @close="showJobsDetails = false">
      <div v-if="!jobHeartbeats.length" class="text-sm text-[var(--text-muted)]">
        {{ t('admin.ops.noData') }}
      </div>
      <ul v-else class="ops-jobs">
        <li v-for="hb in jobHeartbeats" :key="hb.job_name">
          <div class="flex items-center justify-between gap-3">
            <div class="truncate text-sm font-semibold text-[var(--text-primary)]">{{ hb.job_name }}</div>
            <div class="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span v-if="hb.last_duration_ms != null" class="font-mono">{{ hb.last_duration_ms }}ms</span>
              <span>{{ formatTimeShort(hb.updated_at) }}</span>
            </div>
          </div>

          <div class="mt-2 grid grid-cols-1 gap-2 text-xs text-[var(--text-secondary)] sm:grid-cols-2">
            <div>
              {{ t('admin.ops.lastSuccess') }} <span class="font-mono">{{ formatTimeShort(hb.last_success_at) }}</span>
            </div>
            <div>
              {{ t('admin.ops.lastError') }} <span class="font-mono">{{ formatTimeShort(hb.last_error_at) }}</span>
            </div>
            <div>
              {{ t('admin.ops.result') }} <span class="font-mono">{{ hb.last_result || '-' }}</span>
            </div>
          </div>

          <div v-if="hb.last_error" class="ops-jobs-error">
            {{ hb.last_error }}
          </div>
        </li>
      </ul>
    </BaseDialog>

    <!-- Custom Time Range Dialog -->
    <BaseDialog :show="showCustomTimeRangeDialog" :title="t('admin.ops.timeRange.custom')" width="narrow" @close="handleCustomTimeRangeCancel">
      <div class="space-y-4">
        <div>
          <label class="input-label" :for="customStartId">
            {{ t('admin.ops.customTimeRange.startTime') }}
          </label>
          <input :id="customStartId" v-model="customStartTimeInput" type="datetime-local" class="input" />
        </div>
        <div>
          <label class="input-label" :for="customEndId">
            {{ t('admin.ops.customTimeRange.endTime') }}
          </label>
          <input :id="customEndId" v-model="customEndTimeInput" type="datetime-local" class="input" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn btn-secondary" @click="handleCustomTimeRangeCancel">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="btn btn-primary" @click="handleCustomTimeRangeConfirm">
            {{ t('common.confirm') }}
          </button>
        </div>
      </div>
    </BaseDialog>
  </div>
</template>

<style scoped>
.ops-header { --ops-critical:#c4382f; --ops-warning:#946200; color:var(--text-primary); font-size:13px; }
.dark .ops-header { --ops-critical:#f2877c; --ops-warning:#dcaa45; }

.ops-heading { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:16px 24px; margin-bottom:20px; }
.ops-heading h1 { font-size:24px; line-height:32px; font-weight:600; letter-spacing:-.02em; }
.ops-heading-meta { display:flex; flex-wrap:wrap; margin-top:4px; color:var(--text-muted); font-size:12px; line-height:18px; font-variant-numeric:tabular-nums; }
.ops-heading-meta > span + span::before { content:'·'; margin:0 8px; }
.ops-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.ops-toolbar-filters,.ops-toolbar-actions { display:flex; align-items:center; gap:8px; }
.ops-toolbar-select { width:148px; }
.ops-toolbar-button { font-size:12px; }

.ops-panel { background:var(--surface-panel); border:1px solid var(--border-default); border-radius:8px; }
.ops-band { display:grid; }
.ops-band + .ops-band { border-top:1px solid var(--border-default); }
.ops-band-lead { grid-template-columns:minmax(0,1fr) minmax(0,3fr); }
.ops-band-quad { grid-template-columns:repeat(4,minmax(0,1fr)); }
.ops-band-triple { grid-template-columns:repeat(3,minmax(0,1fr)); }
.ops-band-system { grid-template-columns:repeat(6,minmax(0,1fr)); }
.ops-cell { position:relative; min-width:0; padding:18px 20px; }
.ops-cell + .ops-cell { border-left:1px solid var(--border-default); }
.ops-band-system .ops-cell { padding:14px 20px; }

.ops-cell-head { display:flex; align-items:center; min-height:20px; }
.ops-label { color:var(--text-muted); font-size:12px; line-height:18px; font-weight:400; }
.ops-link { margin-left:auto; padding:2px 0 2px 12px; color:var(--accent-text); font-size:12px; line-height:18px; white-space:nowrap; }
.ops-link:hover { text-decoration:underline; text-underline-offset:3px; }

.ops-value { display:flex; align-items:baseline; flex-wrap:wrap; gap:0 6px; margin-top:6px; font-size:22px; line-height:30px; font-weight:550; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.ops-value small,.ops-pair small { color:var(--text-muted); font-size:12px; line-height:18px; font-weight:400; letter-spacing:normal; }
.ops-system-value { display:flex; align-items:baseline; gap:6px; margin-top:4px; font-size:15px; line-height:22px; font-weight:550; font-variant-numeric:tabular-nums; }
.ops-state-dot { align-self:center; flex-shrink:0; width:6px; height:6px; border-radius:50%; background:currentColor; }
.is-critical { color:var(--ops-critical); }
.is-warning { color:var(--ops-warning); }
.ops-caption { margin-top:4px; color:var(--text-muted); font-size:11px; line-height:17px; font-variant-numeric:tabular-nums; }

.ops-dl { display:grid; gap:4px; margin-top:12px; font-size:12px; line-height:18px; }
.ops-dl > div { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.ops-dl dt { color:var(--text-muted); }
.ops-dl dd { font-weight:500; font-variant-numeric:tabular-nums; white-space:nowrap; }
.ops-dl dd small { color:var(--text-muted); font-size:11px; font-weight:400; }
.ops-dl-inline dd { display:inline-flex; align-items:baseline; gap:4px; }
.ops-dl-inline { grid-template-columns:repeat(3,minmax(0,1fr)); column-gap:16px; }
.ops-dl-inline > div { justify-content:flex-start; gap:6px; }
.ops-dl-inline + .ops-caption { margin-top:8px; }

.ops-windows { display:flex; gap:2px; margin-left:auto; }
.ops-window { border-radius:4px; padding:2px 8px; color:var(--text-secondary); font-size:12px; line-height:18px; font-variant-numeric:tabular-nums; transition:background .15s,color .15s; }
.ops-window:hover { color:var(--text-primary); }
.ops-window.selected { background:var(--surface-hover); color:var(--text-primary); font-weight:500; }
.ops-realtime-grid { display:flex; align-items:flex-end; flex-wrap:wrap; gap:12px 40px; margin-top:6px; }
.ops-realtime-grid dt { color:var(--text-muted); font-size:11px; line-height:17px; }
.ops-realtime-grid .ops-value { margin-top:0; gap:0 20px; }
.ops-realtime-secondary { display:flex; flex-wrap:wrap; gap:0 14px; font-size:13px; line-height:30px; font-weight:500; font-variant-numeric:tabular-nums; }
.ops-pair { display:inline-flex; align-items:baseline; gap:5px; }

.ops-diagnosis { position:absolute; z-index:50; top:calc(100% - 8px); left:16px; width:300px; max-width:calc(100vw - 64px); padding:14px 16px; background:var(--surface-raised); border:1px solid var(--border-default); border-radius:8px; box-shadow:0 8px 24px -8px rgb(0 0 0 / .28); opacity:0; visibility:hidden; pointer-events:none; transition:opacity .15s,visibility .15s; }
.ops-health:hover .ops-diagnosis,.ops-health:focus-within .ops-diagnosis { opacity:1; visibility:visible; pointer-events:auto; }
.ops-diagnosis h4 { padding-bottom:8px; border-bottom:1px solid var(--border-default); font-size:13px; line-height:20px; font-weight:600; }
.ops-diagnosis ul { display:grid; gap:12px; margin-top:12px; }
.ops-diagnosis li { display:flex; gap:10px; }
.ops-diagnosis-icon { flex-shrink:0; width:16px; height:16px; margin-top:1px; color:var(--text-muted); }
.ops-diagnosis-icon.is-critical { color:var(--ops-critical); }
.ops-diagnosis-icon.is-warning { color:var(--ops-warning); }
.ops-diagnosis-message { font-size:12px; line-height:18px; font-weight:550; }
.ops-diagnosis-impact { margin-top:2px; color:var(--text-secondary); font-size:11px; line-height:17px; }
.ops-diagnosis-action { display:flex; align-items:flex-start; gap:4px; margin-top:4px; color:var(--accent-text); font-size:11px; line-height:17px; }
.ops-diagnosis-footer { margin-top:12px; padding-top:8px; border-top:1px solid var(--border-default); color:var(--text-muted); font-size:11px; line-height:17px; }

.ops-jobs { display:grid; }
.ops-jobs li { padding:14px 0; }
.ops-jobs li:first-child { padding-top:0; }
.ops-jobs li + li { border-top:1px solid var(--border-default); }
.ops-jobs-error { margin-top:10px; padding:8px 10px; border:1px solid var(--border-default); border-radius:6px; color:var(--ops-critical); font-size:12px; line-height:18px; overflow-wrap:anywhere; }

.is-fullscreen .ops-heading h1 { font-size:28px; line-height:36px; }
.is-fullscreen .ops-cell { padding:24px 28px; }
.is-fullscreen .ops-label { font-size:14px; line-height:22px; }
.is-fullscreen .ops-value { font-size:36px; line-height:46px; }
.is-fullscreen .ops-value small,.is-fullscreen .ops-pair small { font-size:14px; }
.is-fullscreen .ops-system-value { font-size:22px; line-height:30px; }
.is-fullscreen .ops-dl,.is-fullscreen .ops-caption,.is-fullscreen .ops-realtime-grid dt { font-size:14px; line-height:22px; }
.is-fullscreen .ops-realtime-secondary { font-size:18px; line-height:46px; }

@media(max-width:1180px) {
  .ops-band-lead { grid-template-columns:minmax(0,1fr); }
  .ops-band-lead .ops-cell + .ops-cell { border-left:0; border-top:1px solid var(--border-default); }
  .ops-band-quad { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .ops-band-quad .ops-cell:nth-child(odd) { border-left:0; }
  .ops-band-quad .ops-cell:nth-child(n+3) { border-top:1px solid var(--border-default); }
  .ops-band-system { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .ops-band-system .ops-cell:nth-child(3n+1) { border-left:0; }
  .ops-band-system .ops-cell:nth-child(n+4) { border-top:1px solid var(--border-default); }
}
@media(max-width:900px) {
  .ops-band-triple { grid-template-columns:minmax(0,1fr); }
  .ops-band-triple .ops-cell + .ops-cell { border-left:0; border-top:1px solid var(--border-default); }
}
@media(max-width:640px) {
  .ops-heading { align-items:stretch; flex-direction:column; margin-bottom:16px; }
  .ops-heading h1 { font-size:22px; line-height:30px; }
  .ops-toolbar-filters { flex:1 1 100%; flex-wrap:wrap; }
  .ops-toolbar-select { flex:1 1 132px; width:auto; }
  .ops-cell,.ops-band-system .ops-cell { padding:14px 16px; }
  .ops-band-quad { grid-template-columns:minmax(0,1fr); }
  .ops-band-quad .ops-cell + .ops-cell { border-left:0; border-top:1px solid var(--border-default); }
  .ops-band-system { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .ops-band-system .ops-cell:nth-child(3n+1) { border-left:1px solid var(--border-default); }
  .ops-band-system .ops-cell:nth-child(odd) { border-left:0; }
  .ops-band-system .ops-cell:nth-child(n+3) { border-top:1px solid var(--border-default); }
  .ops-realtime-grid { gap:10px 28px; }
  .ops-realtime-current { flex:1 1 100%; }
}
@media(prefers-reduced-motion:reduce) {
  .ops-window,.ops-diagnosis { transition:none; }
}
</style>
