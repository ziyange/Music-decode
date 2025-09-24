import type { NCMFile, ConversionResult } from './ncmDecoder'

// 检查是否在Node.js环境中
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node

// 动态导入path模块（仅在Node.js环境中）
let pathModule: typeof import('path') | null = null
if (isNode) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pathModule = require('path')
  } catch (error) {
    console.warn('无法导入path模块:', error)
  }
}

// NCM转换器接口
export interface NCMConverter {
  convertFile(inputFile: NCMFile, outputDir: string): Promise<ConversionResult>
  convertFiles(files: NCMFile[], outputDir: string, onProgress?: (progress: ConversionProgress) => void): Promise<ConversionResult[]>
  validateOutputDirectory(outputDir: string): Promise<boolean>
}

// 转换进度接口
export interface ConversionProgress {
  total: number
  completed: number
  current: string
  percentage: number
}

// 浏览器环境转换器（暂不支持）
export class BrowserNCMConverter implements NCMConverter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async convertFile(inputFile: NCMFile, _outputDir: string): Promise<ConversionResult> {
    return {
      success: false,
      inputFile: inputFile.path,
      error: '浏览器环境暂不支持NCM文件转换，请使用Electron版本或下载桌面应用'
    }
  }

  async convertFiles(files: NCMFile[], outputDir: string, onProgress?: (progress: ConversionProgress) => void): Promise<ConversionResult[]> {
    const results: ConversionResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await this.convertFile(file, outputDir)
      results.push(result)
      
      if (onProgress) {
        onProgress({
          total: files.length,
          completed: i + 1,
          current: file.name,
          percentage: Math.round(((i + 1) / files.length) * 100)
        })
      }
    }
    
    return results
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateOutputDirectory(_outputDir: string): Promise<boolean> {
    return false
  }
}

// Electron环境转换器
export class ElectronNCMConverter implements NCMConverter {
  async convertFile(inputFile: NCMFile, outputDir: string): Promise<ConversionResult> {
    try {
      // 验证输出目录
      const isValidDir = await this.validateOutputDirectory(outputDir)
      if (!isValidDir) {
        throw new Error('输出目录无效或不可写')
      }

      // 生成输出文件路径
      const outputFileName = this.generateOutputFileName(inputFile.name)
      const outputPath = this.joinPath(outputDir, outputFileName)

      // 检查输入文件是否存在
      if (!await this.checkFileExists(inputFile.path)) {
        throw new Error('输入文件不存在')
      }

      // 使用ncmdump转换文件
      const result = await this.executeNCMDump(inputFile.path, outputPath)
      
      if (result.success) {
        return {
          success: true,
          inputFile: inputFile.path,
          outputFile: outputPath,
          filename: outputFileName
        }
      } else {
        throw new Error(result.error || '转换失败')
      }
    } catch (error) {
      return {
        success: false,
        inputFile: inputFile.path,
        error: error instanceof Error ? error.message : '转换失败'
      }
    }
  }

  async convertFiles(files: NCMFile[], outputDir: string, onProgress?: (progress: ConversionProgress) => void): Promise<ConversionResult[]> {
    const results: ConversionResult[] = []
    
    // 如果文件都在同一个目录下，使用批量转换
    const uniqueDirs = [...new Set(files.map(file => {
      const path = file.path
      return pathModule ? pathModule.dirname(path) : path.substring(0, path.lastIndexOf('/') || path.lastIndexOf('\\'))
    }))]
    
    if (uniqueDirs.length === 1 && files.length > 1) {
      // 批量转换：使用ncmdump -d参数
      try {
        if (onProgress) {
          onProgress({
            total: files.length,
            completed: 0,
            current: '批量转换中...',
            percentage: 0
          })
        }
        
        const result = await this.executeBatchNCMDump(uniqueDirs[0], outputDir)
        
        if (result.success) {
          // 验证每个文件是否真的被转换了
          let successCount = 0
          for (const file of files) {
            const outputFileName = this.generateOutputFileName(file.name)
            const outputPath = this.joinPath(outputDir, outputFileName)
            
            // 检查输出文件是否存在
            const fileExists = await this.checkFileExists(outputPath)
            if (fileExists) {
              results.push({
                success: true,
                inputFile: file.path,
                outputFile: outputPath,
                filename: outputFileName
              })
              successCount++
            } else {
              results.push({
                success: false,
                inputFile: file.path,
                error: '输出文件未生成'
              })
            }
          }
          
          // 如果没有任何文件转换成功，回退到逐个转换
          if (successCount === 0) {
            return this.convertFilesIndividually(files, outputDir, onProgress)
          }
        } else {
          // 批量转换失败，回退到逐个转换
          return this.convertFilesIndividually(files, outputDir, onProgress)
        }
        
        if (onProgress) {
          onProgress({
            total: files.length,
            completed: files.length,
            current: '批量转换完成',
            percentage: 100
          })
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // 批量转换出错，回退到逐个转换
        return this.convertFilesIndividually(files, outputDir, onProgress)
      }
    } else {
      // 文件在不同目录或只有一个文件，逐个转换
      return this.convertFilesIndividually(files, outputDir, onProgress)
    }
    
    return results
  }

  private async convertFilesIndividually(files: NCMFile[], outputDir: string, onProgress?: (progress: ConversionProgress) => void): Promise<ConversionResult[]> {
    const results: ConversionResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      if (onProgress) {
        onProgress({
          total: files.length,
          completed: i,
          current: file.name,
          percentage: Math.round((i / files.length) * 100)
        })
      }
      
      const result = await this.convertFile(file, outputDir)
      results.push(result)
      
      if (onProgress) {
        onProgress({
          total: files.length,
          completed: i + 1,
          current: file.name,
          percentage: Math.round(((i + 1) / files.length) * 100)
        })
      }
    }
    
    return results
  }

