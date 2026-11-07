<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="hasHomeContent" class="min-h-screen">
    <!-- iframe mode -->
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <!-- Compact Home Page -->
  <div
    v-else-if="compactHomeEnabled"
    data-testid="compact-home"
    class="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-dark-950 dark:text-white"
  >
    <header class="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-dark-800">
      <nav class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <img
            :src="siteLogo || '/logo.svg'"
            alt="Logo"
            class="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <span class="min-w-0 truncate text-base font-semibold">{{ siteName }}</span>
        </div>
        <div class="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-dark-400 dark:hover:bg-dark-800"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>
          <router-link
            v-if="showModelPlazaEntry"
            to="/model-plaza"
            class="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="t('nav.modelPlaza')"
          >
            <Icon name="grid" size="md" />
            <span class="hidden sm:inline">{{ t('nav.modelPlaza') }}</span>
          </router-link>
          <button
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-dark-400 dark:hover:bg-dark-800"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            @click="toggleTheme"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>
          <router-link
            :to="isAuthenticated ? dashboardPath : '/login'"
            class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {{ isAuthenticated ? t('home.dashboard') : t('home.login') }}
          </router-link>
        </div>
      </nav>
    </header>

    <main class="flex min-w-0 flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div class="min-w-0 max-w-2xl text-center">
        <img
          :src="siteLogo || '/logo.svg'"
          alt="Logo"
          class="mx-auto mb-6 h-20 w-20 rounded-2xl object-contain"
        />
        <h1 class="[overflow-wrap:anywhere] text-3xl font-bold md:text-4xl">{{ siteName }}</h1>
        <p class="mt-4 whitespace-pre-wrap [overflow-wrap:anywhere] text-base text-gray-600 dark:text-dark-300">{{ siteSubtitle }}</p>
        <router-link
          :to="isAuthenticated ? dashboardPath : '/login'"
          class="mt-8 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          {{ isAuthenticated ? t('home.goToDashboard') : t('home.login') }}
        </router-link>
      </div>
    </main>

    <footer class="min-w-0 border-t border-gray-200 px-4 py-5 text-center text-sm text-gray-500 [overflow-wrap:anywhere] sm:px-6 dark:border-dark-800 dark:text-dark-400">
      &copy; {{ currentYear }} {{ siteName }}
    </footer>
  </div>

  <!-- Default Home Page: existing Workspace visual language, quiet gateway entry. -->
  <div v-else class="gateway-home" data-testid="gateway-home">
    <header class="home-header">
      <nav class="home-container home-nav" :aria-label="t('home.gateway.navigation')">
        <router-link to="/home" class="home-brand" :aria-label="siteName">
          <img :src="siteLogo || '/logo.svg'" alt="" width="32" height="32" />
          <span>{{ siteName }}</span>
        </router-link>
        <div class="home-nav-actions">
          <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer" class="home-nav-doc">{{ t('home.docs') }}</a>
          <router-link v-if="showModelPlazaEntry" to="/model-plaza" class="home-nav-doc">{{ t('nav.modelPlaza') }}</router-link>
          <LocaleSwitcher />
          <button type="button" class="home-icon-button" :aria-label="isDark ? t('home.switchToLight') : t('home.switchToDark')" @click="toggleTheme">
            <Icon :name="isDark ? 'sun' : 'moon'" size="sm" />
          </button>
          <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="home-header-access">
            {{ isAuthenticated ? t('home.dashboard') : t('home.login') }}<Icon name="arrowRight" size="sm" />
          </router-link>
        </div>
      </nav>
    </header>

    <main class="home-container home-main">
      <section class="home-intro" aria-labelledby="home-heading">
        <div class="home-intro-copy">
          <h1 id="home-heading">{{ t('home.gateway.headline') }}</h1>
          <p>{{ siteSubtitle }}</p>
          <div class="home-intro-actions">
            <router-link :to="isAuthenticated ? dashboardPath : '/login'" class="home-primary-action">
              {{ isAuthenticated ? t('home.goToDashboard') : t('home.gateway.signIn') }}<Icon name="arrowRight" size="sm" />
            </router-link>
            <a href="#connection" class="home-text-link">{{ t('home.gateway.explore') }}<Icon name="chevronDown" size="sm" /></a>
          </div>
        </div>
        <div class="home-intro-note"><span class="home-note-rule" aria-hidden="true" /><p>{{ t('home.gateway.introNote') }}</p></div>
      </section>

      <figure id="connection" class="gateway-figure" :aria-label="t('home.gateway.flowTitle')">
        <figcaption class="gateway-figure-heading"><span>{{ t('home.gateway.flowTitle') }}</span><span>{{ t('home.gateway.example') }}</span></figcaption>
        <div class="gateway-flow">
          <div class="flow-client">
            <Icon name="terminal" size="lg" :stroke-width="1.5" />
            <strong>{{ t('home.gateway.client') }}</strong>
            <span>CLI · SDK · {{ t('home.gateway.application') }}</span>
          </div>
          <div class="flow-connector" aria-hidden="true"><span /><Icon name="chevronRight" size="sm" /></div>
          <div class="flow-gateway">
            <div class="flow-gateway-brand"><img :src="siteLogo || '/logo.svg'" alt="" width="34" height="34" /><strong>{{ siteName }}</strong></div>
            <div class="flow-gateway-details"><span>{{ t('home.gateway.keyAuth') }}</span><span>{{ t('home.gateway.groupRouting') }}</span></div>
          </div>
          <div class="flow-connector" aria-hidden="true"><span /><Icon name="chevronRight" size="sm" /></div>
          <div class="flow-services">
            <strong>{{ t('home.gateway.services') }}</strong>
            <div><PlatformIcon platform="openai" class="h-5 w-5" /><span>OpenAI</span></div>
            <div><PlatformIcon platform="anthropic" class="h-5 w-5" /><span>Anthropic</span></div>
          </div>
        </div>
        <div class="gateway-endpoint">
          <div class="endpoint-heading"><span>{{ t('home.gateway.requestPath') }}</span><div class="endpoint-tabs" role="tablist" :aria-label="t('home.gateway.apiFormat')">
            <button v-for="protocol in protocols" :id="`protocol-${protocol.id}`" :key="protocol.id" type="button" role="tab" :aria-selected="activeProtocol === protocol.id" aria-controls="gateway-endpoint" :tabindex="activeProtocol === protocol.id ? 0 : -1" @click="activeProtocol = protocol.id" @keydown="onProtocolKeydown">{{ protocol.name }}</button>
          </div></div>
          <div id="gateway-endpoint" class="endpoint-address" role="tabpanel" :aria-labelledby="`protocol-${activeProtocol}`">
            <span class="endpoint-method">POST</span><code :title="requestUrl">{{ requestUrl }}</code><button type="button" class="home-icon-button endpoint-copy" :aria-label="copied ? t('common.copied') : t('home.gateway.copyEndpoint')" @click="copyToClipboard(requestUrl)"><Icon :name="copied ? 'check' : 'clipboard'" size="sm" /></button>
          </div>
          <span class="endpoint-feedback" role="status" aria-live="polite">{{ copied ? t('common.copied') : '' }}</span>
        </div>
        <p class="gateway-flow-note">{{ t('home.gateway.availabilityNote') }}</p>
      </figure>

      <section class="home-capabilities" aria-labelledby="capabilities-heading">
        <div class="home-capabilities-heading"><h2 id="capabilities-heading">{{ t('home.gateway.manageTitle') }}</h2><p>{{ t('home.gateway.manageDescription') }}</p></div>
        <dl class="home-capability-list">
          <div><dt>{{ t('home.gateway.accounts') }}</dt><dd>{{ t('home.gateway.accountsDescription') }}</dd></div>
          <div><dt>{{ t('home.gateway.keys') }}</dt><dd>{{ t('home.gateway.keysDescription') }}</dd></div>
          <div><dt>{{ t('home.gateway.usage') }}</dt><dd>{{ t('home.gateway.usageDescription') }}</dd></div>
        </dl>
      </section>
    </main>

    <footer class="home-footer"><div class="home-container home-footer-inner"><span>&copy; {{ currentYear }} {{ siteName }}</span><div><a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}</a><router-link v-if="showModelPlazaEntry" to="/model-plaza">{{ t('nav.modelPlaza') }}</router-link><a :href="githubUrl" target="_blank" rel="noopener noreferrer">GitHub<Icon name="externalLink" size="xs" /></a></div></div></footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import { useClipboard } from '@/composables/useClipboard'
