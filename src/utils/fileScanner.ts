import type { NCMFile } from './ncmDecoder'

// 文件扫描器接口
export interface FileScanner {
  scanFolder(folderPath: string): Promise<NCMFile[]>
}

// Electron环境文件扫描器
export class ElectronFileScanner implements FileScanner {
  async scanFolder(folderPath: string): Promise<NCMFile[]> {
    if (!window.electronAPI?.scanFolder) {
      throw new Error('Electron API不可用')
    }

    try {
      const files = await window.electronAPI.scanFolder(folderPath)
      const ncmFiles: NCMFile[] = []

      // 确保 files 是数组
      if (!Array.isArray(files)) {
        throw new Error('扫描结果格式错误')
      }

      for (const filePath of files) {
        try {
          const fileInfo = await this.getElectronFileInfo(filePath.path)
          const fileName = filePath.name || filePath.path.split(/[/\\]/).pop() || filePath.path

          ncmFiles.push({
            name: fileName,
            path: filePath.path,
            size: fileInfo.size,
            lastModified: fileInfo.lastModified,
            status: 'pending',
            progress: 0
          })
        } catch (error) {
          console.warn(`获取文件信息失败: ${filePath.path}`, error)
        }
      }

      return ncmFiles
    } catch (error) {
      console.error('扫描文件夹失败:', error)
      throw error
    }
  }

  private async getElectronFileInfo(filePath: string): Promise<{ size: number; lastModified: number }> {
    try {
      if (window.electronAPI?.getFileInfo) {
        const info = await window.electronAPI.getFileInfo(filePath)
        return {
          size: info.size,
          lastModified: Date.now()
        }
      }
      throw new Error('Electron API不可用')
    } catch (error) {
      console.warn('获取文件信息失败，使用默认值:', error)
      return {
        size: 0,
        lastModified: Date.now()
      }
    }
  }
}

// 文件扫描器工厂 - 只返回Electron扫描器
export class FileScannerFactory {
  static create(): FileScanner {
    return new ElectronFileScanner()
  }
}
