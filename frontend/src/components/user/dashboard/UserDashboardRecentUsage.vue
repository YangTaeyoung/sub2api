<template>
  <section class="card recent-panel">
    <header class="recent-header">
      <h2>{{ t('dashboard.recentUsage') }}</h2>
      <span v-if="periodLabel">{{ periodLabel }}</span>
    </header>
    <div v-if="loading" class="recent-loading" aria-busy="true" :aria-label="t('common.loading')">
      <div v-for="index in 3" :key="index" class="skeleton" />
    </div>
    <div v-else-if="data.length === 0" class="py-8">
      <EmptyState :title="t('dashboard.noUsageRecords')" :description="t('dashboard.startUsingApi')" />
    </div>
    <template v-else>
      <ul class="recent-list">
        <li v-for="log in data" :key="log.id">
          <div class="recent-main">
            <p class="recent-model">{{ log.model }}</p>
            <p class="recent-meta">{{ formatDateTime(log.created_at) }}</p>
          </div>
          <div class="recent-figures">
            <p>
              <span class="recent-cost" :title="t('dashboard.actual')">${{ formatCost(log.actual_cost) }}</span>
              <span class="recent-standard" :title="t('dashboard.standard')"> / ${{ formatCost(log.total_cost) }}</span>
            </p>
            <p class="recent-meta">{{ (log.input_tokens + log.output_tokens).toLocaleString(getIntlLocale()) }} {{ t('dashboard.tokens') }}</p>
          </div>
        </li>
      </ul>
      <router-link to="/usage" class="recent-link">
        {{ t('dashboard.viewAllUsage') }}
        <Icon name="arrowRight" size="sm" />
      </router-link>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIntlLocale } from '@/i18n'
import EmptyState from '@/components/common/EmptyState.vue'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTime } from '@/utils/format'
import type { UsageLog } from '@/types'

const props = defineProps<{
  data: UsageLog[]
  loading: boolean
  startDate?: string
  endDate?: string
}>()
const { t } = useI18n()
const formatCost = (c: number) => c.toFixed(4)

const periodLabel = computed(() => {
  if (!props.startDate || !props.endDate) return ''
  const formatter = new Intl.DateTimeFormat(getIntlLocale(), { month: 'short', day: 'numeric' })
  const start = formatter.format(new Date(props.startDate + 'T00:00:00'))
  return props.startDate === props.endDate ? start : `${start} – ${formatter.format(new Date(props.endDate + 'T00:00:00'))}`
})
</script>

<style scoped>
.recent-panel { color:var(--text-primary); font-size:13px; }
.recent-header { display:flex; align-items:baseline; justify-content:space-between; gap:12px; padding:16px 16px 12px; }
.recent-header h2 { font-size:13px; line-height:20px; font-weight:600; }
.recent-header span { color:var(--text-muted); font-size:12px; font-variant-numeric:tabular-nums; }
.recent-loading { display:grid; gap:12px; padding:4px 16px 16px; }
.recent-loading .skeleton { height:40px; }
.recent-list li { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:11px 16px; border-top:1px solid var(--border-default); }
.recent-main { min-width:0; }
.recent-model { overflow:hidden; font-weight:500; line-height:20px; text-overflow:ellipsis; white-space:nowrap; }
.recent-meta { color:var(--text-muted); font-size:12px; line-height:18px; font-variant-numeric:tabular-nums; }
.recent-figures { flex-shrink:0; text-align:right; font-variant-numeric:tabular-nums; line-height:20px; }
.recent-cost { font-weight:550; }
.recent-standard { color:var(--text-muted); }
.recent-link { display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border-top:1px solid var(--border-default); color:var(--text-secondary); font-size:12px; }
.recent-link:hover { color:var(--accent-primary); }
</style>
