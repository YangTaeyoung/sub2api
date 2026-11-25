<template>
  <Teleport to="body">
    <Transition name="popup-fade">
      <div
        v-if="displayedAnnouncement"
        class="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-[8vh]"
      >
        <div
          class="announcement-panel w-full max-w-[640px]"
          role="dialog"
          aria-modal="true"
          :aria-label="displayedAnnouncement.title"
          @click.stop
        >
          <div class="border-b border-[var(--border-default)] px-5 py-4">
            <h2 class="break-words text-base font-semibold leading-snug text-[var(--text-primary)]">
              {{ displayedAnnouncement.title }}
            </h2>
            <div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted)]">
              <time>{{ formatRelativeWithDateTime(displayedAnnouncement.created_at) }}</time>
              <span aria-hidden="true">·</span>
              <span>{{ t('announcements.unread') }}</span>
            </div>
          </div>

          <div class="announcement-scroll max-h-[50vh] overflow-y-auto px-5 py-5">
            <div
              class="markdown-body prose prose-sm max-w-none dark:prose-invert"
              v-html="renderedContent"
            ></div>
          </div>

          <div class="flex items-center justify-end border-t border-[var(--border-default)] px-5 py-3">
            <button
              type="button"
              @click="handleDismiss"
              data-testid="announcement-popup-dismiss"
              class="btn btn-primary"
            >
              {{ preview ? t('common.close') : t('announcements.markRead') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAnnouncementStore } from '@/stores/announcements'
import { formatRelativeWithDateTime } from '@/utils/format'
import type { Announcement, UserAnnouncement } from '@/types'
import '@/styles/announcement-markdown.css'

type PreviewAnnouncement = Pick<Announcement | UserAnnouncement, 'title' | 'content' | 'created_at'>

const props = withDefaults(defineProps<{
  announcement?: PreviewAnnouncement | null
  preview?: boolean
}>(), {
  announcement: null,
  preview: false,
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const announcementStore = useAnnouncementStore()
const displayedAnnouncement = computed(() => (
  props.preview ? props.announcement : announcementStore.currentPopup
))

marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedContent = computed(() => {
  const content = displayedAnnouncement.value?.content
  if (!content) return ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})

function handleDismiss() {
  if (props.preview) {
    emit('close')
    return
  }
  announcementStore.dismissPopup()
}

// Manage body overflow — only set, never unset (bell component handles restore)
watch(
  displayedAnnouncement,
  (popup) => {
    if (popup) {
      document.body.style.overflow = 'hidden'
    } else if (props.preview) {
      document.body.style.overflow = ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (props.preview) {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.announcement-panel {
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--surface-panel);
  box-shadow: 0 16px 40px -12px rgb(0 0 0 / 0.28);
}

.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.15s ease-out;
}

.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

.announcement-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border-default) transparent;
}
</style>
