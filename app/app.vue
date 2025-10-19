<script setup lang="ts">
// Import custom CSS
import '../assets/css/main.css'
</script>

<template>
  <NuxtLayout>
    <NuxtPage :key="$route.fullPath" />
  </NuxtLayout>
</template>
