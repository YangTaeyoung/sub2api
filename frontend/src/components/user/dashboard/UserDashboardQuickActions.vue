<template>
  <nav class="card quick-panel" :aria-label="t('dashboard.quickActions')">
    <h2>{{ t('dashboard.quickActions') }}</h2>
    <RouterLink v-for="action in actions" :key="action.to" :to="action.to" class="quick-link">
      <span>{{ action.label }}</span>
      <Icon name="arrowRight" size="sm" />
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import { useBatchImageAccess } from '@/composables/useBatchImageAccess'
const { t } = useI18n()
const { canUseBatchImage, refreshBatchImageAccess } = useBatchImageAccess()

const actions = computed(() => [
  { to: '/keys', label: t('dashboard.createApiKey') },
  { to: '/usage', label: t('dashboard.viewUsage') },
  ...(canUseBatchImage.value ? [{ to: '/batch-image', label: t('dashboard.batchImageAgent') }] : []),
  { to: '/redeem', label: t('dashboard.redeemCode') },
])

onMounted(() => {
  void refreshBatchImageAccess()
})
</script>

<style scoped>
.quick-panel { color:var(--text-primary); }
.quick-panel h2 { padding:16px 16px 12px; font-size:13px; line-height:20px; font-weight:600; }
.quick-link { display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:44px; padding:11px 16px; border-top:1px solid var(--border-default); color:var(--text-secondary); font-size:13px; line-height:20px; transition:background .15s,color .15s; }
.quick-link:last-child { border-radius:0 0 7px 7px; }
.quick-link svg { flex-shrink:0; color:var(--text-muted); }
.quick-link:hover { background:var(--surface-canvas); color:var(--text-primary); }
.quick-link:hover svg { color:var(--accent-primary); }
@media(prefers-reduced-motion:reduce) { .quick-link { transition:none; } }
</style>
