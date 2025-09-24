import { ref, computed } from 'vue'
import { downloadRecordManager } from './downloadRecord'
import { isElectron, basename, join } from './pathUtils'

// NCM文件信息接口
export interface NCMFile {
  name: string
  path: string
  size: number
  lastModified: number
  status: 'pending' | 'converting' | 'completed' | 'error'
  progress: number
  outputPath?: string
  relativePath?: string
  isDownloaded?: boolean
  downloadPaths?: string[]
  selected?: boolean
  type?: string  // 修改为type字段，与模板保持一致
}

export interface ConversionResult {
  success: boolean
  inputFile: string
  outputFile?: string
  filename?: string
  error?: string
}

// 扫描结果接口
export interface ScanResult {
  files: NCMFile[]
  totalSize: number
  totalCount: number
}

// 转换统计接口
export interface ConversionStats {
  total: number
  completed: number
  failed: number
  inProgress: number
  pending: number
}

export interface ConversionProgress {
  total: number
  completed: number
  current: string
  percentage: number
}

export class NCMDecoder {
  private static instance: NCMDecoder
  private ncmdumpPath = 'E:\\Programs\\MyAPPs\\Music_decode\\music-decoder\\app\\ncmdump.exe'

  public static getInstance(): NCMDecoder {
    if (!NCMDecoder.instance) {
      NCMDecoder.instance = new NCMDecoder()
    }
    return NCMDecoder.instance
  }

  /**
   * 检查ncmdump.exe是否存在
   */
  async checkNCMDumpExists(): Promise<boolean> {
    try {
      // 在实际应用中，这里需要调用后端API来检查文件是否存在
      // 目前先返回true，假设文件存在
      return true
    } catch (error) {
      console.error('检查ncmdump失败:', error)
      return false
    }
  }

  /**
   * 扫描文件夹中的NCM文件
   */
  async scanNCMFiles(folderPath: string): Promise<NCMFile[]> {
    try {
      // 检查是否在Electron环境中
      if (typeof window !== 'undefined' && window.electronAPI) {
        // 调用Electron的文件夹扫描API
        const result = await window.electronAPI.scanFolder(folderPath)

        // 检查每个文件的下载状态并设置文件类型
        result.files.forEach((file: NCMFile) => {
          file.isDownloaded = downloadRecordManager.isFileDownloaded(file.path, file.name)
          if (file.isDownloaded) {
            file.downloadPaths = downloadRecordManager.getDownloadPaths(file.path, file.name)
          }

          // 根据文件扩展名设置类型
          const ext = file.name.toLowerCase().split('.').pop()
          if (ext === 'ncm') {
            file.type = 'ncm'
          } else if (['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'wma'].includes(ext || '')) {
            file.type = 'music'
          } else {
            file.type = 'other'
          }
        })

        return result.files
      } else {
        // 浏览器环境：返回真实的错误信息
        throw new Error('浏览器环境不支持NCM文件转换，请使用桌面版应用')
      }
    } catch (error) {
      console.error('扫描NCM文件失败:', error)
      return []
    }
  }

  /**
   * 转换NCM文件
   */
  async convertFiles(
    files: NCMFile[],
    outputDir: string,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = []
    const selectedFiles = files.filter(f => f.selected)

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]

      // 更新进度
      if (onProgress) {
        onProgress({
          total: selectedFiles.length,
          completed: i,
          current: file.name,
          percentage: Math.round((i / selectedFiles.length) * 100)
        })
      }

      try {
        // 使用真实的ncmdump转换
        const result = await this.convertNCMFile(file.path, outputDir)

        if (result.success) {
          const outputFile = result.outputPath || this.getOutputFileName(file.name, outputDir)

          // 添加下载记录
          downloadRecordManager.addDownloadRecord(file.path, outputFile, file.name)

          results.push({
            success: true,
            inputFile: file.path,
            outputFile,
            filename: basename(outputFile)
          })
        } else {
          throw new Error(result.error || '转换失败')
        }
      } catch (error) {
        results.push({
          success: false,
          inputFile: file.path,
          error: error instanceof Error ? error.message : '转换失败'
        })
      }
    }

