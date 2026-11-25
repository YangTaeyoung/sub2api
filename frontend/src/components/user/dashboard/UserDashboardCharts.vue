<template>
  <div class="space-y-4">
    <div class="dashboard-toolbar">
      <div class="dashboard-toolbar-field">
        <span>{{ t('dashboard.timeRange') }}</span>
        <DateRangePicker :start-date="startDate" :end-date="endDate" @update:startDate="$emit('update:startDate', $event)" @update:endDate="$emit('update:endDate', $event)" @change="$emit('dateRangeChange', $event)" />
      </div>
      <button type="button" class="btn btn-secondary dashboard-refresh" :disabled="loading" @click="$emit('refresh')">
        <Icon name="refresh" size="sm" :class="{ 'animate-spin': loading }" />
        <span>{{ t('common.refresh') }}</span>
      </button>
      <div class="dashboard-toolbar-field dashboard-toolbar-end">
        <span>{{ t('dashboard.granularity') }}</span>
        <div class="w-24">
          <Select :model-value="granularity" :options="[{value:'day', label:t('dashboard.day')}, {value:'hour', label:t('dashboard.hour')}]" :aria-label="t('dashboard.granularity')" @update:model-value="$emit('update:granularity', $event)" @change="$emit('granularityChange')" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ModelDistributionChart :model-stats="models" :loading="loading" :enable-breakdown="false" :show-account-cost="false" />
      <TokenUsageTrend :trend-data="trend" :loading="loading" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import Select from '@/components/common/Select.vue'
import Icon from '@/components/icons/Icon.vue'
import ModelDistributionChart from '@/components/charts/ModelDistributionChart.vue'
import TokenUsageTrend from '@/components/charts/TokenUsageTrend.vue'
import type { TrendDataPoint, ModelStat } from '@/types'

defineProps<{ loading: boolean, startDate: string, endDate: string, granularity: string, trend: TrendDataPoint[], models: ModelStat[] }>()
defineEmits(['update:startDate', 'update:endDate', 'update:granularity', 'dateRangeChange', 'granularityChange', 'refresh'])
const { t } = useI18n()
</script>

<style scoped>
.dashboard-toolbar { display:flex; flex-wrap:wrap; align-items:center; gap:8px 12px; }
.dashboard-toolbar-field { display:flex; align-items:center; gap:8px; color:var(--text-muted); font-size:12px; }
.dashboard-toolbar-end { margin-left:auto; }
.dashboard-refresh { gap:7px; min-height:32px; padding-inline:10px; font-size:12px; }
</style>
