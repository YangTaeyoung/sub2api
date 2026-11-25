<template>
  <div class="space-y-6">
    <section data-testid="profile-overview-hero" class="card overflow-hidden">
      <div class="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <div class="profile-avatar">
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            :alt="displayName"
            class="h-full w-full object-cover"
          >
          <span v-else>{{ avatarInitial }}</span>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h2 class="min-w-0 truncate text-base font-semibold text-[var(--text-primary)]">
              {{ displayName }}
            </h2>
            <span :class="['badge shrink-0', user?.role === 'admin' ? 'badge-primary' : 'badge-gray']">
              {{ user?.role === 'admin' ? t('profile.administrator') : t('profile.user') }}
            </span>
            <span
              :class="['badge shrink-0', user?.status === 'active' ? 'badge-success' : 'badge-danger']"
            >
              {{
                user?.status === 'active'
                  ? t('common.active')
                  : t('common.disabled')
              }}
            </span>
          </div>
          <p
            v-if="primaryEmailDisplay && primaryEmailDisplay !== displayName"
            class="mt-0.5 truncate text-sm text-[var(--text-secondary)]"
          >
            {{ primaryEmailDisplay }}
          </p>
        </div>
      </div>

      <dl class="profile-metrics">
        <div data-testid="profile-overview-metric-balance" class="profile-metric">
          <dt>{{ t('profile.accountBalance') }}</dt>
          <dd>{{ formatCurrency(user?.balance || 0) }}</dd>
        </div>
        <div data-testid="profile-overview-metric-concurrency" class="profile-metric">
          <dt>{{ t('profile.concurrencyLimit') }}</dt>
          <dd>{{ user?.concurrency || 0 }}</dd>
        </div>
        <div data-testid="profile-overview-metric-member-since" class="profile-metric">
          <dt>{{ t('profile.memberSince') }}</dt>
          <dd>{{ memberSinceLabel }}</dd>
        </div>
      </dl>
    </section>

    <div class="space-y-6">
      <div data-testid="profile-main-column" class="space-y-6">
        <section data-testid="profile-basics-panel" class="card overflow-hidden">
          <div class="border-b border-[var(--border-default)] px-4 py-4 sm:px-6">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">
              {{ t('profile.basicsTitle') }}
            </h3>
            <p class="mt-1 text-sm text-[var(--text-muted)]">
              {{ t('profile.basicsDescription') }}
            </p>
          </div>

          <div class="grid divide-y divide-[var(--border-default)] md:grid-cols-2 md:divide-x md:divide-y-0">
            <div class="px-4 py-5 sm:px-6">
              <ProfileAvatarCard
                :user="user"
                embedded
              />
            </div>

            <div class="px-4 py-5 sm:px-6">
              <ProfileEditForm
                :initial-username="user?.username || ''"
                embedded
              />
            </div>
          </div>
        </section>

        <section data-testid="profile-auth-bindings-panel" class="card overflow-hidden">
          <ProfileIdentityBindingsSection
            :user="user"
            :linuxdo-enabled="linuxdoEnabled"
            :dingtalk-enabled="dingtalkEnabled"
            :oidc-enabled="oidcEnabled"
            :oidc-provider-name="oidcProviderName"
            :wechat-enabled="wechatEnabled"
            :wechat-open-enabled="wechatOpenEnabled"
            :wechat-mp-enabled="wechatMpEnabled"
            embedded
            compact
          />
        </section>
      </div>

      <div data-testid="profile-side-column" class="space-y-6">
        <section v-if="sourceHints.length" class="card overflow-hidden">
          <div class="border-b border-[var(--border-default)] px-4 py-4 sm:px-6">
            <h3 class="text-sm font-semibold text-[var(--text-primary)]">
              {{ t('profile.linkedProfileSources') }}
            </h3>
            <p class="mt-1 text-sm text-[var(--text-muted)]">
              {{ t('profile.linkedProfileSourcesDescription') }}
            </p>
          </div>

          <ul class="divide-y divide-[var(--border-default)]">
            <li
              v-for="hint in sourceHints"
              :key="hint.key"
              class="flex items-start gap-2 px-4 py-3 text-sm text-[var(--text-secondary)] sm:px-6"
            >
              <Icon name="link" size="sm" class="mt-0.5 shrink-0 text-[var(--text-muted)]" />
              <span>{{ hint.text }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Icon from '@/components/icons/Icon.vue'
import ProfileAvatarCard from '@/components/user/profile/ProfileAvatarCard.vue'
import ProfileEditForm from '@/components/user/profile/ProfileEditForm.vue'
import ProfileIdentityBindingsSection from '@/components/user/profile/ProfileIdentityBindingsSection.vue'
import type { User, UserAuthBindingStatus, UserAuthProvider, UserProfileSourceContext } from '@/types'

const props = withDefaults(defineProps<{
  user: User | null
  linuxdoEnabled?: boolean
  dingtalkEnabled?: boolean
  oidcEnabled?: boolean
  oidcProviderName?: string
  wechatEnabled?: boolean
  wechatOpenEnabled?: boolean
  wechatMpEnabled?: boolean
}>(), {
  linuxdoEnabled: false,
  dingtalkEnabled: false,
  oidcEnabled: false,
  oidcProviderName: 'OIDC',
  wechatEnabled: false,
  wechatOpenEnabled: undefined,
  wechatMpEnabled: undefined,
})

const { t } = useI18n()

function normalizeBindingStatus(binding: boolean | UserAuthBindingStatus | undefined): boolean | null {
  if (typeof binding === 'boolean') {
    return binding
  }
  if (!binding) {
    return null
  }
  if (typeof binding.bound === 'boolean') {
    return binding.bound
  }
  return Boolean(binding.provider_subject || binding.issuer || binding.provider_key)
}

function isEmailBound(user: User | null | undefined): boolean {
  if (typeof user?.email_bound === 'boolean') {
    return user.email_bound
  }

  const nested = user?.auth_bindings?.email ?? user?.identity_bindings?.email
  const normalized = normalizeBindingStatus(nested)
  return normalized ?? false
}

const avatarUrl = computed(() => props.user?.avatar_url?.trim() || '')
const displayName = computed(() => props.user?.username?.trim() || props.user?.email?.trim() || t('profile.user'))
const primaryEmailDisplay = computed(() => {
  const email = props.user?.email?.trim() || ''
  if (!email) {
    return ''
  }
  if (email.endsWith('.invalid') && !isEmailBound(props.user)) {
    return ''
  }
  return email
})
const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase() || 'U')
const memberSinceLabel = computed(() => {
  const raw = props.user?.created_at?.trim()
  if (!raw) {
    return '-'
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
  }).format(date)
})

