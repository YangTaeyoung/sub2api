import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import ModelDistributionChart from '../ModelDistributionChart.vue'

const messages: Record<string, string> = {
  'admin.dashboard.modelDistribution': 'Model Distribution',
  'admin.dashboard.spendingRankingTitle': 'User Spending Ranking',
  'admin.dashboard.viewModelDistribution': 'Model Distribution',
  'admin.dashboard.viewSpendingRanking': 'User Spending Ranking',
  'admin.dashboard.spendingRankingUser': 'User',
  'admin.dashboard.spendingRankingRequests': 'Requests',
  'admin.dashboard.spendingRankingTokens': 'Tokens',
  'admin.dashboard.spendingRankingSpend': 'Spend',
  'admin.dashboard.spendingRankingOther': 'Others',
  'admin.dashboard.model': 'Model',
  'admin.dashboard.requests': 'Requests',
  'admin.dashboard.tokens': 'Tokens',
  'admin.dashboard.actual': 'Actual',
  'admin.dashboard.accountCost': 'Account Cost',
  'admin.dashboard.standard': 'Standard',
  'admin.dashboard.metricTokens': 'By Tokens',
  'admin.dashboard.metricActualCost': 'By Actual Cost',
  'admin.dashboard.noDataAvailable': 'No data available',
  'admin.redeem.userPrefix': 'User #{id}',
}

vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string, params?: Record<string, unknown>) => {
        const message = messages[key] ?? key
        return params
          ? message.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name]))
          : message
      },
    }),
  }
})