    // 最终进度更新
    if (onProgress) {
      onProgress({
        total: selectedFiles.length,
        completed: selectedFiles.length,
        current: '转换完成',
        percentage: 100
      })
    }

    return results
  }

  /**
   * 转换单个NCM文件
   */
  private async convertNCMFile(inputPath: string, outputDir: string): Promise<{ success: boolean; error?: string; outputPath?: string }> {
    if (isElectron()) {
      // Electron环境：使用真实的ncmdump
      if (!window.electronAPI?.convertNCM) {
        throw new Error('Electron API不可用')
      }

      // 生成输出文件路径
      const fileName = basename(inputPath, '.ncm')
      const outputPath = join(outputDir, `${fileName}.mp3`)

      return await window.electronAPI.convertNCM(inputPath, outputPath)
    } else {
      // 浏览器环境：返回不支持的错误
      return {
        success: false,
        error: '浏览器环境不支持NCM文件转换，请使用桌面版应用'
      }
    }
  }

  /**
   * 获取输出文件名
   */
  private getOutputFileName(inputName: string, outputDir: string): string {
    const nameWithoutExt = inputName.replace('.ncm', '')
    return `${outputDir}\\${nameWithoutExt}.mp3` // 假设输出为mp3格式
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 验证文件夹路径
   */
  validateFolderPath(path: string): boolean {
    if (!path || path.trim() === '') {
      return false
    }

    // 简单的路径验证
    const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/
    return windowsPathRegex.test(path)
  }

  /**
   * 获取ncmdump版本信息
   */
  async getNCMDumpVersion(): Promise<string> {
    try {
      // 在实际应用中，这里需要调用后端API来执行 ncmdump -v 命令
      return 'ncmdump v1.6.0'
    } catch (error) {
      console.error('获取版本信息失败:', error)
      return '未知版本'
    }
  }

  /**
   * 获取ncmdump帮助信息
   */
  async getNCMDumpHelp(): Promise<string> {
    try {
      // 在实际应用中，这里需要调用后端API来执行 ncmdump -h 命令
      return `
ncmdump - 网易云音乐 NCM 格式转换工具

用法:
  ncmdump [选项] <文件...>

选项:
  -h, --help     显示帮助信息
  -v, --version  显示版本信息
  -d <目录>      指定输入目录
  -o <目录>      指定输出目录
  -r             递归处理子目录

示例:
  ncmdump file1.ncm file2.ncm
  ncmdump -d input_dir -o output_dir
  ncmdump -d input_dir -o output_dir -r
      `
    } catch (error) {
      console.error('获取帮助信息失败:', error)
      return '无法获取帮助信息'
    }
  }
}

// 创建全局实例
export const ncmDecoder = NCMDecoder.getInstance()



// 扫描文件夹（Electron环境）
const scanFolderElectron = async (folderPath: string): Promise<NCMFile[]> => {
  console.log('scanFolderElectron called with:', folderPath)
  console.log('window.electronAPI:', window.electronAPI)

  if (!window.electronAPI) {
    console.error('window.electronAPI is not available')
    throw new Error('Electron API不可用 - electronAPI对象未找到')
  }

  if (!window.electronAPI.scanFolder) {
    console.error('window.electronAPI.scanFolder is not available')
    throw new Error('Electron API不可用 - scanFolder方法未找到')
  }

  try {
    const result = await window.electronAPI.scanFolder(folderPath)
    console.log('scanFolder result:', result)
    // 返回files数组
    return result.files
  } catch (error) {
    console.error('scanFolder error:', error)
    throw error
  }
}

// 转换NCM文件（Electron环境）
const convertNCMElectron = async (inputPath: string, outputPath: string): Promise<{ success: boolean; error?: string }> => {
  if (!window.electronAPI?.convertNCM) {
    throw new Error('Electron API不可用')
  }
  return await window.electronAPI.convertNCM(inputPath, outputPath)
}

