<template>
  <MetricStrip :items="metricItems" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MetricStrip, { type MetricStripItem } from '@/components/charts/MetricStrip.vue'
import type { CurrencyAmounts, DashboardStats } from '@/types/payment'

const { t } = useI18n()

const props = defineProps<{
  stats: DashboardStats
}>()

const metricItems = computed<MetricStripItem[]>(() => [
  { key: 'todayRevenue', label: t('payment.admin.todayRevenue'), value: moneyLines(props.stats.today_amount), detail: `${props.stats.today_count} ${t('payment.admin.orders')}` },
  { key: 'totalRevenue', label: t('payment.admin.totalRevenue'), value: moneyLines(props.stats.total_amount), detail: `${props.stats.total_count} ${t('payment.admin.orders')}` },
  { key: 'todayOrders', label: t('payment.admin.todayOrders'), value: String(props.stats.today_count) },
  { key: 'avgAmount', label: t('payment.admin.avgAmount'), value: moneyLines(props.stats.avg_amount) },
])

function sortedAmounts(amounts: CurrencyAmounts): [string, number][] {
  return Object.entries(amounts).sort(([left], [right]) => left.localeCompare(right))
}

function formatMoney(currency: string, amount: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
}

function moneyLines(amounts: CurrencyAmounts): string[] {
  return sortedAmounts(amounts).map(([currency, amount]) => formatMoney(currency, amount))
}
</script>