import { sanitizeUrl } from '@/utils/url'
import { FeatureFlags, isFeatureFlagEnabled } from '@/utils/featureFlags'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'Sub2API')
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => {
  const subtitle = appStore.cachedPublicSettings?.site_subtitle?.trim()
  return subtitle && !['AI API Gateway Platform', 'Subscription to API Conversion Platform'].includes(subtitle)
    ? subtitle : t('home.gateway.description')
})
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const hasHomeContent = computed(() => homeContent.value.trim().length > 0)
const compactHomeEnabled = computed(() => appStore.cachedPublicSettings?.compact_home_enabled === true)
const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

// Theme
const isDark = ref(document.documentElement.classList.contains('dark'))

// GitHub URL
const githubUrl = 'https://github.com/Wei-Shaw/sub2api'

// Auth state
const isAuthenticated = computed(() => authStore.isAuthenticated)
const modelPlazaRequiresAuth = computed(
  () => appStore.cachedPublicSettings?.model_plaza_require_auth === true,
)
const showModelPlazaEntry = computed(
  () => modelPlazaEnabled.value && (isAuthenticated.value || !modelPlazaRequiresAuth.value),
)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => isAdmin.value ? '/admin/dashboard' : '/dashboard')
const { copied, copyToClipboard } = useClipboard()
const protocols = [{ id: 'openai', name: 'OpenAI', path: '/v1/responses' }, { id: 'anthropic', name: 'Anthropic', path: '/v1/messages' }] as const
const activeProtocol = ref<'openai' | 'anthropic'>('openai')
const requestUrl = computed(() => {
  const configuredBase = sanitizeUrl(appStore.cachedPublicSettings?.api_base_url?.trim() || '')
  const base = (configuredBase || window.location.origin).replace(/\/+$/, '').replace(/\/v1$/, '')
  return base + protocols.find(protocol => protocol.id === activeProtocol.value)!.path
})
function onProtocolKeydown(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const index = protocols.findIndex(protocol => protocol.id === activeProtocol.value)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? protocols.length - 1 : (index + (event.key === 'ArrowLeft' ? -1 : 1) + protocols.length) % protocols.length
  activeProtocol.value = protocols[next]!.id
  const parent = (event.currentTarget as HTMLElement).parentElement
  parent?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
}

// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

// Toggle theme
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  isDark.value = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark.value)
}

onMounted(() => {
  initTheme()

  // Check auth state
  authStore.checkAuth()

  // Ensure public settings are loaded (will use cache if already loaded from injected config)
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>

<style scoped>
.gateway-home { min-height:100vh; color:var(--text-primary); background:var(--surface-canvas); }
.home-container { width:calc(100% - 80px); max-width:1120px; margin-inline:auto; }
.home-header { border-bottom:1px solid var(--border-default); background:var(--surface-canvas); }
.home-nav { min-height:76px; display:flex; justify-content:space-between; align-items:center; gap:24px; }
.home-brand { display:flex; align-items:center; gap:10px; min-width:0; font-size:16px; font-weight:600; letter-spacing:-.02em; }
.home-brand img { width:32px; height:32px; flex-shrink:0; }
.home-brand span { max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.home-nav-actions { display:flex; align-items:center; gap:16px; flex-shrink:0; }
.home-nav-doc { color:var(--text-secondary); font-size:13px; }
.home-nav-doc:hover,.home-text-link:hover { color:var(--text-primary); }
.home-icon-button { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; flex-shrink:0; border-radius:6px; color:var(--text-secondary); }
.home-icon-button:hover { background:var(--surface-hover); color:var(--text-primary); }
.home-header-access { display:flex; align-items:center; gap:12px; border-left:1px solid var(--border-default); padding-left:20px; font-size:13px; font-weight:500; }
.home-header-access:hover { color:var(--accent-primary); }
.home-intro { display:flex; align-items:flex-end; justify-content:space-between; gap:48px; padding:82px 0 54px; }
.home-intro-copy { max-width:760px; }
.home-intro h1 { max-width:800px; font-size:clamp(36px,4.6vw,60px); line-height:1.18; font-weight:600; letter-spacing:-.035em; word-break:keep-all; text-wrap:balance; }
.home-intro-copy > p { max-width:560px; margin-top:24px; color:var(--text-secondary); font-size:16px; line-height:1.75; word-break:keep-all; overflow-wrap:anywhere; white-space:pre-wrap; }
.home-intro-actions { display:flex; align-items:center; flex-wrap:wrap; gap:24px; margin-top:30px; }
.home-primary-action { display:inline-flex; align-items:center; justify-content:center; gap:20px; min-height:42px; padding:10px 16px; border:1px solid #5b5bd6; border-radius:6px; background:#5b5bd6; color:white; font-size:13px; font-weight:500; transition:filter .15s; }
.home-primary-action:hover { filter:brightness(1.08); }
.home-text-link { display:inline-flex; align-items:center; gap:8px; color:var(--text-secondary); font-size:13px; }
.home-intro-note { max-width:190px; flex-shrink:0; padding-bottom:4px; color:var(--text-muted); font-size:12px; line-height:1.7; word-break:keep-all; }
.home-note-rule { display:block; width:24px; height:1px; background:var(--border-default); margin-bottom:12px; }
.gateway-figure { overflow:hidden; scroll-margin-top:24px; border:1px solid var(--border-default); border-radius:8px; background:var(--surface-panel); }
.gateway-figure-heading { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:18px 24px; border-bottom:1px solid var(--border-default); font-size:12px; font-weight:500; }
.gateway-figure-heading > span:last-child { color:var(--text-muted); font-size:11px; font-weight:400; }
.gateway-flow { display:grid; grid-template-columns:minmax(140px,1fr) 80px minmax(220px,1.15fr) 80px minmax(160px,1fr); align-items:center; gap:20px; padding:40px 40px 36px; }
.flow-client { display:flex; flex-direction:column; align-items:flex-start; gap:10px; color:var(--text-secondary); }
.flow-client > svg { margin-bottom:8px; }
.flow-client strong,.flow-services > strong { color:var(--text-primary); font-size:13px; font-weight:500; }
.flow-client > span { color:var(--text-muted); font-size:11px; }
.flow-connector { display:flex; align-items:center; gap:0; color:var(--text-muted); }
.flow-connector > span { height:1px; flex:1; background:var(--border-default); }
.flow-connector > svg { margin-left:-6px; }
.flow-gateway { padding:26px 24px; border:1px solid var(--border-default); border-radius:8px; background:var(--surface-canvas); }
.flow-gateway-brand { display:flex; align-items:center; gap:12px; min-width:0; }
.flow-gateway-brand img { width:34px; height:34px; flex-shrink:0; }
.flow-gateway-brand strong { font-size:18px; font-weight:550; overflow-wrap:anywhere; min-width:0; }
.flow-gateway-details { display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:22px; color:var(--text-secondary); font-size:11px; }
.flow-services { display:flex; flex-direction:column; gap:14px; }
.flow-services > strong { margin-bottom:4px; }
.flow-services > div { display:flex; align-items:center; gap:10px; font-size:12px; color:var(--text-secondary); }
.gateway-endpoint { position:relative; margin:0 24px; border-top:1px solid var(--border-default); padding:18px 0 20px; }
.endpoint-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.endpoint-heading > span { font-size:11px; color:var(--text-muted); }
.endpoint-tabs { display:flex; gap:16px; }
.endpoint-tabs button { border-bottom:1px solid transparent; padding:4px 0; font-size:11px; color:var(--text-muted); }
.endpoint-tabs button[aria-selected=true] { border-bottom-color:var(--accent-primary); color:var(--text-primary); }
.endpoint-address { display:flex; align-items:center; gap:14px; margin-top:10px; padding:10px 12px; border:1px solid var(--border-default); border-radius:6px; background:var(--surface-canvas); }
.endpoint-method { color:var(--accent-text); font-family:ui-monospace,monospace; font-size:10px; font-weight:600; letter-spacing:.04em; }
.endpoint-address code { min-width:0; flex:1; overflow:auto; white-space:nowrap; scrollbar-width:thin; color:var(--text-secondary); font-size:12px; line-height:22px; }
.endpoint-copy { width:28px; height:28px; }
.endpoint-feedback { position:absolute; right:0; bottom:0; font-size:10px; color:var(--text-secondary); }
.gateway-flow-note { padding:0 24px 20px; color:var(--text-muted); font-size:11px; line-height:1.6; word-break:keep-all; }
.home-capabilities { display:grid; grid-template-columns:1fr 1.4fr; gap:80px; margin-top:60px; padding-bottom:64px; }
.home-capabilities h2 { font-size:22px; font-weight:550; line-height:1.4; letter-spacing:-.02em; word-break:keep-all; }
.home-capabilities-heading > p { margin-top:10px; max-width:300px; color:var(--text-muted); font-size:13px; line-height:1.7; word-break:keep-all; }
.home-capability-list > div { display:grid; grid-template-columns:100px 1fr; gap:20px; padding:16px 0; border-top:1px solid var(--border-default); }
.home-capability-list dt { font-size:13px; font-weight:500; }
.home-capability-list dd { color:var(--text-secondary); font-size:12px; line-height:1.7; word-break:keep-all; }
.home-footer { border-top:1px solid var(--border-default); color:var(--text-muted); font-size:11px; }
.home-footer-inner { display:flex; flex-wrap:wrap; justify-content:space-between; gap:24px; padding:22px 0; }
.home-footer-inner > div { display:flex; flex-wrap:wrap; gap:24px; }
.home-footer a { display:flex; align-items:center; gap:5px; }
.home-footer a:hover { color:var(--text-primary); }
@media(max-width:1000px) { .home-intro-note { display:none; } .gateway-flow { gap:12px; padding:32px 24px; grid-template-columns:1fr 40px 1.2fr 40px 1fr; } .flow-gateway { padding:20px 16px; } }
@media(max-width:720px) { .home-container { width:calc(100% - 40px); } .home-nav { min-height:64px; gap:12px; } .home-nav-actions { gap:6px; } .home-nav-doc { display:none; } .home-brand { font-size:14px; gap:8px; } .home-brand span { max-width:120px; } .home-brand img { width:28px; height:28px; } .home-header-access { padding-left:10px; margin-left:4px; gap:5px; font-size:12px; } .home-intro { padding:48px 0 36px; } .home-intro h1 { font-size:38px; max-width:450px; } .home-intro-copy > p { margin-top:18px; font-size:14px; } .home-intro-actions { gap:18px; margin-top:24px; } .home-primary-action { min-height:44px; gap:12px; } .gateway-figure-heading { padding:16px 18px; } .gateway-flow { grid-template-columns:1fr; gap:0; padding:24px; } .flow-client { align-items:center; gap:6px; } .flow-client > svg { margin-bottom:6px; } .flow-connector { height:36px; flex-direction:column; justify-content:center; } .flow-connector > span { flex:none; width:1px; height:22px; } .flow-connector > svg { transform:rotate(90deg); margin: -6px 0 0; } .flow-gateway { padding:20px 24px; width:100%; max-width:320px; justify-self:center; } .flow-services { display:grid; grid-template-columns:1fr 1fr; align-items:center; gap:12px 24px; justify-content:center; justify-items:center; } .flow-services > strong { grid-column:1/-1; margin-bottom:2px; } .flow-gateway-details { margin-top:16px; } .gateway-endpoint { margin-inline:18px; } .endpoint-address { gap:10px; padding:10px; align-items:flex-start; } .endpoint-address code { white-space:normal; overflow-wrap:anywhere; overflow:visible; } .endpoint-method { line-height:22px; } .endpoint-tabs { gap:12px; } .gateway-flow-note { padding:0 18px 18px; font-size:10px; } .home-capabilities { grid-template-columns:1fr; gap:24px; margin-top:38px; padding-bottom:38px; } .home-capabilities h2 { font-size:21px; } .home-capabilities-heading > p { max-width:none; font-size:12px; } .home-capability-list > div { grid-template-columns:84px 1fr; gap:16px; } .home-icon-button { width:36px; height:36px; } .endpoint-copy { width:32px; height:32px; } }
@media(max-width:380px) { .home-container { width:calc(100% - 32px); } .home-brand span { max-width:90px; } .home-header-access > svg { display:none; } .home-intro h1 { font-size:34px; } .home-nav-actions { gap:2px; } }
@media(prefers-reduced-motion:reduce) { .home-primary-action { transition:none; } }
</style>
