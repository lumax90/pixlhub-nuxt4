import { useColorMode } from '@vueuse/core'
import type { Theme } from '~/types'

export const useTheme = () => {
  const colorMode = useColorMode({
    attribute: 'class',
    modes: {
      light: 'light',
      dark: 'dark'
    }
  })

  const theme = computed<Theme>({
    get: () => colorMode.value as Theme,
    set: (value: Theme) => {
      colorMode.value = value
    }
  })

  const isDark = computed(() => theme.value === 'dark')

  const toggleTheme = () => {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  return {
    theme,
    isDark,
    toggleTheme
  }
}
