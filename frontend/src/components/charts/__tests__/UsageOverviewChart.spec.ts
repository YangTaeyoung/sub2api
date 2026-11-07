import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import type { Scale, TooltipItem } from 'chart.js'
import type { TrendDataPoint } from '@/types'
import UsageOverviewChart from '../UsageOverviewChart.vue'

const messages: Record<string, string> = {
  'admin.dashboard.analytics.trend': 'Usage over time',
  'admin.dashboard.analytics.viewData': 'View data',
  'admin.dashboard.analytics.noActivity': 'No activity in this period',
  'admin.dashboard.analytics.noActivityHint': 'Select another period to inspect recorded usage.',
  'admin.dashboard.analytics.timeBucket': 'Time bucket',
  'admin.dashboard.analytics.cost': 'Actual cost',
  'admin.dashboard.analytics.requests': 'Requests',
  'admin.dashboard.analytics.tokens': 'Tokens',
  'common.loading': 'Loading'
}

// Deliberately omit locale: parent view tests also use a minimal i18n mock.
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string, params?: { count: number }) => key.endsWith('observedBuckets') ? `${params?.count} observed buckets` : messages[key] ?? key })
}))
vi.mock('@/i18n', () => ({ getIntlLocale: () => 'en-US' }))
vi.mock('vue-chartjs', () => ({
  Bar: { name: 'OverviewBarStub', props: ['data', 'options'], template: '<canvas class="overview-bar" />' },
  Line: { name: 'OverviewLineStub', props: ['data', 'options'], template: '<canvas class="overview-line" />' }
}))

const bucket = (overrides: Partial<TrendDataPoint> = {}): TrendDataPoint => ({
  date: '2026-11-07 08:00', requests: 19, input_tokens: 100, output_tokens: 200,
  cache_creation_tokens: 300, cache_read_tokens: 400, total_tokens: 1000,
  cost: 2, actual_cost: 0.01234567, ...overrides
})
const chart = (wrapper: VueWrapper) => wrapper.findComponent({ name: 'OverviewBarStub' }).exists()
  ? wrapper.findComponent({ name: 'OverviewBarStub' }) : wrapper.findComponent({ name: 'OverviewLineStub' })
const chartData = (wrapper: VueWrapper) => chart(wrapper).props('data') as {
  labels?: string[]
  datasets: { data: { x: number; y: number }[]; borderColor: string; tension: number }[]
}

afterEach(() => { document.documentElement.classList.remove('dark') })

