/**
 * 音乐解密工具类
 * 支持多种加密音乐格式的解密
 */

export interface DecryptResult {
  success: boolean
  data?: Blob
  filename?: string
  error?: string
}

export interface FileInfo {
  name: string
  size: number
  type: string
  extension: string
}

export class MusicDecoder {
  private static instance: MusicDecoder

  // 支持的文件格式（目前只支持NCM）
  private readonly supportedFormats = [
    '.ncm',     // 网易云音乐
  ]

  private constructor() {}

  public static getInstance(): MusicDecoder {
    if (!MusicDecoder.instance) {
      MusicDecoder.instance = new MusicDecoder()
    }
    return MusicDecoder.instance
  }

  /**
   * 检查文件是否为支持的格式
   */
  public isSupportedFormat(filename: string): boolean {
    const extension = this.getFileExtension(filename)
    return this.supportedFormats.includes(extension)
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1) return ''
    return filename.substring(lastDotIndex).toLowerCase()
  }

  /**
   * 获取文件信息
   */
  public getFileInfo(file: File): FileInfo {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: this.getFileExtension(file.name)
    }
  }

  /**
   * 解密音乐文件
   */
  public async decryptFile(file: File): Promise<DecryptResult> {
    try {
      const fileInfo = this.getFileInfo(file)

      if (!this.isSupportedFormat(fileInfo.name)) {
        return {
          success: false,
          error: `目前暂不支持 ${fileInfo.extension} 格式，仅支持 .ncm 格式`
        }
      }

      // 只处理NCM格式
      if (fileInfo.extension === '.ncm') {
        const result = await this.decryptNCM()
        return result
      }

      return {
        success: false,
        error: `目前暂不支持 ${fileInfo.extension} 格式，仅支持 .ncm 格式`
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '解密失败'
      }
    }
  }

  /**
   * 读取文件为ArrayBuffer
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 解密NCM格式文件
   */
  private async decryptNCM(): Promise<DecryptResult> {
    try {
      // 通过Electron API调用ncmdump.exe进行解密
      if (window.electronAPI && typeof window.electronAPI.decryptNCM === 'function') {
        // 由于浏览器File对象没有path属性，我们需要先保存文件到临时位置
        // 或者修改实现方式，直接传递文件名让用户选择文件
        return {
          success: false,
          error: 'NCM解密功能需要通过文件选择器选择文件，暂不支持拖拽上传的文件解密'
        }
      } else {
        return {
          success: false,
          error: 'Electron API不可用，无法进行NCM解密'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'NCM解密过程中发生错误'
      }
    }
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(extension: string): string {
    switch (extension) {
      case '.mp3':
        return 'audio/mpeg'
      case '.flac':
        return 'audio/flac'
      case '.ogg':
        return 'audio/ogg'
      case '.wav':
        return 'audio/wav'
      default:
        return 'audio/mpeg'
    }
  }

  /**
   * 批量解密文件
   */
  public async decryptFiles(files: File[]): Promise<DecryptResult[]> {
    const results: DecryptResult[] = []

    for (const file of files) {
      const result = await this.decryptFile(file)
      results.push(result)
    }

    return results
  }

  /**
   * 获取支持的格式列表
   */
  public getSupportedFormats(): string[] {
    return [...this.supportedFormats]
  }
}

// 导出单例实例
export const musicDecoder = MusicDecoder.getInstance()
