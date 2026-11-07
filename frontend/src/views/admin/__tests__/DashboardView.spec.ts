import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import type { DashboardStats } from '@/types'
import DashboardView from '../DashboardView.vue'

const { getSnapshotV2, getUserUsageTrend, getUserSpendingRanking, routeState, replaceRoute } = vi.hoisted(() => ({
  getSnapshotV2: vi.fn(),
  getUserUsageTrend: vi.fn(),
  getUserSpendingRanking: vi.fn(),
  routeState: { path: '/admin/dashboard', query: {} as Record<string, string> },
  replaceRoute: vi.fn()
}))

vi.mock('vue-chartjs', () => ({
  Line: { name: 'Line', props: ['data', 'options'], template: '<div class="line-chart" />' },
  Bar: { name: 'Bar', props: ['data', 'options'], template: '<div class="bar-chart" />' }
}))

vi.mock('@/api/admin', () => ({
  adminAPI: {
    accounts: { list: vi.fn().mockResolvedValue({items: []}) },
    dashboard: {
      getSnapshotV2,
      getUserUsageTrend,
      getUserSpendingRanking
    }
  }
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    showError: vi.fn()
  })
}))

vi.mock('vue-router', () => ({
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
  useRouter: () => ({
    push: vi.fn(),
    replace: replaceRoute
  }),
  useRoute: () => routeState
}))

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
      locale: { value: 'en' }
    })
  }
})

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const createDashboardStats = (): DashboardStats => ({
  total_users: 0,
  today_new_users: 0,
  active_users: 0,
  hourly_active_users: 0,
  stats_updated_at: '',
  stats_stale: false,
  total_api_keys: 0,
  active_api_keys: 0,
  total_accounts: 0,
  normal_accounts: 0,
  error_accounts: 0,
  ratelimit_accounts: 0,
  overload_accounts: 0,
  total_requests: 0,
  total_input_tokens: 0,
  total_output_tokens: 0,
  total_cache_creation_tokens: 0,
  total_cache_read_tokens: 0,
  total_tokens: 0,
  total_cost: 0,
  total_actual_cost: 0,
  today_requests: 0,
  today_input_tokens: 0,
  today_output_tokens: 0,
  today_cache_creation_tokens: 0,
  today_cache_read_tokens: 0,
  today_tokens: 0,
  today_cost: 0,
  today_actual_cost: 0,
  average_duration_ms: 0,
  uptime: 0,
  rpm: 0,
  tpm: 0
})

