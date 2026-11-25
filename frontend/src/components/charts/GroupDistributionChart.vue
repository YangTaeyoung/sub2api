<template>
  <DistributionRankPanel
    :title="t('admin.dashboard.groupDistribution')"
    :name-label="t('admin.dashboard.group')"
    :rows="rows"
    :metric="metric"
    :loading="loading"
    :show-metric-toggle="showMetricToggle"
    :show-account-cost="showAccountCost"
    :expanded-key="expandedKey"
    :breakdown-items="breakdownItems"
    :breakdown-loading="breakdownLoading"
    @update:metric="emit('update:metric', $event)"
    @toggle="toggleBreakdown"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import DistributionRankPanel, { type DistributionRankRow } from './DistributionRankPanel.vue'
import type { GroupStat, UserBreakdownItem } from '@/types'
import { getUserBreakdown } from '@/api/admin/dashboard'

const { t } = useI18n()

type DistributionMetric = 'tokens' | 'actual_cost'

const props = withDefaults(defineProps<{
  groupStats: GroupStat[]
  loading?: boolean
  metric?: DistributionMetric
  showMetricToggle?: boolean
  enableBreakdown?: boolean
  showAccountCost?: boolean
  startDate?: string
  endDate?: string
  filters?: Record<string, any>
}>(), {
  loading: false,
  metric: 'tokens',
  showMetricToggle: false,
  enableBreakdown: true,
  showAccountCost: true,
})

const emit = defineEmits<{
  'update:metric': [value: DistributionMetric]
}>()

const expandedKey = ref<string | null>(null)
const breakdownItems = ref<UserBreakdownItem[]>([])
const breakdownLoading = ref(false)

const toggleBreakdown = async (key: string) => {
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
      group_id: Number(key),
    })
    breakdownItems.value = res.users || []
  } catch {
    breakdownItems.value = []
  } finally {
    breakdownLoading.value = false
  }
}

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const rows = computed<DistributionRankRow[]>(() => {
  if (!props.groupStats?.length) return []

  const metricKey = props.metric === 'actual_cost' ? 'actual_cost' : 'total_tokens'
  return [...props.groupStats]
    .sort((a, b) => toFiniteNumber(b[metricKey]) - toFiniteNumber(a[metricKey]))
    .map((group) => ({
      key: String(group.group_id),
      label: group.group_name || t('admin.dashboard.noGroup'),
      title: group.group_name || String(group.group_id),
      requests: group.requests,
      total_tokens: group.total_tokens,
      actual_cost: group.actual_cost,
      account_cost: group.account_cost,
      cost: group.cost,
      expandable: props.enableBreakdown && group.group_id > 0,
    }))
})
</script>
