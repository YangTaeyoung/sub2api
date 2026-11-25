<template>
  <div>
    <button
      type="button"
      @click="openModal"
      class="relative flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      :aria-label="t('announcements.title')"
    >
      <Icon name="bell" size="md" />
      <span
        v-if="unreadCount > 0"
        class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500"
        aria-hidden="true"
      ></span>
    </button>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isModalOpen"
          class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[8vh]"
          @click="closeModal"
        >
          <div
            class="announcement-panel w-full max-w-[560px]"
            role="dialog"
            aria-modal="true"
            :aria-label="t('announcements.title')"
            @click.stop
          >
            <div class="flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-4 py-3">
              <div class="flex min-w-0 items-baseline gap-2">
                <h2 class="text-sm font-semibold text-[var(--text-primary)]">
                  {{ t('announcements.title') }}
                </h2>
                <p v-if="unreadCount > 0" class="text-xs tabular-nums text-[var(--text-muted)]">
                  {{ unreadCount }} {{ t('announcements.unread') }}
                </p>
              </div>
              <div class="flex flex-shrink-0 items-center gap-1">
                <button
                  v-if="unreadCount > 0"
                  type="button"
                  @click="markAllAsRead"
                  :disabled="loading"
                  class="btn btn-ghost btn-sm"
                >
                  {{ t('announcements.markAllRead') }}
                </button>
                <button
                  type="button"
                  @click="closeModal"
                  class="announcement-close"
                  :aria-label="t('common.close')"
                >
                  <Icon name="x" size="sm" />
                </button>
              </div>
            </div>

            <div class="announcement-scroll max-h-[65vh] overflow-y-auto">
              <div v-if="loading" class="flex items-center justify-center py-12">
                <div class="spinner text-[var(--text-muted)]"></div>
              </div>

              <div v-else-if="announcements.length > 0" class="divide-y divide-[var(--border-default)]">
                <button
                  v-for="item in announcements"
                  :key="item.id"
                  type="button"
                  class="group relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)]"
                  @click="openDetail(item)"
                >
                  <span
                    class="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    :class="item.read_at ? 'bg-transparent' : 'bg-[var(--accent-primary)]'"
                    aria-hidden="true"
                  ></span>
                  <span class="min-w-0 flex-1">
                    <span
                      class="block truncate text-sm"
                      :class="item.read_at
                        ? 'font-normal text-[var(--text-secondary)]'
                        : 'font-semibold text-[var(--text-primary)]'"
                    >
                      {{ item.title }}
                    </span>
                    <span class="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <time>{{ formatRelativeTime(item.created_at) }}</time>
                      <span v-if="!item.read_at">{{ t('announcements.unread') }}</span>
                    </span>
                  </span>
                  <Icon name="chevronRight" size="sm" class="flex-shrink-0 text-[var(--text-muted)]" />
                </button>
              </div>

              <div v-else class="px-4 py-12 text-center">
                <p class="text-sm font-medium text-[var(--text-primary)]">{{ t('announcements.empty') }}</p>
                <p class="mt-1 text-xs text-[var(--text-muted)]">{{ t('announcements.emptyDescription') }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="detailModalOpen && selectedAnnouncement"
          class="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[6vh]"
          @click="closeDetail"
        >
          <div
            class="announcement-panel w-full max-w-[720px]"
            role="dialog"
            aria-modal="true"
            :aria-label="selectedAnnouncement.title"
            @click.stop
          >
            <div class="flex items-start justify-between gap-4 border-b border-[var(--border-default)] px-5 py-4">
              <div class="min-w-0 flex-1">
                <h2 class="break-words text-base font-semibold leading-snug text-[var(--text-primary)]">
                  {{ selectedAnnouncement.title }}
                </h2>
                <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)]">
                  <time>{{ formatRelativeWithDateTime(selectedAnnouncement.created_at) }}</time>
                  <span aria-hidden="true">·</span>
                  <span>{{ selectedAnnouncement.read_at ? t('announcements.read') : t('announcements.unread') }}</span>
                </div>
              </div>
              <button
                type="button"
                @click="closeDetail"
                class="announcement-close"
                :aria-label="t('common.close')"
              >
                <Icon name="x" size="sm" />
              </button>
            </div>

            <div class="announcement-scroll max-h-[60vh] overflow-y-auto px-5 py-5">
              <div
                class="markdown-body prose prose-sm max-w-none dark:prose-invert"
                v-html="renderMarkdown(selectedAnnouncement.content)"
              ></div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-default)] px-5 py-3">
              <p class="min-w-0 text-xs text-[var(--text-muted)]">
                {{ selectedAnnouncement.read_at ? t('announcements.readStatus') : t('announcements.markReadHint') }}
              </p>
              <div class="ml-auto flex items-center gap-2">
                <button type="button" @click="closeDetail" class="btn btn-secondary">
                  {{ t('common.close') }}
                </button>
                <button
                  v-if="!selectedAnnouncement.read_at"
                  type="button"
                  @click="markAsReadAndClose(selectedAnnouncement.id)"
                  class="btn btn-primary"
                >
                  {{ t('announcements.markRead') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAppStore } from '@/stores/app'
import { useAnnouncementStore } from '@/stores/announcements'
import { formatRelativeTime, formatRelativeWithDateTime } from '@/utils/format'
import type { UserAnnouncement } from '@/types'
import Icon from '@/components/icons/Icon.vue'
import '@/styles/announcement-markdown.css'

const { t } = useI18n()
const appStore = useAppStore()
const announcementStore = useAnnouncementStore()

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Use store state (storeToRefs for reactivity)
const { announcements, loading } = storeToRefs(announcementStore)
const unreadCount = computed(() => announcementStore.unreadCount)

// Local modal state
const isModalOpen = ref(false)
const detailModalOpen = ref(false)
const selectedAnnouncement = ref<UserAnnouncement | null>(null)

// Methods
function renderMarkdown(content: string): string {
  if (!content) return ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
}

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
}

function openDetail(announcement: UserAnnouncement) {
  selectedAnnouncement.value = announcement
  detailModalOpen.value = true
  if (!announcement.read_at) {
    markAsRead(announcement.id)
  }
}

function closeDetail() {
  detailModalOpen.value = false
  selectedAnnouncement.value = null
}

async function markAsRead(id: number) {
  try {
    const marked = await announcementStore.markAsRead(id)
    if (!marked) appStore.showError(t('common.unknownError'))
    return marked
  } catch (err: any) {
    appStore.showError(err?.message || t('common.unknownError'))
    return false
  }
}

async function markAsReadAndClose(id: number) {
  if (!await markAsRead(id)) return
  appStore.showSuccess(t('announcements.markedAsRead'))
  closeDetail()
}

async function markAllAsRead() {
  try {
    await announcementStore.markAllAsRead()
    appStore.showSuccess(t('announcements.allMarkedAsRead'))
  } catch (err: any) {
    appStore.showError(err?.message || t('common.unknownError'))
  }
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (detailModalOpen.value) {
      closeDetail()
    } else if (isModalOpen.value) {
      closeModal()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})

watch(
  [isModalOpen, detailModalOpen, () => announcementStore.currentPopup],
  ([modal, detail, popup]) => {
    document.body.style.overflow = (modal || detail || popup) ? 'hidden' : ''
  }
)
</script>

<style scoped>
.announcement-panel {
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--surface-panel);
  box-shadow: 0 16px 40px -12px rgb(0 0 0 / 0.28);
}

.announcement-close {
  display: flex;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-muted);
  transition: background-color 0.15s ease-out, color 0.15s ease-out;
}

.announcement-close:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.announcement-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border-default) transparent;
}
</style>