describe('admin DashboardView', () => {
  beforeEach(() => {
    routeState.query = {}
    replaceRoute.mockClear()
    setActivePinia(createPinia())

    getSnapshotV2.mockReset()
    getUserUsageTrend.mockReset()
    getUserSpendingRanking.mockReset()

    getSnapshotV2.mockResolvedValue({
      stats: createDashboardStats(),
      trend: [],
      models: []
    })
    getUserUsageTrend.mockResolvedValue({
      trend: [],
      start_date: '',
      end_date: '',
      granularity: 'hour'
    })
    getUserSpendingRanking.mockResolvedValue({
      ranking: [],
      total_actual_cost: 0,
      total_requests: 0,
      total_tokens: 0,
      start_date: '',
      end_date: ''
    })
  })

  it('switches metrics and ignores a stale tokens response', async () => {
    let resolveTokens!: (value: any) => void
    getUserUsageTrend.mockImplementationOnce(() => new Promise(resolve => { resolveTokens = resolve }))
    getUserUsageTrend.mockResolvedValueOnce({ trend: [{ date: '2026-01-01', user_id: 2, username: 'spender', email: '', requests: 1, tokens: 10, cost: 5, actual_cost: 5 }] })
    const wrapper = mount(DashboardView, {
      global: { stubs: {
        AppLayout: { template: '<div><slot /></div>' }, LoadingSpinner: true,
        Icon: true, DateRangePicker: true, Select: true, ModelDistributionChart: true,
        UsageOverviewChart: true, TokenUsageTrend: true
      } }
    })
    await flushPromises()
    expect(getUserUsageTrend).toHaveBeenCalledWith(expect.objectContaining({ metric: 'tokens', limit: 12 }))
    await wrapper.findAll('button').find(button => button.text() === 'admin.dashboard.actualSpending')!.trigger('click')
    expect(getUserUsageTrend).toHaveBeenCalledWith(expect.objectContaining({ metric: 'actual_cost', limit: 12 }))
    await flushPromises()
    const chart = wrapper.findComponent({ name: 'Line' })
    expect(chart.props('data').datasets[0].data).toEqual([5])
    expect(chart.props('options').scales.y.ticks.callback(5)).toBe('$5.00')
    resolveTokens({ trend: [{ date: '2026-01-01', user_id: 1, username: 'tokens', email: '', requests: 1, tokens: 100, cost: 1, actual_cost: 1 }] })
    await flushPromises()
    expect(chart.props('data').datasets[0].data).toEqual([5])
  })

  it('uses today as a truthful calendar-date dashboard range', async () => {
    mount(DashboardView, {
      global: {
        stubs: {
          AppLayout: { template: '<div><slot /></div>' },
          LoadingSpinner: true,
          Icon: true,
          DateRangePicker: true,
          Select: true,
          ModelDistributionChart: true,
          UsageOverviewChart: true, TokenUsageTrend: true,
          Line: true
        }
      }
    })

    await flushPromises()

    const now = new Date()

    expect(getSnapshotV2).toHaveBeenCalledTimes(1)
    expect(getSnapshotV2).toHaveBeenCalledWith(expect.objectContaining({
      start_date: formatLocalDate(now),
      end_date: formatLocalDate(now),
      granularity: 'hour'
    }))
  })
  it('uses the selected model snapshot for period totals instead of stale today counters', async () => {
    getSnapshotV2.mockResolvedValueOnce({
      stats: { ...createDashboardStats(), today_requests: 999, today_tokens: 999999 },
      trend: [],
      models: [{ model: 'live-model', requests: 3, total_tokens: 1200, input_tokens: 1000, output_tokens: 200, cache_creation_tokens: 0, cache_read_tokens: 0, actual_cost: 0.1234, cost: 0.2 }]
    })
    const wrapper = mount(DashboardView, { global: { stubs: {
      AppLayout: { template: '<div><slot /></div>' }, Icon: true, PlatformIcon: true,
      DateRangePicker: true, Select: true, ModelDistributionChart: true, UsageOverviewChart: true, TokenUsageTrend: true
    } } })
    await flushPromises()
    const metrics = wrapper.findAll('.overview-metric strong').map(node => node.text())
    expect(metrics.slice(0, 3)).toEqual(['$0.123', '3', '1.20K'])
    expect(wrapper.findAll('.overview-metric small')[0].text()).not.toContain('999')
  })

  const mountOverview = () => mount(DashboardView, { global: { stubs: {
    AppLayout: { template: '<div><slot /></div>' }, Icon: true, PlatformIcon: true,
    DateRangePicker: true, Select: true, ModelDistributionChart: true,
    UsageOverviewChart: true, TokenUsageTrend: true
  } } })
  const periodSnapshot = (requests: number) => ({
    stats: createDashboardStats(), trend: [],
    models: [{ model: 'example', requests, total_tokens: 1200, input_tokens: 1000, output_tokens: 200, cache_creation_tokens: 0, cache_read_tokens: 0, actual_cost: 0.1234, cost: 0.2 }]
  })

  it('withholds previous-period totals when a new period fails to load', async () => {
    getSnapshotV2.mockResolvedValueOnce(periodSnapshot(77))
    const wrapper = mountOverview()
    await flushPromises()
    expect(wrapper.findAll('.overview-metric strong').map(node => node.text())).toContain('77')
    getSnapshotV2.mockRejectedValueOnce(new Error('offline'))
    const datePicker = wrapper.findComponent({ name: 'DateRangePicker' })
    datePicker.vm.$emit('update:startDate', '2025-01-01')
    datePicker.vm.$emit('update:endDate', '2025-01-02')
    datePicker.vm.$emit('change', { startDate: '2025-01-01', endDate: '2025-01-02', preset: null })
    await flushPromises()
    expect(wrapper.findAll('.overview-metric strong')).toHaveLength(0)
    expect(wrapper.get('.overview-load-error').text()).toContain('admin.dashboard.analytics.periodFailed')
    expect(wrapper.findComponent({ name: 'ModelDistributionChart' }).exists()).toBe(false)
    wrapper.unmount()
  })

  it('retains confirmed same-period data with an inline refresh failure', async () => {
    getSnapshotV2.mockResolvedValueOnce(periodSnapshot(55))
    const wrapper = mountOverview()
    await flushPromises()
    getSnapshotV2.mockRejectedValueOnce(new Error('offline'))
    await wrapper.get('.overview-refresh').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.overview-metric strong').map(node => node.text())).toContain('55')
    expect(wrapper.get('.overview-load-error').text()).toContain('admin.dashboard.analytics.refreshFailed')
    wrapper.unmount()
  })

  it('keeps chart and model ranking tied to the selected metric', async () => {
    getSnapshotV2.mockResolvedValueOnce(periodSnapshot(7))
    const wrapper = mountOverview()
    await flushPromises()
    await wrapper.get('#metric-requests').trigger('click')
    expect(wrapper.findComponent({ name: 'UsageOverviewChart' }).props('metric')).toBe('requests')
    expect(wrapper.findComponent({ name: 'ModelDistributionChart' }).props('metric')).toBe('requests')
    expect(wrapper.get('#metric-requests').attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('restores period, metric, and resolution from a report URL', async () => {
    routeState.query = { start_date: '2026-01-01', end_date: '2026-01-07', metric: 'tokens', granularity: 'day' }
    const wrapper = mountOverview()
    await flushPromises()
    expect(getSnapshotV2).toHaveBeenCalledWith(expect.objectContaining({ start_date: '2026-01-01', end_date: '2026-01-07', granularity: 'day' }))
    expect(wrapper.get('#metric-tokens').attributes('aria-selected')).toBe('true')
    wrapper.unmount()
  })

  it('records metric context in the URL before log drilldown', async () => {
    const wrapper = mountOverview()
    await flushPromises()
    await wrapper.get('#metric-requests').trigger('click')
    expect(replaceRoute).toHaveBeenCalledWith(expect.objectContaining({ query: expect.objectContaining({ metric: 'requests', start_date: formatLocalDate(new Date()), end_date: formatLocalDate(new Date()) }) }))
    wrapper.unmount()
  })

  it('shows an explicit user-analysis failure and allows retry', async () => {
    getUserUsageTrend.mockRejectedValueOnce(new Error('offline'))
    const wrapper = mountOverview()
    await flushPromises()
    expect(wrapper.get('.overview-user-error').text()).toContain('admin.dashboard.analytics.userAnalysisFailed')
    getUserUsageTrend.mockResolvedValueOnce({ trend: [] })
    await wrapper.get('.overview-user-error button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.overview-user-error').exists()).toBe(false)
    expect(wrapper.get('.overview-users').text()).toContain('admin.dashboard.noDataAvailable')
    wrapper.unmount()
  })

})
