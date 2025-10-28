<script setup lang="ts">
import { NMessageProvider, NDialogProvider, NNotificationProvider, NConfigProvider, darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import { useSyncService } from '~/composables/useSyncService'

// Import custom CSS
import '../assets/css/main.css'

const { isDark } = useTheme()

// Start background sync service
const { startSyncLoop, stopSyncLoop } = useSyncService()

onMounted(() => {
  startSyncLoop()
})

onUnmounted(() => {
  stopSyncLoop()
})

// Theme overrides for consistency
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#3B82F6',
    primaryColorHover: '#2563EB',
    primaryColorPressed: '#1D4ED8'
  }
}
</script>

<template>
  <NConfigProvider :theme="isDark ? darkTheme : null" :theme-overrides="themeOverrides">
    <NMessageProvider>
      <NNotificationProvider>
        <NDialogProvider>
          <NuxtLayout>
            <NuxtPage :key="$route.fullPath" />
          </NuxtLayout>
        </NDialogProvider>
      </NNotificationProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>