export function useNCMDecoder() {
  // 状态变量
  const files = ref<NCMFile[]>([])
  const isScanning = ref(false)
  const isConverting = ref(false)
  const currentFile = ref<string>('')
  const outputDirectory = ref<string>('')
  const conversionResults = ref<ConversionResult[]>([])  // 新增转换结果状态
  
  // 进度状态
  const progressState = ref<ConversionProgress>({
    total: 0,
    completed: 0,
    current: '',
    percentage: 0
  })

  // 计算属性
  const stats = computed<ConversionStats>(() => {
    const total = files.value.length
    const completed = files.value.filter(f => f.status === 'completed').length
    const failed = files.value.filter(f => f.status === 'error').length
    const inProgress = files.value.filter(f => f.status === 'converting').length
    const pending = files.value.filter(f => f.status === 'pending').length

    return {
      total,
      completed,
      failed,
      inProgress,
      pending
    }
  })

  const totalSize = computed(() => {
    return files.value.reduce((sum, file) => sum + file.size, 0)
  })

  const completedSize = computed(() => {
    return files.value
      .filter(f => f.status === 'completed')
      .reduce((sum, file) => sum + file.size, 0)
  })

  const overallProgress = computed(() => {
    if (files.value.length === 0) return 0
    return Math.round((stats.value.completed / stats.value.total) * 100)
  })

  // 创建进度对象，包含所需的属性
  const progress = computed<ConversionProgress>(() => {
    // 如果正在转换，使用progressState，否则使用计算的进度
    if (isConverting.value && progressState.value.total > 0) {
      return progressState.value
    }
    
    const currentConverting = files.value.find(f => f.status === 'converting')
    return {
      total: stats.value.total,
      completed: stats.value.completed,
      current: currentConverting ? currentConverting.name : '',
      percentage: overallProgress.value
    }
  })

  // 进度更新函数
  const onProgress = (newProgress: ConversionProgress) => {
    progressState.value = newProgress
  }

  // 扫描文件夹中的NCM文件
  const scanFolder = async (folderPath: string): Promise<ScanResult> => {
    isScanning.value = true

    try {
      let ncmFiles: NCMFile[] = []

      if (isElectron()) {
        // Electron环境：使用原生API扫描
        ncmFiles = await scanFolderElectron(folderPath)
      } else {
        // 浏览器环境：提示用户手动选择文件
        throw new Error('浏览器环境下请使用文件选择功能')
      }

      // 检查每个文件的下载状态
      ncmFiles.forEach(file => {
        file.isDownloaded = downloadRecordManager.isFileDownloaded(file.path, file.name)
        if (file.isDownloaded) {
          file.downloadPaths = downloadRecordManager.getDownloadPaths(file.path, file.name)
        }
      })

      files.value = ncmFiles

      const result: ScanResult = {
        files: ncmFiles,
        totalSize: ncmFiles.reduce((sum, file) => sum + file.size, 0),
        totalCount: ncmFiles.length
      }

      return result
    } catch (error) {
      console.error('扫描文件夹失败:', error)

      // 检查是否是文件夹不存在的错误
      if (error instanceof Error && error.message.includes('文件夹不存在')) {
        // 提示用户该目录不存在，然后退出
        throw new Error(`指定的目录不存在: ${folderPath}\n\n请检查路径是否正确，或选择其他目录。`)
      }

      throw new Error(error instanceof Error ? error.message : '扫描文件夹失败')
    } finally {
      isScanning.value = false
    }
  }

  // 从文件列表扫描 - 已移除浏览器环境支持
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scanFromFileList = async (): Promise<ScanResult> => {
    throw new Error('此功能仅在Electron环境下可用，请使用文件夹扫描功能')
  }

  // 转换单个文件
   
  const convertFile = async (file: NCMFile, outputDir: string): Promise<ConversionResult> => {
    const fileIndex = files.value.findIndex(f => f.path === file.path)
    if (fileIndex === -1) {
      throw new Error('文件不存在')
    }

    // 更新文件状态
    files.value[fileIndex].status = 'converting'
    files.value[fileIndex].progress = 0
    currentFile.value = file.name

    try {
      let result: { success: boolean; error?: string }

      if (isElectron()) {
        // 使用真实的ncmdump转换
        const outputFileName = file.name.replace('.ncm', '.mp3')
        const outputPath = `${outputDir}/${outputFileName}`

        result = await convertNCMElectron(file.path, outputPath)

        if (result.success) {
          files.value[fileIndex].status = 'completed'
          files.value[fileIndex].outputPath = outputPath
          files.value[fileIndex].progress = 100

          return {
            success: true,
            inputFile: file.path,
            outputFile: outputPath,
            filename: outputFileName
          }
        } else {
          throw new Error(result.error || '转换失败')
        }
      } else {
        // 浏览器环境：暂时不支持转换
        throw new Error('浏览器环境暂不支持NCM文件转换，请使用Electron版本')
      }
    } catch (error) {
      // 更新文件状态为错误
      files.value[fileIndex].status = 'error'
      files.value[fileIndex].progress = 0

      return {
        success: false,
        inputFile: file.path,
        error: error instanceof Error ? error.message : '转换失败'
      }
    }
  }

  // 批量转换文件
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const convertFiles = async (outputDir: string): Promise<ConversionResult[]> => {
    if (files.value.length === 0) {
      throw new Error('没有文件需要转换')
    }

    isConverting.value = true
    outputDirectory.value = outputDir
    const results: ConversionResult[] = []

    try {
      for (const file of files.value) {
        if (file.status === 'pending') {
          const result = await convertFile(file, outputDir)
          results.push(result)
        }
      }

      conversionResults.value = results  // 保存转换结果
      return results
    } catch (error) {
      console.error('批量转换失败:', error)
      throw error
    } finally {
      isConverting.value = false
      currentFile.value = ''
    }
  }

  // 清除所有文件
  const clearFiles = () => {
    files.value = []
    currentFile.value = ''
    outputDirectory.value = ''
  }

  // 移除单个文件
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeFile = (filePath: string) => {
    const index = files.value.findIndex(f => f.path === filePath)
    if (index !== -1) {
      files.value.splice(index, 1)
    }
  }

  // 重置文件状态
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetFileStatus = (filePath: string) => {
    const file = files.value.find(f => f.path === filePath)
    if (file) {
      file.status = 'pending'
      file.progress = 0
      file.outputPath = undefined
    }
  }

  // 重置所有文件状态
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const resetAllFiles = () => {
    files.value.forEach(file => {
      file.status = 'pending'
      file.progress = 0
      file.outputPath = undefined
    })
  }

  const startConversion = async (
    selectedFiles: NCMFile[],
    outputDir: string
  ): Promise<ConversionResult[]> => {
    // 使用新的转换器进行转换
    const { NCMConverterFactory } = await import('./ncmConverter')
    const converter = NCMConverterFactory.create()
    
    isConverting.value = true
    outputDirectory.value = outputDir
    const results: ConversionResult[] = []

    try {
      // 使用传入的selectedFiles而不是内部的files.value
      const result = await converter.convertFiles(selectedFiles, outputDir, (progress) => {
        // 更新进度状态
        if (onProgress) {
          onProgress(progress)
        }
      })
      
      results.push(...result)
      conversionResults.value = results  // 保存转换结果
      return results
    } catch (error) {
      console.error('批量转换失败:', error)
      throw error
    } finally {
      isConverting.value = false
      currentFile.value = ''
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const scanNCMFiles = async (folderPath: string): Promise<NCMFile[]> => {
    const result = await scanFolder(folderPath)
    return result.files
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateFolderPath = (path: string): boolean => {
    return ncmDecoder.validateFolderPath(path)
  }

  // 添加文件到列表
  const addFiles = (newFiles: NCMFile[]) => {
    files.value.push(...newFiles)
  }

  // 更新文件状态
  const updateFileStatus = (filePath: string, status: NCMFile['status'], progress?: number) => {
    const file = files.value.find(f => f.path === filePath)
    if (file) {
      file.status = status
      if (progress !== undefined) {
        file.progress = progress
      }
    }
  }

  const resetState = () => {
    clearFiles()
    // 重置进度状态
    progressState.value = {
      total: 0,
      completed: 0,
      current: '',
      percentage: 0
    }
    conversionResults.value = []
    isConverting.value = false
    currentFile.value = ''
    outputDirectory.value = ''
  }

  return {
    // 状态
    files,
    isScanning,
    isConverting,
    currentFile,
    outputDirectory,
    conversionResults,

    // 计算属性
    stats,
    totalSize,
    completedSize,
    overallProgress,
    progress,

    // 方法
    scanFolder,
    addFiles,
    clearFiles,
    updateFileStatus,
    startConversion,
    resetState,
    onProgress
  }
}
