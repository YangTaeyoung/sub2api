<template>
  <DistributionRankPanel
    :title="title || t('usage.endpointDistribution')"
    :name-label="t('usage.endpoint')"
    :rows="rows"
    :metric="metric"
    :loading="loading"
    :show-metric-toggle="showMetricToggle"
    :show-account-cost="showAccountCost"
    :source-options="showSourceToggle ? sourceOptions : []"
    :source="source"
    :expanded-key="expandedKey"
    :breakdown-items="breakdownItems"
    :breakdown-loading="breakdownLoading"
    @update:metric="emit('update:metric', $event)"
    @update:source="emit('update:source', $event as EndpointSource)"
    @toggle="toggleBreakdown"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DistributionRankPanel, { type DistributionRankRow } from './DistributionRankPanel.vue'
import type { EndpointStat, UserBreakdownItem } from '@/types'
import { getUserBreakdown } from '@/api/admin/dashboard'

const { t } = useI18n()

type DistributionMetric = 'tokens' | 'actual_cost'
type EndpointSource = 'inbound' | 'upstream' | 'path'

const props = withDefaults(
  defineProps<{
    endpointStats: EndpointStat[]
    upstreamEndpointStats?: EndpointStat[]
    endpointPathStats?: EndpointStat[]
    loading?: boolean
    title?: string
    metric?: DistributionMetric
    source?: EndpointSource
    showMetricToggle?: boolean
    showSourceToggle?: boolean
    enableBreakdown?: boolean
    showAccountCost?: boolean
    startDate?: string
    endDate?: string
    filters?: Record<string, any>
  }>(),
  {
    upstreamEndpointStats: () => [],
    endpointPathStats: () => [],
    loading: false,
    title: '',
    metric: 'tokens',
    source: 'inbound',
    showMetricToggle: false,
    showSourceToggle: false,
    enableBreakdown: true,
    showAccountCost: true
  }
)

const emit = defineEmits<{
  'update:metric': [value: DistributionMetric]
  'update:source': [value: EndpointSource]
}>()

const sourceOptions = computed(() => [
  { value: 'inbound', label: t('usage.inbound') },
  { value: 'upstream', label: t('usage.upstream') },
  { value: 'path', label: t('usage.path') },
])

const expandedKey = ref<string | null>(null)
const breakdownItems = ref<UserBreakdownItem[]>([])
const breakdownLoading = ref(false)

const toggleBreakdown = async (endpoint: string) => {
  if (expandedKey.value === endpoint) {
    expandedKey.value = null
    return
  }
  expandedKey.value = endpoint
  breakdownLoading.value = true
  breakdownItems.value = []
  try {
    const res = await getUserBreakdown({
      ...props.filters,
      start_date: props.startDate,
      end_date: props.endDate,
      endpoint,
      endpoint_type: props.source,
    })
    breakdownItems.value = res.users || []
  } catch {
    breakdownItems.value = []
  } finally {
    breakdownLoading.value = false
  }
}

const rows = computed<DistributionRankRow[]>(() => {
  const sourceStats = props.source === 'upstream'
    ? props.upstreamEndpointStats
    : props.source === 'path'
      ? props.endpointPathStats
      : props.endpointStats
  if (!sourceStats?.length) return []

  const metricKey = props.metric === 'actual_cost' ? 'actual_cost' : 'total_tokens'
  return [...sourceStats]
    .sort((a, b) => b[metricKey] - a[metricKey])
    .map((item) => ({
      key: item.endpoint,
      label: item.endpoint,
      requests: item.requests,
      total_tokens: item.total_tokens,
      actual_cost: item.actual_cost,
      account_cost: item.account_cost,
      cost: item.cost,
      expandable: props.enableBreakdown,
    }))
})
</script>
