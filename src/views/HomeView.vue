<template>
  <div class="home">
    <!-- 加载蒙版 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h2>🎵 音乐解密器</h2>
        <p>正在初始化应用...</p>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
          </div>
          <span class="progress-text">{{ loadingProgress }}%</span>
        </div>
      </div>
    </div>

    <!-- 主应用界面 -->
    <div v-else class="app-interface">
      <!-- 环境检测组件 -->
      <EnvironmentCheck />

      <!-- 应用标题 -->
      <div class="app-header-section">
        <!-- 导航菜单 -->
        <nav class="app-nav">
          <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">首页</span>
          </router-link>
          <router-link to="/about" class="nav-link" :class="{ active: $route.path === '/about' }">
            <span class="nav-icon">ℹ️</span>
            <span class="nav-text">关于</span>
          </router-link>
        </nav>

        <h1 class="app-title">🎵音乐解密</h1>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
      <!-- 应用描述 -->
      <div class="app-header">
        <p class="app-description">支持多种音乐文件格式解密转换（目前仅支持网易云.ncm文件，更多格式持续更新中），快速批量处理您的音乐文件</p>
      </div>

      <!-- 步骤指示器 -->
      <div class="steps-indicator">
        <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
          <div class="step-number">1</div>
          <div class="step-label">选择文件夹</div>
        </div>
        <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
          <div class="step-number">2</div>
          <div class="step-label">选择文件</div>
        </div>
        <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
          <div class="step-number">3</div>
          <div class="step-label">输出目录</div>
        </div>
        <div class="step" :class="{ active: currentStep >= 4 }">
          <div class="step-number">4</div>
          <div class="step-label">开始转换</div>
        </div>
      </div>

      <!-- 步骤内容区域 -->
      <div class="step-content-wrapper">
        <!-- 步骤1: 选择文件夹 -->
        <div v-if="currentStep === 1" class="step-content">
          <div class="card">
            <h2>📁 选择NCM文件夹</h2>
            <p>请选择包含NCM文件的文件夹，程序将自动扫描并直接进入文件选择界面</p>

            <!-- 文件夹选择组件 -->
            <FolderSelectionModal
              :visible="true"
              @folder-selected="handleModalFolderSelect" />

            <!-- 显示选中的文件夹路径 -->
            <div v-if="selectedFolder" class="selected-folder">
              <div class="folder-display">
                <div class="folder-icon">📁</div>
                <div class="folder-info">
                  <div class="folder-label">已选择文件夹:</div>
                  <div class="folder-path">{{ selectedFolder }}</div>
                </div>
              </div>

              <!-- 文件统计信息直接显示，不需要弹窗 -->
              <div class="file-stats-section">
                <FileStatistics
                  :selected-path="selectedFolder"
                  @confirm="handleStatsConfirm"
                  @select-another-folder="resetFolderSelection" />
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤2: 选择文件 -->
        <div v-if="currentStep === 2" class="step-content">
          <div class="card">
            <h2>🎵 选择要转换的NCM文件</h2>
            <p>找到 {{ ncmFiles.length }} 个NCM文件，请选择需要转换的文件</p>

            <div class="file-selection-header">
              <div class="selection-options">
                <label class="checkbox-container">
                  <input type="checkbox"
                         v-model="selectUndownloaded"
                         @change="toggleSelectUndownloaded">
                  <span class="checkmark"></span>
                  选择未转换的NCM文件 ({{ undownloadedFiles.length }}/{{ ncmFiles.length }})
                </label>

                <label class="checkbox-container">
                  <input type="checkbox"
                         v-model="selectAll"
                         @change="toggleSelectAll">
                  <span class="checkmark"></span>
                  全选 ({{ selectedFiles.length }}/{{ ncmFiles.length }})
                </label>
              </div>
            </div>

            <div class="file-list">
              <div v-for="(file, index) in ncmFiles"
                   :key="index"
                   class="file-item">
                <label class="checkbox-container">
                  <input type="checkbox"
                         v-model="file.selected"
                         @change="updateSelectAll">
                  <span class="checkmark"></span>

                  <!-- 已下载指示器 -->
                  <div v-if="file.isDownloaded"
                       class="download-indicator"
                       :title="getDownloadTooltip(file)">
                    ❓
                  </div>

                  <div class="file-info">
                    <div class="file-name-container">
                      <span class="file-format-badge" :class="`format-${file.type || 'unknown'}`">
                        {{ (file.type || 'unknown').toUpperCase() }}</span>
                      <span class="file-name">{{ file.name }}</span>
                    </div>
                    <div class="file-path">{{ formatFileSize(file.size) }} • {{ file.relativePath }}</div>
                  </div>
                </label>
              </div>
            </div>

            <div class="action-buttons">
              <button @click="goBack" class="btn btn-secondary">返回</button>
              <button @click="nextStep"
                      :disabled="selectedFiles.length === 0"
                      class="btn btn-primary">
                下一步 ({{ selectedFiles.length }} 个文件)
              </button>
            </div>
          </div>
        </div>

        <!-- 步骤3: 选择输出目录 -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="card">
            <h2>📂 选择输出目录</h2>
            <p>转换后的文件将保存到此目录</p>

            <div class="output-options">
              <label class="radio-option">
                <input type="radio"
                       value="source"
                       v-model="outputOption">
                <span class="radio-mark"></span>
                <div class="option-content">
                  <div class="option-title">保存到源文件目录</div>
                  <div class="option-desc">在原文件相同位置创建转换后的文件</div>
                </div>
              </label>

              <label class="radio-option">
                <input type="radio"
                       value="custom"
                       v-model="outputOption">
                <span class="radio-mark"></span>
                <div class="option-content">
                  <div class="option-title">自定义输出目录</div>
                  <div class="option-desc">选择一个特定的文件夹保存所有转换后的文件</div>
                </div>
              </label>
            </div>

            <div v-if="outputOption === 'custom'" class="custom-output">
              <button @click="selectOutputFolder" class="btn btn-outline">
                选择输出文件夹
              </button>
              <div v-if="customOutputDir" class="selected-output">
                <p><strong>输出目录:</strong> {{ customOutputDir }}</p>
              </div>
            </div>

            <div class="action-buttons">
              <button @click="goBack" class="btn btn-secondary">返回</button>
              <button @click="nextStep"
                      :disabled="!canProceedToStep4"
                      class="btn btn-primary">
                下一步
              </button>
            </div>
          </div>
        </div>

        <!-- 步骤4: 开始转换 -->
        <div v-if="currentStep === 4" class="step-content">
          <div class="card">
            <h2>🚀 准备开始转换</h2>

            <div class="conversion-summary">
              <div class="summary-item">
                <span class="label">文件数量:</span>
                <span class="value">{{ selectedFiles.length }} 个</span>
              </div>
              <div class="summary-item">
                <span class="label">输出方式:</span>
                <span class="value">{{ outputOption === 'source' ? '源文件目录' : '自定义目录' }}</span>
              </div>
              <div v-if="outputOption === 'custom'" class="summary-item">
                <span class="label">输出目录:</span>
                <span class="value">{{ outputDirectory }}</span>
              </div>
            </div>

            <div v-if="!isConverting && !conversionComplete" class="action-buttons">
              <button @click="goBack" class="btn btn-secondary">返回</button>
              <button @click="handleStartConversion" class="btn btn-primary btn-large">
                开始转换
              </button>
            </div>

            <!-- 转换进度 -->
            <div v-if="isConverting" class="conversion-progress">
              <div class="progress-header">
                <h3>正在转换文件</h3>
                <span class="progress-text">{{ progress.percentage }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: progress.percentage + '%' }"></div>
              </div>
              <div class="current-file">
                {{ progress.current }} ({{ progress.completed }}/{{ progress.total }})
              </div>
            </div>

            <!-- 转换结果 -->
            <div v-if="conversionComplete" class="conversion-results">
              <h3>转换完成!</h3>
              <div class="results-summary">
                <div class="result-stat success">
                  <span class="count">{{ successCount }}</span>
                  <span class="label">成功</span>
                </div>
                <div class="result-stat error">
                  <span class="count">{{ errorCount }}</span>
                  <span class="label">失败</span>
                </div>
              </div>

              <div class="action-buttons">
                <button class="btn btn-outline" @click="openOutputFolder">
                  打开输出文件夹
                </button>
                <button class="btn btn-primary" @click="resetProcess">
                  继续添加
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- 错误弹窗 -->
    <ErrorModal
      :visible="showErrorModal"
      :message="errorModalMessage"
      :details="errorModalDetails"
      @close="closeErrorModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useNCMDecoder, type NCMFile, type ConversionResult } from '@/utils/ncmDecoder'
