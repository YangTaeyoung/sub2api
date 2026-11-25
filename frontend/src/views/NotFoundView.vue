<template>
  <div class="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)] px-4">
    <div class="w-full max-w-sm text-center">
      <p class="text-sm font-medium tabular-nums text-[var(--text-muted)]">404</p>
      <h1 class="mt-2 text-xl font-semibold text-[var(--text-primary)]">
        {{ t('errors.pageNotFound') }}
      </h1>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">
        {{ t('errors.pageNotFoundDescription') }}
      </p>

      <div class="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <button type="button" @click="goBack" class="btn btn-secondary">
          <Icon name="arrowLeft" size="sm" />
          {{ t('common.back') }}
        </button>
        <router-link to="/dashboard" class="btn btn-primary">
          {{ t('nav.dashboard') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Icon from '@/components/icons/Icon.vue'

const { t } = useI18n()
const router = useRouter()

function goBack(): void {
  router.back()
}
</script>
