<template>
  <dl class="metric-strip">
    <div v-for="item in items" :key="item.key" class="metric-cell" :data-metric="item.key">
      <dt>{{ item.label }}</dt>
      <dd>
        <span v-for="(value, index) in valuesOf(item)" :key="index" class="metric-value">{{ value }}<small v-if="item.unit">{{ item.unit }}</small></span>
        <span v-if="item.detail || $slots[`detail-${item.key}`]" class="metric-detail">
          <slot :name="`detail-${item.key}`">{{ item.detail }}</slot>
        </span>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
export interface MetricStripItem {
  key: string
  label: string
  value: string | string[]
  unit?: string
  detail?: string
}

defineProps<{ items: MetricStripItem[] }>()

const valuesOf = (item: MetricStripItem): string[] => Array.isArray(item.value) ? item.value : [item.value]
</script>

<style scoped>
.metric-strip { display:flex; flex-wrap:wrap; gap:1px; overflow:hidden; border:1px solid var(--border-default); border-radius:8px; background:var(--border-default); color:var(--text-primary); word-break:keep-all; }
.metric-cell { flex:1 1 calc(25% - 1px); min-width:148px; padding:14px 16px 13px; background:var(--surface-panel); }
.metric-cell dt { color:var(--text-muted); font-size:12px; line-height:18px; }
.metric-cell dd { display:flex; flex-direction:column; margin-top:4px; }
.metric-value { font-size:20px; line-height:28px; font-weight:550; letter-spacing:-.02em; font-variant-numeric:tabular-nums; }
.metric-value small { margin-left:5px; color:var(--text-muted); font-size:11px; font-weight:400; letter-spacing:0; }
.metric-detail { display:flex; flex-wrap:wrap; gap:0 10px; margin-top:4px; color:var(--text-muted); font-size:11px; line-height:18px; font-variant-numeric:tabular-nums; }
.metric-detail :slotted(.metric-part) { white-space:nowrap; }
.metric-detail :slotted(.metric-part b) { color:var(--text-secondary); font-weight:500; }
@media(max-width:640px) { .metric-cell { padding:12px 14px; } }
</style>
