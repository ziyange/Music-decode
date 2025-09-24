import { ref, computed } from 'vue'

export interface DownloadRecord {
  originalPath: string
  outputPath: string
  fileName: string
  downloadTime: number
}

export interface DownloadHistory {
  records: DownloadRecord[]
  lastUpdated: number
}

class DownloadRecordManager {
  private static instance: DownloadRecordManager
  private storageKey = 'music-decoder-download-history'
  
  public static getInstance(): DownloadRecordManager {
    if (!DownloadRecordManager.instance) {
      DownloadRecordManager.instance = new DownloadRecordManager()
    }
    return DownloadRecordManager.instance
  }

  /**
   * 获取下载历史记录
   */
  getDownloadHistory(): DownloadHistory {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('读取下载历史失败:', error)
    }
    
    return {
      records: [],
      lastUpdated: Date.now()
    }
  }

  /**
   * 保存下载历史记录
   */
  saveDownloadHistory(history: DownloadHistory): void {
    try {
      history.lastUpdated = Date.now()
      localStorage.setItem(this.storageKey, JSON.stringify(history))
    } catch (error) {
      console.error('保存下载历史失败:', error)
    }
  }

  /**
   * 添加下载记录
   */
  addDownloadRecord(originalPath: string, outputPath: string, fileName: string): void {
    const history = this.getDownloadHistory()
    
    // 检查是否已存在相同的记录
    const existingIndex = history.records.findIndex(
      record => record.originalPath === originalPath && record.fileName === fileName
    )
    
    const newRecord: DownloadRecord = {
      originalPath,
      outputPath,
      fileName,
      downloadTime: Date.now()
    }
    
    if (existingIndex >= 0) {
      // 更新现有记录
      history.records[existingIndex] = newRecord
    } else {
      // 添加新记录
      history.records.push(newRecord)
    }
    
    this.saveDownloadHistory(history)
  }

  /**
   * 检查文件是否已下载
   */
  isFileDownloaded(originalPath: string, fileName: string): boolean {
    const history = this.getDownloadHistory()
    return history.records.some(
      record => record.originalPath === originalPath && record.fileName === fileName
    )
  }

  /**
   * 获取文件的下载路径列表
   */
  getDownloadPaths(originalPath: string, fileName: string): string[] {
    const history = this.getDownloadHistory()
    return history.records
      .filter(record => record.originalPath === originalPath && record.fileName === fileName)
      .map(record => record.outputPath)
  }

  /**
   * 清除下载历史
   */
  clearDownloadHistory(): void {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('清除下载历史失败:', error)
    }
  }

  /**
   * 获取所有下载记录
   */
  getAllRecords(): DownloadRecord[] {
    return this.getDownloadHistory().records
  }

  /**
   * 删除特定记录
   */
  removeRecord(originalPath: string, fileName: string): void {
    const history = this.getDownloadHistory()
    history.records = history.records.filter(
      record => !(record.originalPath === originalPath && record.fileName === fileName)
    )
    this.saveDownloadHistory(history)
  }
}

export const downloadRecordManager = DownloadRecordManager.getInstance()

/**
 * Vue组合式API钩子
 */
export const useDownloadRecord = () => {
  const downloadHistory = ref<DownloadHistory>(downloadRecordManager.getDownloadHistory())
  
  const refreshHistory = () => {
    downloadHistory.value = downloadRecordManager.getDownloadHistory()
  }
  
  const addRecord = (originalPath: string, outputPath: string, fileName: string) => {
    downloadRecordManager.addDownloadRecord(originalPath, outputPath, fileName)
    refreshHistory()
  }
  
  const isDownloaded = (originalPath: string, fileName: string): boolean => {
    return downloadRecordManager.isFileDownloaded(originalPath, fileName)
  }
  
  const getDownloadPaths = (originalPath: string, fileName: string): string[] => {
    return downloadRecordManager.getDownloadPaths(originalPath, fileName)
  }
  
  const clearHistory = () => {
    downloadRecordManager.clearDownloadHistory()
    refreshHistory()
  }
  
  const removeRecord = (originalPath: string, fileName: string) => {
    downloadRecordManager.removeRecord(originalPath, fileName)
    refreshHistory()
  }
  
  const totalRecords = computed(() => downloadHistory.value.records.length)
  
  const recentRecords = computed(() => {
    return downloadHistory.value.records
      .sort((a, b) => b.downloadTime - a.downloadTime)
      .slice(0, 10)
  })
  
  return {
    downloadHistory,
    totalRecords,
    recentRecords,
    refreshHistory,
    addRecord,
    isDownloaded,
    getDownloadPaths,
    clearHistory,
    removeRecord
  }
}