import FolderSelectionModal from '@/components/FolderSelectionModal.vue'
import FileStatistics from '@/components/FileStatistics.vue'
import ErrorModal from '@/components/ErrorModal.vue'
import EnvironmentCheck from '@/components/EnvironmentCheck.vue'

const {
  scanFolder,
  startConversion,
  progress,
  isConverting,
  conversionResults
} = useNCMDecoder()

// 使用全局应用状态
const appStore = useAppStore()

// 步骤控制 - 默认从步骤1开始，直接显示功能界面
const currentStep = ref(1)

// 文件夹相关
const selectedFolder = ref('')
const ncmFiles = ref<NCMFile[]>([])
const isScanning = ref(false)

// 文件选择相关
const selectAll = ref(false)
const selectUndownloaded = ref(false)

// 输出设置
const outputOption = ref('source') // 'source' | 'custom'
const customOutputDir = ref('')

// 转换状态
const conversionComplete = ref(false)

// 错误信息
const errorMessage = ref('')

// 错误弹窗相关状态
const showErrorModal = ref(false)
const errorModalMessage = ref('')
const errorModalDetails = ref('')

// 显示错误弹窗
const showError = (message: string, details?: string) => {
  errorModalMessage.value = message
  errorModalDetails.value = details || ''
  showErrorModal.value = true
}