describe('ModelDistributionChart', () => {
  const modelStats = [
    {
      model: 'model-a',
      requests: 8,
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_tokens: 0,
      cache_read_tokens: 0,
      total_tokens: 1000,
      cost: 1.5,
      actual_cost: 0.2,
    },
    {
      model: 'model-b',
      requests: 3,
      input_tokens: 40,
      output_tokens: 20,
      cache_creation_tokens: 0,
      cache_read_tokens: 0,
      total_tokens: 500,
      cost: 0.5,
      actual_cost: 1.4,
    },
  ]

  it('uses total_tokens and token ordering by default', () => {
    const wrapper = mount(ModelDistributionChart, {
      props: {
        modelStats,
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const bars = wrapper.findAll('.metric-contribution')
    expect(bars).toHaveLength(2)
    expect(bars[0].attributes('style')).toContain('width: 100%')
    expect(bars[1].attributes('style')).toContain('width: 50%')
    expect(wrapper.find('th[aria-sort="descending"]').text()).toBe('Tokens')

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('model-a')
    expect(rows[1].text()).toContain('model-b')
  })

  it('sorts requests and scales the request bars to the largest model', () => {
    const wrapper = mount(ModelDistributionChart, {
      props: { modelStats: [modelStats[0], { ...modelStats[1], requests: 3000 }], metric: 'requests' },
      global: { stubs: { LoadingSpinner: true } },
    })
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('model-b')
    expect(wrapper.find('th[aria-sort="descending"]').text()).toBe('Requests')
    const bars = wrapper.findAll('.metric-contribution')
    expect(bars).toHaveLength(2)
    expect(bars[0].attributes('style')).toContain('width: 100%')
    expect(bars[1].attributes('style')).toContain('width: 0.2667%')
    wrapper.unmount()
  })

  it('links desktop and mobile models to usage logs with the selected date range', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }, { path: '/admin/usage', component: { template: '<div />' } }],
    })
    await router.push('/')
    const wrapper = mount(ModelDistributionChart, {
      props: {
        modelStats: [{ ...modelStats[0], model: 'model/a beta' }],
        showChart: false, modelUsageLinks: true, enableBreakdown: false,
        startDate: '2026-11-01', endDate: '2026-11-07',
      },
      global: { plugins: [router], stubs: { LoadingSpinner: true } },
    })
    const links = wrapper.findAll('a.model-usage-link')
    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link.text()).toBe('model/a beta')
      expect(router.resolve(link.attributes('href')).query).toEqual({
        model: 'model/a beta', start_date: '2026-11-01', end_date: '2026-11-07',
      })
    }
    await links[0].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/admin/usage')
    expect(router.currentRoute.value.query.model).toBe('model/a beta')
    expect(wrapper.findAll('[aria-expanded]')).toHaveLength(0)
    wrapper.unmount()
  })

  it('scales compact contribution bars to the active metric maximum and handles zero values', async () => {
    const wrapper = mount(ModelDistributionChart, {
      props: { modelStats, showChart: false, metric: 'actual_cost', enableBreakdown: false },
      global: { stubs: { LoadingSpinner: true } },
    })
    expect(wrapper.find('th[aria-sort="descending"]').text()).toBe('usage.cost')
    expect(wrapper.find('.active-mobile-metric').text()).toContain('$1.40')
    const bars = wrapper.findAll('.distribution-table .metric-contribution')
    expect(bars).toHaveLength(2)
    expect(bars[0].attributes('style')).toContain('width: 100%')
    expect(bars[1].attributes('style')).toContain('width: 14.2857%')
    await wrapper.setProps({ metric: 'requests' })
    expect(wrapper.find('th[aria-sort="descending"]').text()).toBe('Requests')
    expect(wrapper.findAll('tbody tr')[0].text()).toContain('model-a')
    await wrapper.setProps({ modelStats: [{ ...modelStats[0], requests: 0 }] })
    expect(wrapper.find('.distribution-table .metric-contribution').attributes('style')).toContain('width: 0%')
    wrapper.unmount()
  })

  it('uses actual_cost and reorders rows in actual cost mode', () => {
    const wrapper = mount(ModelDistributionChart, {
      props: {
        modelStats,
        metric: 'actual_cost',
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const bars = wrapper.findAll('.metric-contribution')
    expect(bars).toHaveLength(2)
    expect(bars[0].attributes('style')).toContain('width: 100%')
    expect(bars[1].attributes('style')).toContain('width: 14.2857%')
    expect(wrapper.find('th[aria-sort="descending"]').text()).toBe('Actual')

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].text()).toContain('model-b')
    expect(rows[1].text()).toContain('model-a')
  })

  it('can hide account cost for user usage stats without account_cost', () => {
    const wrapper = mount(ModelDistributionChart, {
      props: {
        modelStats,
        showAccountCost: false,
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    expect(wrapper.text()).not.toContain('Account Cost')
    expect(wrapper.findAll('thead th')).toHaveLength(5)
    expect(wrapper.findAll('tbody tr')[0].findAll('td')).toHaveLength(5)
  })

  it('provides native ranking buttons with one keyboard activation event and preserves row clicks', async () => {
    const user = { user_id: 7, email: '', username: 'Sample user', actual_cost: 2, requests: 4, tokens: 20 }
    const wrapper = mount(ModelDistributionChart, {
      props: { modelStats: [], showChart: false, enableRankingView: true, rankingItems: [user], rankingTotalActualCost: 3 },
      global: { stubs: { LoadingSpinner: true } },
    })
    await wrapper.findAll('button').find((button) => button.text() === 'User Spending Ranking')!.trigger('click')
    const rows = wrapper.findAll('tbody tr')
    const userButton = rows[0].find('button')
    expect(userButton.exists()).toBe(true)
    expect(userButton.attributes('type')).toBe('button')
    expect(userButton.text()).toBe('Sample user')
    expect(userButton.attributes('tabindex')).not.toBe('-1')
    // Native button keyboard activation produces a click without pointer detail.
    userButton.element.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }))
    expect(wrapper.emitted('ranking-click')).toEqual([[user]])
    await rows[0].trigger('click')
    expect(wrapper.emitted('ranking-click')).toEqual([[user], [user]])
    expect(rows[1].find('button').exists()).toBe(false)
    await rows[1].trigger('click')
    expect(wrapper.emitted('ranking-click')).toHaveLength(2)
    wrapper.unmount()
  })

  it('uses the dashboard user label policy and renders an Others row', async () => {
    const wrapper = mount(ModelDistributionChart, {
      props: {
        modelStats: [],
        enableRankingView: true,
        rankingItems: [
          { user_id: 1, email: 'alpha@example.com', username: 'alpha', actual_cost: 12, requests: 10, tokens: 1000 },
          { user_id: 2, email: 'beta@example.com', username: '   ', actual_cost: 8, requests: 6, tokens: 600 },
          { user_id: 3, email: '   ', username: '', actual_cost: 0, requests: 0, tokens: 0 },
        ],
        rankingTotalActualCost: 30,
        rankingTotalRequests: 20,
        rankingTotalTokens: 2000,
      },
      global: {
        stubs: {
          LoadingSpinner: true,
        },
      },
    })

    const rankingButton = wrapper.findAll('button').find((button) => button.text() === 'User Spending Ranking')
    expect(rankingButton).toBeTruthy()
    await rankingButton!.trigger('click')

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(4)
    expect(rows[0].text()).toContain('alpha')
    expect(rows[0].text()).not.toContain('alpha@example.com')
    expect(rows[1].text()).toContain('beta@example.com')
    expect(rows[2].text()).toContain('User #3')
    expect(rows[3].text()).toContain('Others')
    expect(rows[3].text()).toContain('4')
    expect(rows[3].text()).toContain('400')
    expect(rows[3].text()).toContain('$10.00')
  })
})
