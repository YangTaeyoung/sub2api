<template>
  <div class="breakdown">
    <div v-if="loading" class="breakdown-state">
      <LoadingSpinner />
    </div>
    <div v-else-if="items.length === 0" class="breakdown-state">
      {{ t('admin.dashboard.noDataAvailable') }}
    </div>
    <table v-else>
      <tbody>
        <tr v-for="user in items" :key="user.user_id">
          <td class="breakdown-user" :title="user.email">
            {{ user.email || `User #${user.user_id}` }}
          </td>
          <td>{{ user.requests.toLocaleString() }}</td>
          <td>{{ formatTokens(user.total_tokens) }}</td>
          <td class="breakdown-primary">${{ formatCost(user.actual_cost) }}</td>
          <td v-if="showAccountCost">${{ formatCost(user.account_cost) }}</td>
          <td class="breakdown-muted">${{ formatCost(user.cost) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { UserBreakdownItem } from '@/types'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  items: UserBreakdownItem[]
  loading?: boolean
  showAccountCost?: boolean
}>(), {
  loading: false,
  showAccountCost: true,
})

const showAccountCost = computed(() => props.showAccountCost)

const formatTokens = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  return value.toLocaleString()
}

const formatCost = (value: number | undefined | null): string => {
  if (value == null) return '0.0000'
  if (value >= 1000) return (value / 1000).toFixed(2) + 'K'
  if (value >= 1) return value.toFixed(2)
  if (value >= 0.01) return value.toFixed(3)
  return value.toFixed(4)
}
</script>

<style scoped>
.breakdown { background:var(--surface-canvas); font-size:12px; font-variant-numeric:tabular-nums; }
.breakdown-state { display:flex; align-items:center; justify-content:center; padding:10px 0; color:var(--text-muted); }
.breakdown table { width:100%; border-collapse:collapse; }
.breakdown tr + tr td { border-top:1px solid var(--border-default); }
.breakdown td { padding:6px 8px; color:var(--text-secondary); text-align:right; white-space:nowrap; }
.breakdown td.breakdown-user { max-width:160px; overflow:hidden; padding-left:20px; text-align:left; text-overflow:ellipsis; }
.breakdown td.breakdown-primary { color:var(--text-primary); }
.breakdown td.breakdown-muted { color:var(--text-muted); }
</style>