// 关闭错误弹窗
const closeErrorModal = () => {
  showErrorModal.value = false
  errorModalMessage.value = ''
  errorModalDetails.value = ''
}
// 从全局状态获取加载状态
const isLoading = computed(() => appStore.isInitializing)
const loadingProgress = computed(() => appStore.initializationProgress)

// 清理重复的变量和方法
const selectedFiles = computed(() => ncmFiles.value.filter(file => file.selected))
const undownloadedFiles = computed(() => ncmFiles.value.filter(file => !file.isDownloaded))
const outputDirectory = computed(() => {
  return outputOption.value === 'custom' ? customOutputDir.value : selectedFolder.value
})

const successCount = computed(() => conversionResults.value.filter((r: ConversionResult) => r.success).length)
const errorCount = computed(() => conversionResults.value.filter((r: ConversionResult) => !r.success).length)

const canProceedToStep4 = computed(() => {
  if (outputOption.value === 'custom') {
    return customOutputDir.value.trim() !== ''
  }
  return true
})

// 文件夹选择相关方法
const handleModalFolderSelect = (folderPath: string) => {
  console.log('📂 用户选择文件夹:', folderPath)
  selectedFolder.value = folderPath
  console.log('✅ selectedFolder.value 已设置为:', selectedFolder.value)
  // 直接扫描文件，不显示弹窗
  scanFolderFiles()
}

const handleStatsConfirm = () => {
  // 从统计组件确认后，进入下一步
  currentStep.value = 2
}

const resetFolderSelection = () => {
  selectedFolder.value = ''
  ncmFiles.value = []
}

const scanFolderFiles = async () => {
  try {
    errorMessage.value = ''
    isScanning.value = true

    // 调试：打印selectedFolder的值
    console.log('🔍 开始扫描文件夹:', selectedFolder.value)
    console.log('📁 文件夹路径类型:', typeof selectedFolder.value)
    console.log('📁 文件夹路径长度:', selectedFolder.value.length)

    // 验证文件夹路径
    if (!selectedFolder.value || selectedFolder.value.trim() === '') {
      throw new Error('请先选择一个文件夹')
    }

    // 使用 ncmDecoder 扫描文件
    const result = await scanFolder(selectedFolder.value)
    console.log('📄 扫描结果:', result.files.length, '个文件')
    ncmFiles.value = result.files

    if (result.files.length === 0) {
      errorMessage.value = '在选定文件夹中未找到NCM文件'
    } else {
      // 自动进入下一步，提升用户体验
      currentStep.value = 2
    }
  } catch (error) {
    // 提取友好的错误信息并显示弹窗
    let friendlyMessage = '扫描文件夹失败'
    let errorDetails = ''

    if (error instanceof Error) {
      if (error.message.includes('文件夹不存在') || error.message.includes('指定的目录不存在')) {
        const pathMatch = error.message.match(/[C-Z]:[\\\/][^\\\/\n\r]*/)
        const path = pathMatch ? pathMatch[0] : '指定路径'
        friendlyMessage = '指定的目录不存在'
        errorDetails = `路径: ${path}\n\n请检查路径是否正确，或选择其他目录。`
      } else {
        friendlyMessage = '扫描文件夹时发生错误'
        errorDetails = error.message
      }
    }

    // 显示错误弹窗而不是顶部提示
    showError(friendlyMessage, errorDetails)
  } finally {
    isScanning.value = false
  }
}

