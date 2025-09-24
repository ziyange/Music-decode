<template>
  <div class="folder-selector-container">
    <!-- 路径输入区域 -->
    <div class="path-input-section">
      <div class="input-group">
        <input
          v-model="inputPath"
          type="text"
          class="path-input"
          placeholder="请输入包含音乐文件的文件夹路径，例如：C:\Users\用户名\Music\CloudMusic"
          @input="handlePathInput"
          @paste="handlePathPaste"
          @keyup.enter="confirmPath"
        />
        <button @click="selectCustomFolder" class="browse-btn" title="选择包含音乐文件的文件夹（不是选择文件）">
          📂 选择文件夹
        </button>
        <button @click="showFoldersModal = true" class="common-folders-btn-inline" title="常用音乐目录">
          🎵 常用目录
        </button>
      </div>
      <div v-if="pathError" class="path-error">{{ pathError }}</div>
    </div>

    <!-- 使用说明 -->
     <div class="usage-tips">
       <div class="tip-item">
         <span class="tip-icon">💡</span>
         <span class="tip-text">点击"选择文件夹"按钮，选择包含音乐文件的文件夹（不是选择单个文件）</span>
       </div>
       <div class="tip-item">
         <span class="tip-icon">📂</span>
         <span class="tip-text">选择包含NCM文件的文件夹，系统将自动扫描并显示可转换的文件</span>
       </div>
       <div class="tip-item">
         <span class="tip-icon">✅</span>
         <span class="tip-text">选择文件夹后将直接进入文件选择界面</span>
       </div>
     </div>

    <!-- 扫描中提示 -->
    <div v-if="isScanning" class="scanning-indicator">
      <div class="spinner"></div>
      <span>正在扫描文件夹...</span>
    </div>

    <!-- 常用音乐目录弹窗 -->
    <div v-if="showFoldersModal" class="modal-overlay" @click="closeFoldersModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>🎵 常用音乐目录</h3>
          <button @click="closeFoldersModal" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <!-- 添加按钮 -->
          <div class="add-section">
            <button @click="showAddForm = !showAddForm" class="add-btn">
              {{ showAddForm ? '取消' : '+ 添加新目录' }}
            </button>
          </div>

          <!-- 添加新目录表单 -->
          <div v-if="showAddForm" class="add-form">
            <div class="form-row">
              <input
                v-model="newFolder.name"
                type="text"
                placeholder="目录名称"
                class="form-input"
              />
              <input
                v-model="newFolder.path"
                type="text"
                placeholder="目录路径"
                class="form-input"
              />
              <input
                v-model="newFolder.description"
                type="text"
                placeholder="描述（可选）"
                class="form-input"
              />
              <button @click="addNewFolder" class="save-btn" :disabled="!canAddFolder">保存</button>
            </div>
          </div>

          <!-- 默认目录列表 -->
          <div class="default-folders-modal">
            <div v-for="(folder, index) in defaultMusicFolders"
                 :key="folder.name"
                 class="folder-item-modal"
                 @click="previewFolder(folder.path)">
              <div class="folder-icon">{{ folder.icon }}</div>
              <div class="folder-info-modal">
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-path">{{ folder.path }}</div>
              </div>
              <div class="folder-actions">
                <button @click.stop="previewFolder(folder.path)" class="btn-select">预览</button>
                <button @click.stop="editFolder(index)" class="btn-edit" title="编辑">✏️</button>
                <button @click.stop="deleteFolder(index)" class="btn-delete" title="删除">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件选择器 -->
    <input ref="customFolderInput"
           type="file"
           webkitdirectory
           @change="handleCustomFolderSelect"
           style="display: none">
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { NCMFile } from '../utils/ncmDecoder'

interface DefaultFolder {
  name: string
  path: string
  icon: string
  description: string
}

const emit = defineEmits<{
  close: []
  folderSelected: [path: string]
}>()

const customFolderInput = ref<HTMLInputElement>()
// 路径输入相关
const inputPath = ref('')
const pathError = ref('')
const showAddForm = ref(false)
const showFoldersModal = ref(false)

// 文件夹预览相关
const currentFolderPath = ref('')
const folderFiles = ref<NCMFile[]>([])
const isScanning = ref(false)

