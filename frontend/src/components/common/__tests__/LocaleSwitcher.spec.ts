import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LocaleSwitcher from '../LocaleSwitcher.vue'

const { setLocale } = vi.hoisted(() => ({ setLocale: vi.fn() }))

vi.mock('@/i18n', () => ({
  setLocale,
  availableLocales: [
    { code: 'ko', name: '한국어' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' }
  ]
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'zh' } }) }))

enableAutoUnmount(afterEach)

const reload = vi.fn()

const mountSwitcher = () =>
  mount(LocaleSwitcher, { attachTo: document.body, global: { stubs: { Icon: true, transition: false } } })

const choose = async (wrapper: ReturnType<typeof mountSwitcher>, name: string) => {
  await wrapper.get('button').trigger('click')
  const option = wrapper.findAll('button').find((button) => button.text().includes(name))
  await option!.trigger('click')
  await flushPromises()
}

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    setLocale.mockReset().mockResolvedValue(undefined)
    reload.mockReset()
    vi.stubGlobal('location', { ...window.location, reload })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // 分组名称等内容由后端按请求语言返回，已加载的数据要靠整页刷新换成新语言
  it('reloads the page after switching to another language', async () => {
    const wrapper = mountSwitcher()

    await choose(wrapper, 'English')

    expect(setLocale).toHaveBeenCalledWith('en')
    expect(reload).toHaveBeenCalledTimes(1)
    expect(setLocale.mock.invocationCallOrder[0]).toBeLessThan(reload.mock.invocationCallOrder[0])
  })

  it('offers native Korean and reloads after selecting it', async () => {
    const wrapper = mountSwitcher()
    await choose(wrapper, '한국어')
    expect(setLocale).toHaveBeenCalledWith('ko')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('exposes its open state and closes on Escape', async () => {
    const wrapper = mountSwitcher()
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('[role=menu]').exists()).toBe(true)
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
    await wrapper.get('[role=menu]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
  })

  it('supports keyboard navigation and returns focus after Escape', async () => {
    const wrapper = mountSwitcher()
    const trigger = wrapper.get('button')
    await trigger.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.activeElement?.textContent).toContain('中文')
    await wrapper.get('[role=menu]').trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.textContent).toContain('한국어')
    await wrapper.get('[role=menu]').trigger('keydown', { key: 'Escape' })
    expect(document.activeElement).toBe(trigger.element)
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })

  it('does nothing when the current language is chosen again', async () => {
    const wrapper = mountSwitcher()

    await choose(wrapper, '中文')

    expect(setLocale).not.toHaveBeenCalled()
    expect(reload).not.toHaveBeenCalled()
  })
})