const toggleSelectAll = () => {
  ncmFiles.value.forEach(file => {
    file.selected = selectAll.value
  })
  // 当全选时，取消"选择未下载音乐"
  if (selectAll.value) {
    selectUndownloaded.value = false
  }
}

const toggleSelectUndownloaded = () => {
  ncmFiles.value.forEach(file => {
    if (!file.isDownloaded) {
      file.selected = selectUndownloaded.value
    } else if (selectUndownloaded.value) {
      // 如果选择未下载音乐，取消已下载文件的选择
      file.selected = false
    }
  })
  // 当选择未下载音乐时，取消全选
  if (selectUndownloaded.value) {
    selectAll.value = false
  }
  updateSelectAll()
}

const updateSelectAll = () => {
  const selectedCount = selectedFiles.value.length
  const totalCount = ncmFiles.value.length
  const undownloadedCount = undownloadedFiles.value.length
  const selectedUndownloadedCount = undownloadedFiles.value.filter(f => f.selected).length

  if (selectedCount === 0) {
    selectAll.value = false
    selectUndownloaded.value = false
  } else if (selectedCount === totalCount) {
    selectAll.value = true
    selectUndownloaded.value = false
  } else if (selectedUndownloadedCount === undownloadedCount && undownloadedCount > 0) {
    selectUndownloaded.value = true
    selectAll.value = false
  } else {
    selectAll.value = false
    selectUndownloaded.value = false
  }
}

const getDownloadTooltip = (file: NCMFile): string => {
  if (file.downloadPaths && file.downloadPaths.length > 0) {
    return `该音乐已下载至：${file.downloadPaths.join('、')}`
  }
  return '该音乐已下载'
}

const selectOutputFolder = async () => {
  try {
    if (window.electronAPI) {
      const result = await window.electronAPI.selectFolder()
      if (result && typeof result === 'string') {
        customOutputDir.value = result
      }
    }
  } catch (error) {
    console.error('选择输出文件夹失败:', error)
  }
}

const nextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  }
}

const goBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleStartConversion = async () => {
  try {
    conversionComplete.value = false

    await startConversion(selectedFiles.value, outputDirectory.value)
    conversionComplete.value = true
  } catch (error) {
    errorMessage.value = '转换失败: ' + (error instanceof Error ? error.message : '未知错误')
  }
}

