<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAppStore } from './stores/app'

const appStore = useAppStore()

// 应用启动时进行全局初始化
onMounted(() => {
  appStore.initializeApp()
})
</script>

<template>
  <div id="app">
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: auto; /* 改为 auto 以支持滚动 */
}

.main-content {
  width: 100%;
  min-height: 100vh; /* 改为 min-height 以支持内容超出时的滚动 */
  margin: 0;
  padding: 0;
}
</style>
