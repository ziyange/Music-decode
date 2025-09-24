<template>
  <div class="file-statistics">
    <div class="stats-header">
      <h3>📊 文件统计</h3>
      <div class="selected-path">
        <span class="path-label">当前目录:</span>
        <span class="path-value">{{ selectedPath }}</span>
      </div>
    </div>

    <div class="stats-grid">
      <div v-for="stat in fileStats"
           :key="stat.extension"
           class="stat-card"
           :class="{ 'primary': stat.extension === '.ncm' }">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-info">
          <div class="stat-count">{{ stat.count }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-extension">{{ stat.extension }}</div>
        </div>
      </div>
    </div>

    <div class="stats-summary">
      <div class="summary-item">
        <span class="summary-label">总文件数:</span>
        <span class="summary-value">{{ totalFiles }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">可转换文件:</span>
        <span class="summary-value convertible">{{ convertibleFiles }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">总大小:</span>
        <span class="summary-value">{{ formatTotalSize }}</span>
      </div>
    </div>

    <div v-if="convertibleFiles === 0" class="no-files-message">
      <div class="no-files-icon">😔</div>
      <div class="no-files-text">
        <h4>未找到可转换的文件</h4>
        <p>当前目录中没有找到 .ncm 格式的文件，请选择其他文件夹。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface FileStatistic {
  extension: string
  label: string
  icon: string
  count: number
  size: number
}

const selectedPath = defineModel<string>('selectedPath', { default: '' })
const fileStats = ref<FileStatistic[]>([])
const totalSize = ref(0)

// 音乐文件格式配置
const musicFormats = {
  '.ncm': { label: '网易云加密', icon: '🔒', convertible: true },
  '.mp3': { label: 'MP3 音频', icon: '🎵', convertible: false },
  '.flac': { label: 'FLAC 无损', icon: '🎶', convertible: false },
  '.wav': { label: 'WAV 音频', icon: '🎤', convertible: false },
  '.aac': { label: 'AAC 音频', icon: '🎧', convertible: false },
  '.m4a': { label: 'M4A 音频', icon: '🎼', convertible: false },
  '.ogg': { label: 'OGG 音频', icon: '🎹', convertible: false },
  '.wma': { label: 'WMA 音频', icon: '🎺', convertible: false }
}

const totalFiles = computed(() => {
  return fileStats.value.reduce((sum, stat) => sum + stat.count, 0)
})

const convertibleFiles = computed(() => {
  return fileStats.value
    .filter(stat => musicFormats[stat.extension as keyof typeof musicFormats]?.convertible)
    .reduce((sum, stat) => sum + stat.count, 0)
})

const formatTotalSize = computed(() => {
  return formatFileSize(totalSize.value)
})

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const scanFiles = async () => {
  // 清空统计数据
  fileStats.value = []
  totalSize.value = 0

  // 注意：此组件现在仅用于显示，实际的文件扫描由父组件处理
  console.log('FileStatistics组件已准备好显示文件统计信息')
}

onMounted(() => {
  scanFiles()
})
</script>

<style scoped>
.file-statistics {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.stats-header {
  margin-bottom: 24px;
}

.stats-header h3 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.25rem;
  font-weight: 600;
}

.selected-path {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.path-label {
  font-weight: 500;
  color: #374151;
}

.path-value {
  font-family: 'Courier New', monospace;
  color: #6b7280;
  font-size: 0.9rem;
  word-break: break-all;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.stat-card.primary {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
  margin-right: 16px;
  width: 32px;
  text-align: center;
}

.stat-info {
  flex: 1;
}

.stat-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 2px;
}

.stat-extension {
  font-size: 0.875rem;
  color: #6b7280;
  font-family: 'Courier New', monospace;
}

.stats-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.summary-value.convertible {
  color: #059669;
}

.action-section {
  text-align: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-outline {
  background: white;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.btn-outline:hover {
  background: #3b82f6;
  color: white;
}

.btn-large {
  padding: 16px 32px;
  font-size: 1.1rem;
  width: 100%;
  max-width: 400px;
}

.no-files-message {
  text-align: center;
  padding: 32px 16px;
}

.no-files-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-files-text h4 {
  margin: 0 0 8px 0;
  color: #374151;
  font-size: 1.25rem;
}

.no-files-text p {
  margin: 0 0 24px 0;
  color: #6b7280;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stats-summary {
    flex-direction: column;
    gap: 12px;
  }

  .summary-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }

  .selected-path {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
