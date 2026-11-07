import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

import HomeView from '../HomeView.vue'

const { appStore, authStore, copyToClipboard } = vi.hoisted(() => ({
  copyToClipboard: vi.fn(),
  appStore: {
    cachedPublicSettings: {} as Record<string, unknown>,
    siteName: 'Fallback site',
    siteLogo: '',
    docUrl: '',
    publicSettingsLoaded: true,
    fetchPublicSettings: vi.fn(),
  },
  authStore: {
    isAuthenticated: false,
    isAdmin: false,
    user: null as { email?: string } | null,
    checkAuth: vi.fn(),
  },
}))

vi.mock('@/composables/useClipboard', () => ({
  useClipboard: () => ({ copied: false, copyToClipboard }),
}))

vi.mock('@/stores', () => ({
  useAppStore: () => appStore,
  useAuthStore: () => authStore,
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => appStore,
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({ t: (key: string) => key }),
  }
})

function mountHome(settings: Record<string, unknown> = {}) {
  appStore.cachedPublicSettings = {
    site_name: 'Test site',
    site_subtitle: 'Test subtitle',
    ...settings,
  }

  return mount(HomeView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        LocaleSwitcher: { template: '<div data-testid="locale-switcher" />' },
        Icon: { template: '<span data-testid="icon" />' },
      },
    },
  })
}

function compactDestination(wrapper: ReturnType<typeof mountHome>) {
  return wrapper.get('[data-testid="compact-home"]').findComponent(RouterLinkStub).props('to')
}

function modelPlazaDestination(wrapper: ReturnType<typeof mountHome>) {
  return wrapper
    .findAllComponents(RouterLinkStub)
    .find((link) => link.props('to') === '/model-plaza')
    ?.props('to')
}

describe('HomeView compact mode', () => {
  beforeEach(() => {
    authStore.isAuthenticated = false
    authStore.isAdmin = false
    authStore.user = null
    authStore.checkAuth.mockClear()
    appStore.fetchPublicSettings.mockClear()
    copyToClipboard.mockClear()
    localStorage.clear()
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
  })

  it('renders custom HTML ahead of compact mode', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      home_content: '<section id="custom-home">Custom home</section>',
    })

    expect(wrapper.get('#custom-home').text()).toBe('Custom home')
    expect(wrapper.find('[data-testid="compact-home"]').exists()).toBe(false)
  })

  it('renders custom URL content ahead of compact mode', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      home_content: ' https://example.com/home ',
    })

    expect(wrapper.get('iframe').attributes('src')).toBe('https://example.com/home')
    expect(wrapper.find('[data-testid="compact-home"]').exists()).toBe(false)
  })

  it('treats whitespace-only custom content as empty and selects compact mode', () => {
    const wrapper = mountHome({ compact_home_enabled: true, home_content: ' \n\t ' })

    expect(wrapper.get('[data-testid="compact-home"]').text()).toContain('Test site')
  })

  it.each([undefined, false])('selects the default home when compact mode is %s', (enabled) => {
    const settings = enabled === undefined ? {} : { compact_home_enabled: enabled }
    const wrapper = mountHome(settings)

    expect(wrapper.find('[data-testid="compact-home"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="gateway-home"]').exists()).toBe(true)
  })

  it('links unauthenticated visitors to login', () => {
    expect(compactDestination(mountHome({ compact_home_enabled: true }))).toBe('/login')
  })

  it('links authenticated users to their dashboard', () => {
    authStore.isAuthenticated = true

    expect(compactDestination(mountHome({ compact_home_enabled: true }))).toBe('/dashboard')
  })

  it('links administrators to the admin dashboard', () => {
    authStore.isAuthenticated = true
    authStore.isAdmin = true

    const wrapper = mountHome({ compact_home_enabled: true })
    expect(compactDestination(wrapper)).toBe('/admin/dashboard')
    expect(authStore.checkAuth).toHaveBeenCalledOnce()
    expect(appStore.fetchPublicSettings).not.toHaveBeenCalled()
  })

  it('shows the model plaza link to anonymous visitors when public access is enabled', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      model_plaza_enabled: true,
      model_plaza_require_auth: false,
    })

    expect(modelPlazaDestination(wrapper)).toBe('/model-plaza')
  })

  it('hides the model plaza link from anonymous visitors when sign-in is required', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      model_plaza_enabled: true,
      model_plaza_require_auth: true,
    })

    expect(modelPlazaDestination(wrapper)).toBeUndefined()
  })

  it('shows the model plaza link to authenticated visitors when sign-in is required', () => {
    authStore.isAuthenticated = true

    const wrapper = mountHome({
      compact_home_enabled: true,
      model_plaza_enabled: true,
      model_plaza_require_auth: true,
    })

    expect(modelPlazaDestination(wrapper)).toBe('/model-plaza')
  })

  it('shows the model plaza link in the default home header', () => {
    const wrapper = mountHome({
      model_plaza_enabled: true,
      model_plaza_require_auth: false,
    })

    expect(modelPlazaDestination(wrapper)).toBe('/model-plaza')
  })

  it('hides the model plaza link when the feature is disabled', () => {
    const wrapper = mountHome({
      compact_home_enabled: true,
      model_plaza_enabled: false,
      model_plaza_require_auth: false,
    })

    expect(modelPlazaDestination(wrapper)).toBeUndefined()
  })
})