  private async executeBatchNCMDump(inputDir: string, outputDir: string): Promise<{ success: boolean; error?: string }> {
    if (!window.electronAPI?.executeNCMDump) {
      throw new Error('Electron API不可用')
    }

    try {
      // 使用ncmdump -d参数进行批量转换
      const args = ['-d', inputDir, '-o', outputDir]
      const result = await window.electronAPI.executeNCMDump(args)
      
      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '批量转换失败'
      }
    }
  }

  async validateOutputDirectory(outputDir: string): Promise<boolean> {
    if (!window.electronAPI?.checkFileExists) {
      return false
    }
    
    try {
      return await window.electronAPI.checkFileExists(outputDir)
    } catch (error) {
      console.error('验证输出目录失败:', error)
      return false
    }
  }

  private async executeNCMDump(inputPath: string, outputPath: string): Promise<{ success: boolean; error?: string }> {
    if (!window.electronAPI?.executeNCMDump) {
      // 如果没有executeNCMDump方法，使用convertNCM方法
      if (window.electronAPI?.convertNCM) {
        return await window.electronAPI.convertNCM(inputPath, outputPath)
      }
      throw new Error('Electron API不可用')
    }

    try {
      // 构建ncmdump命令参数
      const outputDirPath = pathModule ? pathModule.dirname(outputPath) : outputPath.substring(0, outputPath.lastIndexOf('/') || outputPath.lastIndexOf('\\'))
      const args = [inputPath, '-o', outputDirPath]
      const result = await window.electronAPI.executeNCMDump(args)
      
      return {
        success: result.success,
        error: result.error
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行ncmdump失败'
      }
    }
  }

  private async checkFileExists(filePath: string): Promise<boolean> {
    if (!window.electronAPI?.checkFileExists) {
      return true // 假设文件存在
    }
    
    try {
      return await window.electronAPI.checkFileExists(filePath)
    } catch (error) {
      console.error('检查文件存在性失败:', error)
      return false
    }
  }

  private generateOutputFileName(inputFileName: string): string {
    // 将.ncm扩展名替换为.mp3
    return inputFileName.replace(/\.ncm$/i, '.mp3')
  }

  private joinPath(dir: string, filename: string): string {
    // 使用pathModule.join如果可用，否则使用简单的路径拼接
    if (pathModule && pathModule.join) {
      return pathModule.join(dir, filename)
    }
    
    // 简单的路径拼接
    return dir.endsWith('/') || dir.endsWith('\\') 
      ? dir + filename 
      : dir + '/' + filename
  }
}

// 转换器工厂
export class NCMConverterFactory {
  static create(): NCMConverter {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return new ElectronNCMConverter()
    } else {
      return new BrowserNCMConverter()
    }
  }
}

// 转换状态管理
export class ConversionManager {
  private converter: NCMConverter
  private isConverting = false
  private currentProgress: ConversionProgress | null = null

  constructor(converter?: NCMConverter) {
    this.converter = converter || NCMConverterFactory.create()
  }

  async convertFiles(
    files: NCMFile[], 
    outputDir: string,
    onProgress?: (progress: ConversionProgress) => void,
    onFileComplete?: (result: ConversionResult) => void
  ): Promise<ConversionResult[]> {
    if (this.isConverting) {
      throw new Error('转换正在进行中，请等待完成')
    }

    this.isConverting = true
    
    try {
      const results: ConversionResult[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // 更新进度
        this.currentProgress = {
          total: files.length,
          completed: i,
          current: file.name,
          percentage: Math.round((i / files.length) * 100)
        }
        
        if (onProgress) {
          onProgress(this.currentProgress)
        }
        
        // 转换文件
        const result = await this.converter.convertFile(file, outputDir)
        results.push(result)
        
        if (onFileComplete) {
          onFileComplete(result)
        }
        
        // 更新完成进度
        this.currentProgress = {
          total: files.length,
          completed: i + 1,
          current: file.name,
          percentage: Math.round(((i + 1) / files.length) * 100)
        }
        
        if (onProgress) {
          onProgress(this.currentProgress)
        }
      }
      
      return results
    } finally {
      this.isConverting = false
      this.currentProgress = null
    }
  }

  getProgress(): ConversionProgress | null {
    return this.currentProgress
  }

  isConversionInProgress(): boolean {
    return this.isConverting
  }

  async validateOutputDirectory(outputDir: string): Promise<boolean> {
    return await this.converter.validateOutputDirectory(outputDir)
  }
}

// 转换结果统计
export interface ConversionStats {
  total: number
  successful: number
  failed: number
  successRate: number
  totalSize: number
  convertedSize: number
}

export const calculateConversionStats = (results: ConversionResult[], files: NCMFile[]): ConversionStats => {
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const successRate = results.length > 0 ? (successful / results.length) * 100 : 0
  
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const convertedFiles = files.filter(file => 
    results.some(result => result.success && result.inputFile === file.path)
  )
  const convertedSize = convertedFiles.reduce((sum, file) => sum + file.size, 0)
  
  return {
    total: results.length,
    successful,
    failed,
    successRate: Math.round(successRate * 100) / 100,
    totalSize,
    convertedSize
  }
}