describe('UsageOverviewChart', () => {
  it('uses one observed bar and a single time tick without synthesizing surrounding values', () => {
    const wrapper = mount(UsageOverviewChart, { props: { trendData: [bucket()] } })
    expect(wrapper.find('.overview-bar').exists()).toBe(true)
    const data = chartData(wrapper)
    expect(data.datasets).toHaveLength(1)
    expect(data.datasets[0].data).toEqual([{ x: Date.UTC(2026, 10, 7, 8), y: 0.01234567 }])
    const options = chart(wrapper).props('options')
    const axis = { ticks: [], width: 800 } as unknown as Scale
    options.scales.x.afterBuildTicks(axis)
    expect(axis.ticks).toEqual([{ value: Date.UTC(2026, 10, 7, 8) }])
    expect(wrapper.text()).toContain('1 observed buckets')
    wrapper.unmount()
  })

  it('keeps sparse hourly buckets in true temporal positions, sorted without gap fabrication', () => {
    const points = [bucket({ date: '2026-11-07 12:00' }), bucket(), bucket({ date: '2026-11-07 09:00' })]
    const wrapper = mount(UsageOverviewChart, { props: { trendData: points } })
    expect(wrapper.find('.overview-line').exists()).toBe(true)
    const data = chartData(wrapper)
    const x = data.datasets[0].data.map(point => point.x)
    expect(data.labels).toBeUndefined()
    expect(x).toEqual([8, 9, 12].map(hour => Date.UTC(2026, 10, 7, hour)))
    expect((x[2] - x[1]) / (x[1] - x[0])).toBe(3)
    expect(data.datasets[0].data).toHaveLength(points.length)
    expect(data.datasets[0].tension).toBe(0)
    expect(points[0].date).toBe('2026-11-07 12:00')
    const options = chart(wrapper).props('options')
    expect(options.scales.x.type).toBe('linear')
    expect(options.scales.x.maxTicksLimit).toBeUndefined()
    expect(options.scales.x.ticks.maxTicksLimit).toBe(6)
    expect(options.scales.y.ticks.maxTicksLimit).toBe(4)
    expect(options.scales.y.border.dash).toEqual([3, 4])
    wrapper.unmount()
  })

  it('keeps daily spacing proportional and caps ticks at six observed dates', () => {
    const days = [1, 2, 3, 4, 5, 6, 7, 10]
    const wrapper = mount(UsageOverviewChart, { props: { trendData: days.map(day => bucket({ date: `2026-11-${String(day).padStart(2, '0')}` })) } })
    const options = chart(wrapper).props('options')
    const axis = { ticks: [], width: 800 } as unknown as Scale
    options.scales.x.afterBuildTicks(axis)
    expect(axis.ticks.length).toBeLessThanOrEqual(6)
    expect(axis.ticks.length).toBeGreaterThan(2)
    expect(axis.ticks[0].value).toBe(Date.UTC(2026, 10, 1))
    expect(axis.ticks.at(-1)?.value).toBe(Date.UTC(2026, 10, 10))
    expect(axis.ticks.every(tick => days.some(day => Date.UTC(2026, 10, day) === tick.value))).toBe(true)
    expect(chartData(wrapper).datasets[0].data[7].x - chartData(wrapper).datasets[0].data[6].x).toBe(3 * 86_400_000)
    wrapper.unmount()
  })

  it('spaces irregular observed time labels by pixels on a narrow axis, including after layout shrinks', () => {
    const hours = [1, 2, 3, 4, 5, 6, 7, 11, 13, 14]
    const wrapper = mount(UsageOverviewChart, { props: { trendData: hours.map(hour => bucket({ date: `2026-11-07 ${String(hour).padStart(2, '0')}:00` })) } })
    const options = chart(wrapper).props('options')
    const assertSpaced = (axis: Scale) => {
      expect(axis.ticks.length).toBeLessThanOrEqual(4)
      expect(axis.ticks[0].value).toBe(Date.UTC(2026, 10, 7, 1))
      expect(axis.ticks.at(-1)?.value).toBe(Date.UTC(2026, 10, 7, 14))
      const pixels = axis.ticks.map(tick => (tick.value - Date.UTC(2026, 10, 7, 1)) / (13 * 3_600_000) * axis.width)
      for (let i = 1; i < pixels.length; i++) expect(pixels[i] - pixels[i - 1]).toBeGreaterThanOrEqual(64)
      expect(axis.ticks.every(tick => hours.some(hour => tick.value === Date.UTC(2026, 10, 7, hour)))).toBe(true)
    }
    const narrowAxis = { ticks: [], width: 260 } as unknown as Scale
    options.scales.x.afterBuildTicks(narrowAxis)
    assertSpaced(narrowAxis)
    const resizedAxis = { ticks: [], width: 800 } as unknown as Scale
    options.scales.x.afterBuildTicks(resizedAxis)
    // Chart.js generates label strings before fitting. Filtering preserves them.
    resizedAxis.ticks.forEach(tick => { tick.label = options.scales.x.ticks.callback(tick.value) })
    resizedAxis.width = 260
    options.scales.x.afterFit(resizedAxis)
    assertSpaced(resizedAxis)
    expect(resizedAxis.ticks.every(tick => typeof tick.label === 'string')).toBe(true)
    expect(chartData(wrapper).datasets[0].data).toHaveLength(10)
    wrapper.unmount()
  })

  it('switches actual cost, requests, and aggregate token values without modifying observed values', async () => {
    const wrapper = mount(UsageOverviewChart, { props: { trendData: [bucket({ actual_cost: 0.000000123, requests: 1234567, total_tokens: 987654321 })] } })
    expect(chartData(wrapper).datasets[0].data[0].y).toBe(0.000000123)
    await wrapper.setProps({ metric: 'requests' })
    expect(chartData(wrapper).datasets[0].data[0].y).toBe(1234567)
    await wrapper.setProps({ metric: 'tokens' })
    expect(chartData(wrapper).datasets[0].data[0].y).toBe(987654321)
    expect(wrapper.find('canvas').attributes('aria-label')).toBe('Usage over time · Tokens')
    wrapper.unmount()
  })

  it('preserves equal and zero bucket values as observed line points', () => {
    const wrapper = mount(UsageOverviewChart, { props: { trendData: [bucket({ actual_cost: 0 }), bucket({ date: '2026-11-07 10:00', actual_cost: 0 })] } })
    expect(wrapper.find('.overview-line').exists()).toBe(true)
    expect(chartData(wrapper).datasets[0].data.map(point => point.y)).toEqual([0, 0])
    expect(wrapper.find('.usage-empty').exists()).toBe(false)
    wrapper.unmount()
  })

  it('provides a native disclosure and exact, accessible table values and tooltip for every metric', async () => {
    const wrapper = mount(UsageOverviewChart, { props: { trendData: [bucket({ actual_cost: 0.000000123, requests: 1234567, total_tokens: 987654321 })] } })
    const details = wrapper.find('details')
    expect(details.find('summary').text()).toContain('View data')
    expect(details.attributes('open')).toBeUndefined()
    // Native details/summary provides the keyboard action; the table is semantic.
    await details.element.setAttribute('open', '')
    expect(wrapper.findAll('thead th[scope="col"]')).toHaveLength(4)
    expect(wrapper.find('tbody th[scope="row"]').text()).toBe('2026-11-07 08:00')
    expect(wrapper.findAll('tbody td').map(cell => cell.text())).toEqual(['$0.000000123', '1,234,567', '987,654,321'])
    expect(wrapper.find('.usage-table-scroll').attributes('tabindex')).toBe('0')
    expect(wrapper.find('thead').text()).toContain('USD')
    const callbacks = chart(wrapper).props('options').plugins.tooltip.callbacks
    const item = { dataIndex: 0 } as TooltipItem<'line' | 'bar'>
    expect(callbacks.title([item])).toBe('2026-11-07 08:00')
    expect(callbacks.label(item)).toEqual(['Actual cost (USD): $0.000000123', 'Requests: 1,234,567', 'Tokens: 987,654,321'])
    wrapper.unmount()
  })

  it('repaints the series, grid, axis text and tooltip when the document theme changes', async () => {
    const wrapper = mount(UsageOverviewChart, { props: { trendData: [bucket()] } })
    const lightOptions = chart(wrapper).props('options')
    const lightColor = chartData(wrapper).datasets[0].borderColor
    document.documentElement.classList.add('dark')
    await flushPromises()
    const darkOptions = chart(wrapper).props('options')
    expect(chartData(wrapper).datasets[0].borderColor).not.toBe(lightColor)
    expect(darkOptions.scales.y.grid.color).not.toBe(lightOptions.scales.y.grid.color)
    expect(darkOptions.scales.x.ticks.color).not.toBe(lightOptions.scales.x.ticks.color)
    expect(darkOptions.plugins.tooltip.backgroundColor).not.toBe(lightOptions.plugins.tooltip.backgroundColor)
    expect(darkOptions.plugins.tooltip.titleFont.family).toContain('Pretendard')
    wrapper.unmount()
  })

  it('shows a loading skeleton and a useful empty state without a stale chart', async () => {
    const wrapper = mount(UsageOverviewChart, { props: { trendData: [bucket()], loading: true } })
    expect(wrapper.find('[aria-busy="true"]').attributes('aria-label')).toBe('Loading')
    expect(wrapper.find('canvas').exists()).toBe(false)
    expect(wrapper.find('details').exists()).toBe(false)
    await wrapper.setProps({ trendData: [], loading: false })
    expect(wrapper.find('.usage-empty').text()).toContain('No activity in this period')
    expect(wrapper.find('.usage-empty').text()).toContain('Select another period')
    expect(wrapper.find('canvas').exists()).toBe(false)
    wrapper.unmount()
  })
})
