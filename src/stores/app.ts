import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  // 应用初始化状态
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const initializationProgress = ref(0)
  const initializationMessage = ref('')
  const isElectronEnvironment = ref(false)
  const initializationError = ref('')

  // 初始化应用
  const initializeApp = async () => {
    if (isInitialized.value || isInitializing.value) {
      return // 避免重复初始化
    }

    isInitializing.value = true
    initializationError.value = ''
    
    console.log('🎵 音乐解密工具启动中...')

    // 模拟加载过程
    const loadingSteps = [
      { progress: 20, message: '检查运行环境...' },
      { progress: 40, message: '初始化解码器...' },
      { progress: 60, message: '加载用户配置...' },
      { progress: 80, message: '准备用户界面...' },
      { progress: 100, message: '启动完成！' }
    ]

    try {
      for (const step of loadingSteps) {
        initializationProgress.value = step.progress
        initializationMessage.value = step.message
        console.log(`📊 ${step.message} (${step.progress}%)`)

        // 模拟异步操作延迟
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // 检查是否在Electron环境中
      console.log('🔍 检查Electron API可用性...')
      console.log('window对象:', typeof window)
      console.log('window.electronAPI:', window.electronAPI)

      if (window.electronAPI) {
        console.log('✅ Electron环境检测成功')
        console.log('可用的API方法:', Object.keys(window.electronAPI))
        isElectronEnvironment.value = true
      } else {
        console.log('⚠️ 运行在浏览器环境中，某些功能可能受限')
        isElectronEnvironment.value = false
        initializationError.value = '⚠️ 当前运行在浏览器环境中，文件夹扫描功能不可用。请使用Electron版本。'
      }

      // 延迟一点时间再完成初始化，让用户看到100%完成
      await new Promise(resolve => setTimeout(resolve, 500))

      isInitialized.value = true
      console.log('🎉 音乐解密工具初始化完成！')

    } catch (error) {
      console.error('初始化失败:', error)
      initializationError.value = '初始化失败: ' + (error instanceof Error ? error.message : '未知错误')
      // 即使初始化失败，也标记为已初始化，避免无限重试
      isInitialized.value = true
    } finally {
      isInitializing.value = false
    }
  }

  // 重置初始化状态（用于调试或重新初始化）
  const resetInitialization = () => {
    isInitialized.value = false
    isInitializing.value = false
    initializationProgress.value = 0
    initializationMessage.value = ''
    initializationError.value = ''
  }

  return {
    isInitialized,
    isInitializing,
    initializationProgress,
    initializationMessage,
    isElectronEnvironment,
    initializationError,
    initializeApp,
    resetInitialization
  }
})