// 新文件夹表单
const newFolder = ref({
  name: '',
  path: '',
  description: ''
})

// 默认音乐文件夹列表
const defaultMusicFolders = ref<DefaultFolder[]>([])

const getCurrentUsername = async (): Promise<string> => {
  // 在浏览器环境中，尝试从不同来源获取用户名
  if (typeof window !== 'undefined') {
    // 尝试从Electron API获取
    if (window.electronAPI && window.electronAPI.getCurrentUsername) {
      try {
        const username = await window.electronAPI.getCurrentUsername()
        return username || '用户名'
      } catch (error) {
        console.warn('无法从Electron API获取用户名:', error)
      }
    }

    // 尝试从环境变量获取（如果可用）
    if (typeof process !== 'undefined' && process.env) {
      return process.env.USERNAME || process.env.USER || '用户名'
    }

    // 尝试从URL或其他浏览器API获取
    try {
      // 这里可以添加其他获取用户名的方法
      return '用户名'
    } catch (error) {
      console.warn('无法获取用户名:', error)
    }
  }

  return '用户名'
}

// 初始化默认文件夹
const initializeDefaultFolders = async () => {
  const username = await getCurrentUsername()

  if (typeof window !== 'undefined' && window.navigator.platform.includes('Win')) {
    // Windows 系统
    defaultMusicFolders.value = [
      {
        name: '网易云音乐',
        path: `C:\\Users\\${username}\\Music\\CloudMusic\\VipSongsDownload`,
        icon: '🎵',
        description: '网易云音乐(会员音乐)默认下载目录'
      },
      // {
      //   name: 'QQ音乐',
      //   path: `C:\\Users\\${username}\\Music\\QQMusic`,
      //   icon: '🎶',
      //   description: 'QQ音乐默认下载目录'
      // },
      // {
      //   name: '酷狗音乐',
      //   path: `C:\\Users\\${username}\\Music\\KuGou`,
      //   icon: '🎤',
      //   description: '酷狗音乐默认下载目录'
      // },
      // {
      //   name: '音乐文件夹',
      //   path: `C:\\Users\\${username}\\Music`,
      //   icon: '🎼',
      //   description: 'Windows 默认音乐文件夹'
      // },
      // {
      //   name: '下载文件夹',
      //   path: `C:\\Users\\${username}\\Downloads`,
      //   icon: '⬇️',
      //   description: 'Windows 默认下载文件夹'
      // }
    ]
  } else {
    // 其他系统（macOS, Linux等）
    defaultMusicFolders.value = [
      {
        name: '音乐文件夹',
        path: 'C:\\Users\\用户名\\Music',
        icon: '🎼',
        description: 'Windows 默认音乐文件夹（请手动修改用户名）'
      },
      {
        name: '下载文件夹',
        path: 'C:\\Users\\用户名\\Downloads',
        icon: '⬇️',
        description: 'Windows 默认下载文件夹（请手动修改用户名）'
      }
    ]
  }
}

// 计算属性
const isValidPath = computed(() => {
  return inputPath.value.trim().length > 0 && !pathError.value
})

const canAddFolder = computed(() => {
  return newFolder.value.name.trim() && newFolder.value.path.trim()
})

// 路径输入处理
const handlePathInput = () => {
  pathError.value = ''
  validatePath(inputPath.value)
}

const handlePathPaste = () => {
  setTimeout(() => {
    validatePath(inputPath.value)
  }, 0)
}

const validatePath = (path: string) => {
  if (!path.trim()) {
    pathError.value = ''
    return
  }

  // 简单的路径格式验证
  const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/
  const unixPathRegex = /^\/(?:[^\/\0]+\/)*[^\/\0]*$/

  if (!windowsPathRegex.test(path) && !unixPathRegex.test(path)) {
    pathError.value = '路径格式不正确'
  } else {
    pathError.value = ''
  }
}

const confirmPath = () => {
  if (isValidPath.value) {
    const path = inputPath.value.trim()
    emit('folderSelected', path)
  }
}

// 关闭常用目录弹窗
const closeFoldersModal = () => {
  showFoldersModal.value = false
  showAddForm.value = false
}

