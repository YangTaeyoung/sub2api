import { computed, ref } from 'vue'
import { useMutationObserver } from '@vueuse/core'

/** Follow the actual theme class; charts must repaint without a page reload. */
export function useChartTheme() {
  const isDark = ref(document.documentElement.classList.contains('dark'))
  useMutationObserver(document.documentElement, () => {
    isDark.value = document.documentElement.classList.contains('dark')
  }, { attributes: true, attributeFilter: ['class'] })

  const colors = computed(() => ({
    text: isDark.value ? '#a9aab4' : '#62636e',
    foreground: isDark.value ? '#eeeef0' : '#25262c',
    grid: isDark.value ? '#2b2c33' : '#e8e8ed',
    tooltip: isDark.value ? '#202126' : '#ffffff',
    input: isDark.value ? '#939cff' : '#5966d6',
    output: isDark.value ? '#70bcaa' : '#288b76',
    cacheCreation: isDark.value ? '#cba879' : '#a87937',
    cacheRead: isDark.value ? '#84abc4' : '#477f9f',
    cacheHitRate: isDark.value ? '#b5a1df' : '#8665ad'
  }))

  const seriesColors = computed(() => [colors.value.input, colors.value.output, colors.value.cacheCreation, colors.value.cacheRead, colors.value.cacheHitRate, '#a88f98', '#7a8fbd', '#8eab9d', '#b09a74', '#8b93b7', '#91a9aa', '#a4a5ad'])

  return { isDark, colors, seriesColors, fontFamily: 'Pretendard Variable, Pretendard, -apple-system, sans-serif' }
}
