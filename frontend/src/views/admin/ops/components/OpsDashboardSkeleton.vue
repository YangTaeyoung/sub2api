<script setup lang="ts">
interface Props {
  fullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fullscreen: false
})
</script>

<template>
  <div class="ops-skeleton space-y-6" aria-hidden="true">
    <div>
      <div class="ops-skeleton-heading">
        <div class="space-y-2">
          <div class="skeleton h-7 w-40"></div>
          <div v-if="!props.fullscreen" class="skeleton h-3 w-72 max-w-full"></div>
        </div>
        <div v-if="!props.fullscreen" class="flex flex-wrap items-center gap-2">
          <div v-for="i in 3" :key="i" class="skeleton h-8 w-[148px]"></div>
          <div class="skeleton h-8 w-8"></div>
          <div class="skeleton h-8 w-28"></div>
          <div class="skeleton h-8 w-20"></div>
          <div class="skeleton h-8 w-8"></div>
        </div>
      </div>

      <div class="ops-skeleton-panel">
        <div class="ops-skeleton-band lead">
          <div v-for="i in 2" :key="i" class="ops-skeleton-cell">
            <div class="skeleton h-3 w-20"></div>
            <div class="skeleton mt-3 h-6 w-24"></div>
            <div class="skeleton mt-4 h-3 w-32 max-w-full"></div>
          </div>
        </div>
        <div class="ops-skeleton-band quad">
          <div v-for="i in 4" :key="i" class="ops-skeleton-cell">
            <div class="skeleton h-3 w-20"></div>
            <div class="skeleton mt-3 h-6 w-24"></div>
            <div class="skeleton mt-4 h-3 w-full"></div>
            <div class="skeleton mt-2 h-3 w-2/3"></div>
          </div>
        </div>
        <div class="ops-skeleton-band triple">
          <div v-for="i in 3" :key="i" class="ops-skeleton-cell">
            <div class="skeleton h-3 w-20"></div>
            <div class="skeleton mt-3 h-6 w-28"></div>
            <div class="skeleton mt-4 h-3 w-full"></div>
            <div class="skeleton mt-2 h-3 w-2/3"></div>
          </div>
        </div>
        <div class="ops-skeleton-band system">
          <div v-for="i in 6" :key="i" class="ops-skeleton-cell">
            <div class="skeleton h-3 w-12"></div>
            <div class="skeleton mt-2 h-5 w-16"></div>
            <div v-if="!props.fullscreen" class="skeleton mt-2 h-3 w-full"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div class="ops-skeleton-card min-h-[360px] lg:col-span-1">
        <div class="skeleton h-4 w-40 max-w-full"></div>
        <div class="skeleton mt-6 h-72"></div>
      </div>
      <div class="ops-skeleton-card min-h-[360px] lg:col-span-1">
        <div class="skeleton h-4 w-40 max-w-full"></div>
        <div class="skeleton mt-6 h-72"></div>
      </div>
      <div class="ops-skeleton-card min-h-[360px] lg:col-span-2">
        <div class="skeleton h-4 w-56 max-w-full"></div>
        <div class="skeleton mt-6 h-72"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div v-for="i in 3" :key="i" class="ops-skeleton-card">
        <div class="skeleton h-4 w-40 max-w-full"></div>
        <div class="skeleton mt-6 h-56"></div>
      </div>
    </div>

    <div class="ops-skeleton-card">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="skeleton h-4 w-48"></div>
        <div v-if="!props.fullscreen" class="flex flex-wrap items-center gap-2">
          <div v-for="i in 3" :key="i" class="skeleton h-8 w-[120px]"></div>
        </div>
      </div>

      <div class="ops-skeleton-rows">
        <div v-for="i in 6" :key="i">
          <div class="flex-1 space-y-2">
            <div class="skeleton h-3 w-56 max-w-full"></div>
            <div class="skeleton h-3 w-80 max-w-full"></div>
          </div>
          <div class="skeleton h-6 w-16"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ops-skeleton-heading { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:16px 24px; margin-bottom:20px; }
.ops-skeleton-panel,.ops-skeleton-card { background:var(--surface-panel); border:1px solid var(--border-default); border-radius:8px; }
.ops-skeleton-card { padding:20px; }
.ops-skeleton-band { display:grid; }
.ops-skeleton-band + .ops-skeleton-band { border-top:1px solid var(--border-default); }
.ops-skeleton-band.lead { grid-template-columns:minmax(0,1fr) minmax(0,3fr); }
.ops-skeleton-band.quad { grid-template-columns:repeat(4,minmax(0,1fr)); }
.ops-skeleton-band.triple { grid-template-columns:repeat(3,minmax(0,1fr)); }
.ops-skeleton-band.system { grid-template-columns:repeat(6,minmax(0,1fr)); }
.ops-skeleton-cell { min-width:0; padding:18px 20px; }
.ops-skeleton-cell + .ops-skeleton-cell { border-left:1px solid var(--border-default); }
.ops-skeleton-rows { margin-top:16px; }
.ops-skeleton-rows > div { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 0; border-top:1px solid var(--border-default); }
@media(max-width:1180px) {
  .ops-skeleton-band.lead { grid-template-columns:minmax(0,1fr); }
  .ops-skeleton-band.lead .ops-skeleton-cell + .ops-skeleton-cell { border-left:0; border-top:1px solid var(--border-default); }
  .ops-skeleton-band.quad { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .ops-skeleton-band.quad .ops-skeleton-cell:nth-child(odd) { border-left:0; }
  .ops-skeleton-band.quad .ops-skeleton-cell:nth-child(n+3) { border-top:1px solid var(--border-default); }
  .ops-skeleton-band.system { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .ops-skeleton-band.system .ops-skeleton-cell:nth-child(3n+1) { border-left:0; }
  .ops-skeleton-band.system .ops-skeleton-cell:nth-child(n+4) { border-top:1px solid var(--border-default); }
}
@media(max-width:900px) {
  .ops-skeleton-band.triple { grid-template-columns:minmax(0,1fr); }
  .ops-skeleton-band.triple .ops-skeleton-cell + .ops-skeleton-cell { border-left:0; border-top:1px solid var(--border-default); }
}
@media(max-width:640px) {
  .ops-skeleton-heading { align-items:stretch; flex-direction:column; margin-bottom:16px; }
  .ops-skeleton-cell { padding:14px 16px; }
  .ops-skeleton-card { padding:16px; }
  .ops-skeleton-band.quad { grid-template-columns:minmax(0,1fr); }
  .ops-skeleton-band.quad .ops-skeleton-cell + .ops-skeleton-cell { border-left:0; border-top:1px solid var(--border-default); }
  .ops-skeleton-band.system { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .ops-skeleton-band.system .ops-skeleton-cell:nth-child(3n+1) { border-left:1px solid var(--border-default); }
  .ops-skeleton-band.system .ops-skeleton-cell:nth-child(odd) { border-left:0; }
  .ops-skeleton-band.system .ops-skeleton-cell:nth-child(n+3) { border-top:1px solid var(--border-default); }
}
</style>