// 预览文件夹内容
const previewFolder = async (path: string) => {
  try {
    currentFolderPath.value = path
    isScanning.value = true
    folderFiles.value = []

    console.log('🔍 开始扫描文件夹:', path)

    if (window.electronAPI) {
      const result = await window.electronAPI.scanFolder(path)
      console.log('📂 扫描结果:', result)

      if (result && result.files) {
        folderFiles.value = result.files
        console.log(`✅ 找到 ${result.files.length} 个 NCM 文件`)
      } else {
        folderFiles.value = []
        console.log('❌ 未找到任何 NCM 文件')
      }
    } else {
      console.warn('⚠️ 非 Electron 环境，无法扫描文件夹')
      folderFiles.value = []
    }
  } catch (error) {
    console.error('扫描文件夹失败:', error)
    folderFiles.value = []
  } finally {
    isScanning.value = false
  }
}

// 浏览文件夹
const selectCustomFolder = async () => {
  try {
    // 使用 Electron API 选择文件夹，获取绝对路径
    if (window.electronAPI) {
      const result = await window.electronAPI.selectFolder()
      console.log('🔍 Electron selectFolder 返回结果:', result)
      if (result && typeof result === 'string') {
        console.log('📂 选择的文件夹绝对路径:', result)
        // 直接确认选择，不预览文件夹内容
        emit('folderSelected', result)
      }
    } else {
      // 如果不在 Electron 环境中，回退到文件选择器
      customFolderInput.value?.click()
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
    // 回退到文件选择器
    customFolderInput.value?.click()
  }
}

const handleCustomFolderSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (files && files.length > 0) {
    const firstFile = files[0]
    console.log('⚠️ 使用文件选择器回退方案，可能路径不完整')
    console.log('firstFile.webkitRelativePath:', firstFile.webkitRelativePath)

    // 尝试构建完整路径
    const folderPath = firstFile.webkitRelativePath.split('/')[0]
    console.log('📁 提取的文件夹名:', folderPath)

    // 警告用户这可能不是完整路径
    console.warn('⚠️ 文件选择器只能获取相对路径，建议使用浏览按钮')

    // 直接确认选择，不预览文件夹内容
    emit('folderSelected', folderPath)
  }
}

// 添加新文件夹
const addNewFolder = () => {
  if (canAddFolder.value) {
    const folder: DefaultFolder = {
      name: newFolder.value.name.trim(),
      path: newFolder.value.path.trim(),
      icon: '📁',
      description: newFolder.value.description.trim() || '用户自定义目录'
    }

    defaultMusicFolders.value.push(folder)

    // 重置表单
    newFolder.value = { name: '', path: '', description: '' }
    showAddForm.value = false

    // 保存到本地存储
    saveDefaultFolders()
  }
}

// 编辑文件夹
const editFolder = (index: number) => {
  const folder = defaultMusicFolders.value[index]
  newFolder.value = { ...folder }
  showAddForm.value = true

  // 删除原来的项目，等待用户保存新的
  defaultMusicFolders.value.splice(index, 1)
}

// 删除文件夹
const deleteFolder = (index: number) => {
  if (confirm('确定要删除这个目录吗？')) {
    defaultMusicFolders.value.splice(index, 1)
    saveDefaultFolders()
  }
}

// 保存默认文件夹到本地存储
const saveDefaultFolders = () => {
  try {
    localStorage.setItem('music-decoder-default-folders', JSON.stringify(defaultMusicFolders.value))
  } catch (error) {
    console.error('保存默认文件夹失败:', error)
  }
}

// 从本地存储加载默认文件夹
const loadDefaultFolders = async () => {
  try {
    const saved = localStorage.getItem('music-decoder-default-folders')
    if (saved) {
      const folders = JSON.parse(saved)
      if (Array.isArray(folders)) {
        defaultMusicFolders.value = folders
        return // 如果有保存的文件夹，直接使用
      }
    }
  } catch (error) {
    console.error('加载默认文件夹失败:', error)
  }

  // 如果没有保存的文件夹，初始化默认文件夹
  await initializeDefaultFolders()
}