const providerLabels = computed<Record<UserAuthProvider, string>>(() => ({
  email: t('profile.authBindings.providers.email'),
  linuxdo: t('profile.authBindings.providers.linuxdo'),
  dingtalk: t('profile.authBindings.providers.dingtalk'),
  oidc: t('profile.authBindings.providers.oidc', { providerName: props.oidcProviderName }),
  wechat: t('profile.authBindings.providers.wechat'),
  github: 'GitHub',
  google: 'Google'
}))

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`
}

function normalizeProvider(value: string): UserAuthProvider | null {
  const normalized = value.trim().toLowerCase()
  if (
    normalized === 'email' ||
    normalized === 'linuxdo' ||
    normalized === 'dingtalk' ||
    normalized === 'wechat' ||
    normalized === 'github' ||
    normalized === 'google'
  ) {
    return normalized
  }
  if (normalized === 'oidc' || normalized.startsWith('oidc:') || normalized.startsWith('oidc/')) {
    return 'oidc'
  }
  return null
}

function readObjectString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

function resolveThirdPartySource(
  rawSource: string | UserProfileSourceContext | null | undefined
): { provider: UserAuthProvider; label: string } | null {
  if (!rawSource) {
    return null
  }

  if (typeof rawSource === 'string') {
    const provider = normalizeProvider(rawSource)
    if (!provider || provider === 'email') {
      return null
    }
    return {
      provider,
      label: providerLabels.value[provider]
    }
  }

  const sourceRecord = rawSource as Record<string, unknown>
  const provider = normalizeProvider(
    readObjectString(sourceRecord, 'provider', 'source', 'provider_type', 'auth_provider')
  )
  if (!provider || provider === 'email') {
    return null
  }

  const explicitLabel = readObjectString(
    sourceRecord,
    'provider_label',
    'label',
    'provider_name',
    'providerName'
  )

  return {
    provider,
    label: explicitLabel || providerLabels.value[provider]
  }
}

const sourceHints = computed(() => {
  const currentUser = props.user
  if (!currentUser) {
    return []
  }

  const hints: Array<{ key: string; text: string }> = []
  const avatarSource = resolveThirdPartySource(
    currentUser.profile_sources?.avatar ?? currentUser.avatar_source
  )
  const usernameSource = resolveThirdPartySource(
    currentUser.profile_sources?.username ??
      currentUser.profile_sources?.display_name ??
      currentUser.profile_sources?.nickname ??
      currentUser.display_name_source ??
      currentUser.username_source ??
      currentUser.nickname_source
  )

  if (avatarSource) {
    hints.push({
      key: 'avatar',
      text: t('profile.authBindings.source.avatar', { providerName: avatarSource.label })
    })
  }

  if (usernameSource) {
    hints.push({
      key: 'username',
      text: t('profile.authBindings.source.username', { providerName: usernameSource.label })
    })
  }

  return hints
})
</script>

<style scoped>
.profile-avatar {
  display: flex;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--surface-hover);
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
}

.profile-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid var(--border-default);
}

.profile-metric {
  min-width: 0;
  padding: 12px 24px;
}

.profile-metric + .profile-metric {
  border-left: 1px solid var(--border-default);
}

.profile-metric dt {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 18px;
}

.profile-metric dd {
  margin-top: 2px;
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 550;
  line-height: 22px;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 639px) {
  .profile-avatar {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }

  .profile-metrics {
    grid-template-columns: minmax(0, 1fr);
  }

  .profile-metric {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 16px;
  }

  .profile-metric + .profile-metric {
    border-top: 1px solid var(--border-default);
    border-left: 0;
  }

  .profile-metric dd {
    margin-top: 0;
    font-size: 14px;
  }
}
</style>
