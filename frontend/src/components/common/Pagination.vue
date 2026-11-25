<template>
  <div class="pagination-bar">
    <div class="flex flex-1 items-center justify-between sm:hidden">
      <button
        @click="goToPage(page - 1)"
        :disabled="page === 1"
        class="pagination-step"
      >
        {{ t('pagination.previous') }}
      </button>
      <span class="pagination-summary">
        {{ t('pagination.pageOf', { page, total: totalPages }) }}
      </span>
      <button
        @click="goToPage(page + 1)"
        :disabled="page === totalPages"
        class="pagination-step"
      >
        {{ t('pagination.next') }}
      </button>
    </div>

    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <p class="pagination-summary">
          {{ t('pagination.summary', { from: fromItem, to: toItem, total }) }}
        </p>

        <div v-if="showPageSizeSelector" class="flex items-center gap-2">
          <span class="pagination-summary">{{ t('pagination.perPage') }}</span>
          <div class="page-size-select w-20">
            <Select
              :model-value="pageSize"
              :options="pageSizeSelectOptions"
              @update:model-value="handlePageSizeChange"
            />
          </div>
        </div>

        <div v-if="showJump" class="flex items-center gap-2">
          <span class="pagination-summary">{{ t('pagination.jumpTo') }}</span>
          <input
            v-model="jumpPage"
            type="number"
            min="1"
            :max="totalPages"
            class="input w-20 text-sm"
            :placeholder="t('pagination.jumpPlaceholder')"
            @keyup.enter="submitJump"
          />
          <button type="button" class="btn btn-ghost btn-sm" @click="submitJump">
            {{ t('pagination.jumpAction') }}
          </button>
        </div>
      </div>

      <nav v-if="totalPages > 1" class="flex items-center gap-1" aria-label="Pagination">
        <button
          @click="goToPage(page - 1)"
          :disabled="page === 1"
          class="pagination-page"
          :aria-label="t('pagination.previous')"
        >
          <Icon name="chevronLeft" size="sm" />
        </button>

        <button
          v-for="(pageNum, index) in visiblePages"
          :key="`${pageNum}-${index}`"
          @click="typeof pageNum === 'number' && goToPage(pageNum)"
          :disabled="typeof pageNum !== 'number'"
          :class="[
            'pagination-page',
            pageNum === page && 'pagination-page-current',
            typeof pageNum !== 'number' && 'cursor-default'
          ]"
          :aria-label="
            typeof pageNum === 'number' ? t('pagination.goToPage', { page: pageNum }) : undefined
          "
          :aria-current="pageNum === page ? 'page' : undefined"
        >
          {{ pageNum }}
        </button>

        <button
          @click="goToPage(page + 1)"
          :disabled="page === totalPages"
          class="pagination-page"
          :aria-label="t('pagination.next')"
        >
          <Icon name="chevronRight" size="sm" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import Select from './Select.vue'
import { getConfiguredTablePageSizeOptions, normalizeTablePageSize } from '@/utils/tablePreferences'
import { setPersistedPageSize } from '@/composables/usePersistedPageSize'

const { t } = useI18n()

interface Props {
  total: number
  page: number
  pageSize: number
  pageSizeOptions?: number[]
  showPageSizeSelector?: boolean
  showJump?: boolean
}

interface Emits {
  (e: 'update:page', page: number): void
  (e: 'update:pageSize', pageSize: number): void
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => getConfiguredTablePageSizeOptions(),
  showPageSizeSelector: true,
  showJump: false
})

const emit = defineEmits<Emits>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

const fromItem = computed(() => {
  if (props.total === 0) return 0
  return (props.page - 1) * props.pageSize + 1
})

const toItem = computed(() => {
  const to = props.page * props.pageSize
  return to > props.total ? props.total : to
})

const pageSizeSelectOptions = computed(() => {
  const options = Array.from(
    new Set([
      ...getConfiguredTablePageSizeOptions(),
      normalizeTablePageSize(props.pageSize)
    ])
  ).sort((a, b) => a - b)

  return options.map((size) => ({
    value: size,
    label: String(size)
  }))
})

const jumpPage = ref('')

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const maxVisible = 7
  const total = totalPages.value

  if (total <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    const start = Math.max(2, props.page - 2)
    const end = Math.min(total - 1, props.page + 2)

    // Add ellipsis before if needed
    if (start > 2) {
      pages.push('...')
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis after if needed
    if (end < total - 1) {
      pages.push('...')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})

const goToPage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value && newPage !== props.page) {
    emit('update:page', newPage)
  }
}

const handlePageSizeChange = (value: string | number | boolean | null) => {
  if (value === null || typeof value === 'boolean') return
  const newPageSize = normalizeTablePageSize(typeof value === 'string' ? parseInt(value, 10) : value)
  setPersistedPageSize(newPageSize)
  emit('update:pageSize', newPageSize)
}

const submitJump = () => {
  const value = String(jumpPage.value).trim()
  if (!value) return
  const pageNum = Number.parseInt(value, 10)
  if (Number.isNaN(pageNum)) return
  const nextPage = Math.min(Math.max(pageNum, 1), totalPages.value)
  jumpPage.value = ''
  goToPage(nextPage)
}
</script>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px;
}
.pagination-summary {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
}
.pagination-step,
.pagination-page {
  display: inline-flex;
  min-width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  transition: background-color 120ms, color 120ms;
}
.pagination-step {
  padding: 0 10px;
  border: 1px solid var(--border-default);
  background: var(--surface-panel);
}
.pagination-page { padding: 0 6px; }
.pagination-step:hover:not(:disabled),
.pagination-page:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text-primary);
}
.pagination-step:disabled,
.pagination-page:disabled { cursor: not-allowed; opacity: 0.45; }
.pagination-page.cursor-default:disabled { opacity: 1; }
.pagination-page-current,
.pagination-page-current:hover:not(:disabled) {
  background: var(--accent-soft);
  color: var(--accent-text);
  font-weight: 600;
}
.page-size-select :deep(.select-trigger) {
  @apply px-3 py-1.5 text-sm;
}
@media (pointer: coarse) {
  .pagination-step, .pagination-page { min-width: 44px; height: 44px; }
}
</style>