// 组件挂载时初始化
onMounted(async () => {
  await loadDefaultFolders()
})
</script>

<style scoped>
.folder-selector-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

/* 路径输入区域 */
.path-input-section {
  margin-bottom: 32px;
  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

/* 使用说明 */
.usage-tips {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  border-radius: 12px;
  border: 1px solid #0ea5e9;
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.tip-text {
  color: #0f172a;
  font-size: 0.95rem;
  line-height: 1.5;
}

.input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.path-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
}

.path-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.browse-btn, .common-folders-btn-inline {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.browse-btn {
  background: #6b7280;
  color: white;
}

.browse-btn:hover {
  background: #4b5563;
}

.common-folders-btn-inline {
  background: #3b82f6;
  color: white;
}

.common-folders-btn-inline:hover {
  background: #2563eb;
}

.path-error {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 4px;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.add-section {
  margin-bottom: 20px;
  text-align: center;
}

/* 目录浏览器样式 */
.default-folders-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.folder-item-modal {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.folder-item-modal:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.folder-item-modal .folder-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 28px;
  text-align: center;
}

.folder-info-modal {
  flex: 1;
}

.folder-info-modal .folder-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  font-size: 0.95rem;
}

.folder-info-modal .folder-path {
  font-size: 0.8rem;
  color: #6b7280;
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.add-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #2563eb;
}

/* 添加表单 */
.add-form {
  padding: 20px 24px;
  background: #fef3c7;
  border-bottom: 1px solid #e2e8f0;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.save-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.save-btn:hover:not(:disabled) {
  background: #059669;
}

.save-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.folder-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.btn-select {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-select:hover {
  background: #2563eb;
}

.btn-edit, .btn-delete {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #fef3c7;
}

.btn-delete:hover {
  background: #fee2e2;
}

/* 文件夹预览区域样式 */
.folder-preview {
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.file-count {
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.file-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  margin-bottom: 16px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
  gap: 12px;
}

.file-item:hover {
  background: #f8fafc;
}

.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  color: #374151;
  font-weight: 500;
  word-break: break-all;
}

.file-type {
  background: #e5e7eb;
  color: #6b7280;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  flex-shrink: 0;
}

.file-type.ncm {
  background: #fef3c7;
  color: #d97706;
}

.file-type.mp3 {
  background: #dbeafe;
  color: #2563eb;
}

.file-type.flac {
  background: #dcfce7;
  color: #16a34a;
}

.file-size {
  color: #9ca3af;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

.file-item:hover {
  background: #f8fafc;
}

.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  margin-right: 12px;
  font-size: 16px;
}

.file-name {
  flex: 1;
  color: #374151;
  font-size: 0.875rem;
  word-break: break-all;
}

.file-size {
  color: #6b7280;
  font-size: 0.75rem;
  margin-left: 12px;
}

.more-files {
  padding: 12px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  font-style: italic;
  background: #f8fafc;
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: #059669;
}

.cancel-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #4b5563;
}

/* 无文件警告样式 */
.no-files-warning {
  margin-top: 20px;
  padding: 20px;
  background: #fef3c7;
  border-radius: 12px;
  border: 2px solid #f59e0b;
  text-align: center;
}

.warning-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.warning-icon {
  font-size: 24px;
}

.warning-text p {
  margin: 0;
  color: #92400e;
  font-weight: 500;
}

.folder-path {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  word-break: break-all;
  margin-top: 8px;
}

.retry-btn {
  background: #f59e0b;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #d97706;
}

/* 扫描指示器样式 */
.scanning-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  color: #3b82f6;
  font-size: 0.875rem;
  font-weight: 500;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }

  .form-row {
    flex-direction: column;
  }

  .folder-item-modal {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    padding: 12px;
  }

  .folder-item-modal .folder-icon {
    margin-right: 0;
    margin-bottom: 4px;
  }

  .folder-info-modal {
    text-align: center;
  }

  .folder-actions {
    margin-left: 0;
    justify-content: center;
  }

  .preview-actions {
    flex-direction: column;
  }

  .warning-content {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .path-input-section {
    margin: 0 -16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .modal-body {
    padding: 16px;
  }

  .folder-preview {
    margin: 20px -16px 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
</style>
