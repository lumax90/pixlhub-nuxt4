<script setup lang="ts">
import { Moon, Sun, User, Bell } from 'lucide-vue-next'
import { NLayout, NLayoutHeader, NSpace, NButton, NDropdown, NBadge, NAvatar, NIcon, NMenu } from 'naive-ui'
import type { DropdownOption, MenuOption } from 'naive-ui'

const { isDark, toggleTheme } = useTheme()
const route = useRoute()
const router = useRouter()

// Navigation menu
const menuOptions: MenuOption[] = [
  {
    label: () => h(
      'a',
      {
        onClick: () => router.push('/dashboard')
      },
      { default: () => 'Dashboard' }
    ),
    key: 'dashboard'
  },
  {
    label: () => h(
      'a',
      {
        onClick: () => router.push('/projects')
      },
      { default: () => 'Projects' }
    ),
    key: 'projects'
  }
]

const activeKey = computed(() => {
  if (route.path.startsWith('/projects')) return 'projects'
  if (route.path.startsWith('/dashboard')) return 'dashboard'
  return 'dashboard'
})

// User menu
const userOptions: DropdownOption[] = [
  {
    label: 'Profile',
    key: 'profile'
  },
  {
    label: 'Settings',
    key: 'settings'
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: 'Sign out',
    key: 'signout'
  }
]

function handleUserSelect(key: string) {
  console.log('User menu:', key)
}
</script>

<template>
  <NLayoutHeader bordered style="height: 56px; padding: 0 24px;">
    <div class="h-full max-w-7xl mx-auto flex items-center justify-between">
      <!-- Left: Logo + Navigation -->
      <div class="flex items-center gap-8">
        <!-- Logo -->
        <NuxtLink to="/dashboard" style="text-decoration: none;">
          <div class="flex items-center gap-2.5 cursor-pointer">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="color: white;">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.9"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="flex flex-col">
              <span style="font-size: 15px; font-weight: 700; line-height: 1; letter-spacing: -0.02em;">PixlHub</span>
              <span style="font-size: 10px; line-height: 1; margin-top: 3px; opacity: 0.6;">Data Labeling Platform</span>
            </div>
          </div>
        </NuxtLink>
        
        <!-- Navigation Menu -->
        <NMenu
          v-model:value="activeKey"
          mode="horizontal"
          :options="menuOptions"
        />
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-3">
        <!-- Notifications -->
        <NotificationDropdown userId="demo-user" />
        
        <!-- Theme Toggle -->
        <NButton text circle @click="toggleTheme()">
          <template #icon>
            <NIcon :size="18">
              <component :is="isDark ? Sun : Moon" />
            </NIcon>
          </template>
        </NButton>
        
        <!-- User Menu -->
        <NDropdown
          trigger="click"
          :options="userOptions"
          @select="handleUserSelect"
          placement="bottom-end"
        >
          <NAvatar round size="small" style="cursor: pointer;">
            <NIcon>
              <User />
            </NIcon>
          </NAvatar>
        </NDropdown>
      </div>
    </div>
  </NLayoutHeader>
</template>
