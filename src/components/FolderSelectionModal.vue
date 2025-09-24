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
          <!-- 使用全局错误弹窗替代本地错误横幅 -->

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
  error: [message: string, details?: string]
}>()

const customFolderInput = ref<HTMLInputElement>()
// 路径输入相关
const inputPath = ref('')
const pathError = ref('')
const showAddForm = ref(false)
const showFoldersModal = ref(false)
const scanError = ref('')
const scanErrorDetails = ref('')

// 扫描状态与目录数据
const currentFolderPath = ref('')
const folderFiles = ref<NCMFile[]>([])
const isScanning = ref(false)
const defaultMusicFolders = ref<DefaultFolder[]>([])
const newFolder = ref<{ name: string; path: string; description?: string }>({ name: '', path: '', description: '' })

// 计算属性：输入路径合法性与添加目录表单可用性
const isValidPath = computed(() => {
  const path = inputPath.value.trim()
  if (!path) return false
  return !pathError.value
})
const canAddFolder = computed(() => {
  return newFolder.value.name.trim().length > 0 && newFolder.value.path.trim().length > 0
})

const clearScanError = () => {
  scanError.value = ''
  scanErrorDetails.value = ''
}

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
    clearScanError()

    console.log('🔍 开始扫描文件夹:', path)

    // 先检查目录是否存在，避免直接抛错导致用户没有提示
    if (window.electronAPI && window.electronAPI.checkFileExists) {
      const exists = await window.electronAPI.checkFileExists(path)
      if (!exists) {
        emit('error', '指定的目录不存在', `路径: ${path}\n\n请检查路径是否正确，或在常用目录中手动修改用户名后再试。`)
        return
      }
    }

    if (window.electronAPI) {
      const result = await window.electronAPI.scanFolder(path)
      console.log('📂 扫描结果:', result)

      if (result && result.files) {
        folderFiles.value = result.files
        console.log(`✅ 找到 ${result.files.length} 个 NCM 文件`)
        // 与“选择文件夹”逻辑保持一致：扫描到文件后直接进入处理流程
        showFoldersModal.value = false
        emit('folderSelected', path)
      } else {
        folderFiles.value = []
        console.log('❌ 未找到任何 NCM 文件')
      }
    } else {
      console.warn('⚠️ 非 Electron 环境，无法扫描文件夹')
      folderFiles.value = []
      emit('error', '无法在当前环境扫描文件夹', '请使用桌面应用以进行扫描。')
    }
  } catch (error: unknown) {
    console.error('扫描文件夹失败:', error)
    folderFiles.value = []

    // 显示友好的错误提示
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('文件夹不存在') || message.includes('指定的目录不存在')) {
      emit('error', '指定的目录不存在', `路径: ${path}\n\n请检查路径是否正确，或选择其他目录。`)
    } else {
      emit('error', '扫描文件夹时发生错误', message)
    }
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
      description: (newFolder.value.description ?? '').trim() || '用户自定义目录'
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

// 初始化默认目录（自动替换Windows当前用户名）
const initializeDefaultFolders = async () => {
  let username = '用户名'
  try {
    if (window.electronAPI && typeof window.electronAPI.getCurrentUsername === 'function') {
      const u = await window.electronAPI.getCurrentUsername()
      if (u && typeof u === 'string' && u !== 'Unknown') {
        username = u
      }
    }
  } catch (error) {
    console.warn('获取当前用户名失败，使用占位符用户名', error)
  }

  const baseWin = `C:\\Users\\${username}`
  const candidates: DefaultFolder[] = [
    {
      name: '网易云 - 下载目录',
      path: `${baseWin}\\Music\\CloudMusic\\VipSongsDownload`,
      icon: '🎵',
      description: '网易云音乐会员歌曲默认下载目录（不同用户名/安装方式可能不存在）'
    },
    // {
    //   name: '下载',
    //   path: `${baseWin}\\Downloads`,
    //   icon: '📥',
    //   description: '系统默认下载目录（可能放有NCM文件）'
    // },
    // {
    //   name: '音乐',
    //   path: `${baseWin}\\Music`,
    //   icon: '🎼',
    //   description: '系统音乐目录'
    // },
    // {
    //   name: '桌面',
    //   path: `${baseWin}\\Desktop`,
    //   icon: '🖥️',
    //   description: '桌面目录（若你把NCM放在桌面）'
    // }
  ]

  // 不做存在性过滤，按照你的需求保留功能，仅在点击预览时提示不存在
  defaultMusicFolders.value = candidates
}
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
.error-banner {
  border: 2px solid #ef4444;
  background: #fef2f2;
  color: #991b1b;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}
.error-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.error-details {
  white-space: pre-wrap;
  font-size: 0.9rem;
  line-height: 1.4;
}
.error-close {
  margin-top: 10px;
  padding: 6px 12px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.error-close:hover {
  background: #dc2626;
}
</style>