const resetProcess = () => {
  currentStep.value = 1
  selectedFolder.value = ''
  ncmFiles.value = []
  selectAll.value = false
  selectUndownloaded.value = false
  outputOption.value = 'source'
  customOutputDir.value = ''
  conversionComplete.value = false
  errorMessage.value = ''
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const openOutputFolder = async () => {
  try {
    let folderPath = ''

    // 根据输出选项确定要打开的文件夹路径
    if (outputOption.value === 'custom') {
      // 自定义输出目录
      folderPath = customOutputDir.value
    } else {
      // 源文件目录 - 使用第一个转换成功的文件所在目录
      const successfulResults = conversionResults.value.filter((r: ConversionResult) => r.success)
      if (successfulResults.length > 0) {
        // 从第一个成功的文件路径中提取目录
        const firstSuccessFile = selectedFiles.value.find(f =>
          successfulResults.some((r: ConversionResult) => r.filename?.includes(f.name.replace('.ncm', '')))
        )
        if (firstSuccessFile) {
          folderPath = firstSuccessFile.path.substring(0, firstSuccessFile.path.lastIndexOf('\\'))
        }
      }

      // 如果没有成功的文件，使用选中的源文件夹
      if (!folderPath) {
        folderPath = selectedFolder.value
      }
    }

    if (!folderPath) {
      alert('无法确定输出文件夹路径')
      return
    }

    // 尝试使用不同的方法打开文件夹
    if (window.electronAPI?.openFolder) {
      // 如果是Electron应用，使用Electron API
      await window.electronAPI.openFolder(folderPath)
    } else {
      // 在浏览器环境中，使用系统命令
      await openFolderInBrowser(folderPath)
    }

  } catch (error) {
    console.error('打开输出文件夹失败:', error)
    alert(`打开文件夹失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 在浏览器环境中打开文件夹的辅助方法
const openFolderInBrowser = async (folderPath: string) => {
  // 在Web环境中，由于安全限制，无法直接打开系统特定路径
  // 我们提供备用方案：显示路径并复制到剪贴板
  const message = `输出文件夹路径：\n${folderPath}\n\n请手动打开此路径查看转换后的文件。`

  // 尝试复制路径到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(folderPath).then(() => {
      alert(message + '\n\n路径已复制到剪贴板！')
    }).catch(() => {
      alert(message)
    })
  } else {
    alert(message)
  }
}

// 组件挂载时检查应用状态
onMounted(async () => {
  // 如果应用还未初始化，等待初始化完成
  if (!appStore.isInitialized && !appStore.isInitializing) {
    await appStore.initializeApp()
  }

  // 显示初始化错误（如果有）
  if (appStore.initializationError) {
    errorMessage.value = appStore.initializationError
  }

  console.log('🏠 首页组件已挂载，应用状态:', {
    isInitialized: appStore.isInitialized,
    isElectronEnvironment: appStore.isElectronEnvironment
  })
})
</script>

<style scoped>
.home {
  width: 100%;
  min-height: 100vh;
  padding: 0;
  box-sizing: border-box;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

/* 加载蒙版样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: white;
  max-width: 400px;
  padding: 40px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 30px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 15px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.loading-content p {
  font-size: 1.2rem;
  margin: 0 0 30px 0;
  opacity: 0.9;
}

.loading-progress {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.9;
}

/* 主应用界面 */
.app-interface {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 应用标题 */
.app-header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.app-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 导航菜单 */
.app-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: white;
}

.nav-link.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-text {
  font-size: 0.95rem;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 应用标题和描述 */
.app-header {
  text-align: left;
  margin-bottom: 40px;
  color: white;
}

.app-description {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 步骤内容包装器 */
.step-content-wrapper {
  width: 100%;
}

.step-content {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* 错误提示 */
.error-message {
  background: linear-gradient(135deg, #fee2e2, #fef2f2);
  color: #dc2626;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #dc3545;
  margin-bottom: 20px;
  font-weight: 500;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
  white-space: pre-line;
  line-height: 1.6;
  animation: slideInDown 0.3s ease-out;
  transition: all 0.3s ease;
}

.error-message:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.15);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 步骤指示器 */
.steps-indicator {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  position: relative;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.steps-indicator::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 25%;
  right: 25%;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  z-index: 1;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
  z-index: 2;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.step.active .step-number {
  background: #007bff;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.4);
}

.step.completed .step-number {
  background: #28a745;
  color: white;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
}

.step-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-weight: 500;
}

.step.active .step-label {
  color: white;
  font-weight: 600;
}

/* 卡片样式 */
.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  width: 100%;
}

.card h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.card p {
  margin: 0 0 30px 0;
  color: #666;
  font-size: 16px;
  line-height: 1.6;
}

/* 按钮样式 */
.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d, #545b62);
  color: white;
  box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
}

.btn-secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 117, 125, 0.4);
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 2px solid #007bff;
  backdrop-filter: blur(10px);
}

.btn-outline:hover:not(:disabled) {
  background: #007bff;
  color: white;
  transform: translateY(-2px);
}

.btn-large {
  padding: 18px 36px;
  font-size: 18px;
  min-width: 200px;
}

/* 文件夹选择器 */
.folder-selector {
  text-align: center;
  margin-bottom: 20px;
}

.selected-folder {
  background: rgba(248, 249, 250, 0.8);
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #28a745;
  margin-top: 20px;
}

/* 文件列表 */
.file-selection-header {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  border-bottom: none;
}

.file-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(229, 231, 235, 0.5);
}

.file-item {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(240, 240, 240, 0.5);
  transition: background-color 0.2s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background: rgba(249, 250, 251, 0.8);
}

/* 复选框样式 */
.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  padding-left: 35px;
  user-select: none;
}

.checkbox-container input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  height: 22px;
  width: 22px;
  background-color: #fff;
  border: 2px solid #ddd;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.checkbox-container:hover input ~ .checkmark {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.checkbox-container input:checked ~ .checkmark {
  background-color: #007bff;
  border-color: #007bff;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-container input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-container .checkmark:after {
  left: 7px;
  top: 3px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.file-info {
  flex: 1;
}

.file-name-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.file-format-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* 不同格式的颜色 */
.format-ncm {
  background: #ff6b6b;
  color: white;
}

.format-mp3 {
  background: #4ecdc4;
  color: white;
}

.format-flac {
  background: #45b7d1;
  color: white;
}

.format-wav {
  background: #96ceb4;
  color: white;
}

.format-aac {
  background: #feca57;
  color: #333;
}

.format-ogg {
  background: #ff9ff3;
  color: white;
}

.format-m4a {
  background: #54a0ff;
  color: white;
}

.format-wma {
  background: #5f27cd;
  color: white;
}

.format-ape {
  background: #00d2d3;
  color: white;
}

.format-opus {
  background: #ff6348;
  color: white;
}

.format-unknown {
  background: #ddd;
  color: #666;
}

.file-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
  flex: 1;
}

.file-path {
  font-size: 14px;
  color: #666;
}

/* 输出选项 */
.output-options {
  margin-bottom: 25px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  padding: 20px;
  border: 2px solid rgba(224, 224, 224, 0.5);
  border-radius: 12px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
}

.radio-option:hover {
  border-color: #007bff;
  background: rgba(248, 249, 255, 0.8);
  transform: translateY(-1px);
}

.radio-option input[type="radio"] {
  margin: 0;
  margin-right: 15px;
  margin-top: 2px;
}

.radio-mark {
  width: 22px;
  height: 22px;
  border: 2px solid #ddd;
  border-radius: 50%;
  margin-right: 15px;
  margin-top: 2px;
  position: relative;
  transition: all 0.3s ease;
}

.radio-option input[type="radio"]:checked + .radio-mark {
  border-color: #007bff;
}

.radio-option input[type="radio"]:checked + .radio-mark::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #007bff;
  border-radius: 50%;
}

.option-content {
  flex: 1;
}

.option-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  font-size: 16px;
}

.option-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.custom-output {
  margin-top: 20px;
  padding: 20px;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 12px;
}

.selected-output {
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

/* 转换摘要 */
.conversion-summary {
  background: rgba(248, 249, 250, 0.8);
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 16px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  font-weight: 600;
  color: #333;
}

/* 进度条 */
.conversion-progress {
  margin: 25px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.progress-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.progress-text {
  font-weight: 600;
  color: #007bff;
  font-size: 18px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(224, 224, 224, 0.5);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s ease;
  border-radius: 6px;
}

.current-file {
  font-size: 14px;
  color: #666;
  text-align: center;
  font-weight: 500;
}

/* 转换结果 */
.conversion-results {
  text-align: center;
}

.conversion-results h3 {
  color: #28a745;
  margin-bottom: 25px;
  font-size: 24px;
}

.results-summary {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin-bottom: 35px;
}

.result-stat {
  text-align: center;
}

.result-stat .count {
  display: block;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
}

.result-stat.success .count {
  color: #28a745;
}

.result-stat.error .count {
  color: #dc3545;
}

.result-stat .label {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

/* 文件夹显示样式 */
.folder-display {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(248, 250, 252, 0.9);
  border: 2px solid rgba(226, 232, 240, 0.5);
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

.folder-icon {
  font-size: 28px;
  margin-right: 20px;
}

.folder-info {
  flex: 1;
}

.folder-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
  font-size: 16px;
}

.folder-path {
  font-family: 'Courier New', monospace;
  color: #6b7280;
  font-size: 14px;
  word-break: break-all;
  line-height: 1.4;
}

/* 文件选择区域 */
.selection-options {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.download-indicator {
  width: 24px;
  height: 24px;
  background: #fbbf24;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-left: 10px;
  cursor: help;
  flex-shrink: 0;
}

.download-indicator:hover {
  background: #f59e0b;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .app-title {
    font-size: 2.5rem;
  }

  .app-description {
    font-size: 1.1rem;
  }

  .card {
    padding: 25px;
  }

  .steps-indicator {
    margin-bottom: 30px;
  }

  .step-number {
    width: 35px;
    height: 35px;
    font-size: 14px;
  }

  .step-label {
    font-size: 12px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .results-summary {
    gap: 30px;
  }

  .selection-options {
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 2rem;
  }

  .app-description {
    font-size: 1rem;
  }

  .steps-indicator {
    flex-wrap: wrap;
    gap: 10px;
  }

  .steps-indicator::before {
    display: none;
  }

  .step {
    flex: 0 0 calc(50% - 5px);
  }

  .card {
    padding: 20px;
  }

  .selection-options {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