describe('HomeView gateway entry', () => {
  beforeEach(() => {
    authStore.isAuthenticated = false
    authStore.isAdmin = false
    copyToClipboard.mockClear()
    localStorage.clear()
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
  })

  it.each(['https://gateway.example', 'https://gateway.example/', 'https://gateway.example/v1', 'https://gateway.example/v1/'])('normalizes the configured API base %s without doubling v1', async (base) => {
    const wrapper = mountHome({ api_base_url: base })
    expect(wrapper.get('.endpoint-address code').text()).toBe('https://gateway.example/v1/responses')
    await wrapper.get('#protocol-anthropic').trigger('click')
    expect(wrapper.get('.endpoint-address code').text()).toBe('https://gateway.example/v1/messages')
    expect(wrapper.get('#protocol-anthropic').attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('copies the selected request URL only on an explicit click', async () => {
    const wrapper = mountHome({ api_base_url: 'https://gateway.example/proxy/v1/' })
    expect(copyToClipboard).not.toHaveBeenCalled()
    await wrapper.get('#protocol-anthropic').trigger('click')
    await wrapper.get('.endpoint-copy').trigger('click')
    expect(copyToClipboard).toHaveBeenCalledWith('https://gateway.example/proxy/v1/messages')
    wrapper.unmount()
  })

  it('supports arrow and boundary keys on the protocol tabs', async () => {
    const wrapper = mountHome()
    await wrapper.get('#protocol-openai').trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.get('#protocol-anthropic').attributes('tabindex')).toBe('0')
    expect(wrapper.get('.endpoint-address').attributes('aria-labelledby')).toBe('protocol-anthropic')
    for (const tab of wrapper.findAll('[role=tab]')) {
      expect(wrapper.find('#' + tab.attributes('aria-controls')).exists()).toBe(true)
    }
    await wrapper.get('#protocol-anthropic').trigger('keydown', { key: 'Home' })
    expect(wrapper.get('#protocol-openai').attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('keeps custom subtitles and localizes the legacy default text', () => {
    const custom = mountHome({ site_subtitle: 'My own gateway' })
    expect(custom.get('.home-intro-copy > p').text()).toBe('My own gateway')
    custom.unmount()
    const standard = mountHome({ site_subtitle: 'Subscription to API Conversion Platform' })
    expect(standard.get('.home-intro-copy > p').text()).toBe('home.gateway.description')
    standard.unmount()
  })

  it('keeps the main action role-aware in the default page', () => {
    const anonymous = mountHome()
    expect(anonymous.findAllComponents(RouterLinkStub).find(link => link.classes().includes('home-primary-action'))?.props('to')).toBe('/login')
    anonymous.unmount()
    authStore.isAuthenticated = true
    authStore.isAdmin = true
    const admin = mountHome()
    expect(admin.findAllComponents(RouterLinkStub).find(link => link.classes().includes('home-primary-action'))?.props('to')).toBe('/admin/dashboard')
    admin.unmount()
  })
})
