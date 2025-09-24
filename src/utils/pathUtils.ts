/**
 * 跨平台路径工具函数
 * 兼容浏览器和Node.js环境
 */

// 检查是否在Electron环境中
export function isElectron(): boolean {
  // 检查多个Electron环境的标识
  if (typeof window === 'undefined') {
    return false
  }

  // 方法1: 检查electronAPI（最可靠的方法）
  if (window.electronAPI && typeof window.electronAPI === 'object') {
    console.log('Electron API detected:', window.electronAPI)
    return true
  }

  // 方法2: 检查process对象（Electron特有）
  if (typeof (window as unknown as { process?: { type?: string } }).process !== 'undefined' &&
      (window as unknown as { process?: { type?: string } }).process?.type) {
    console.log('Electron process detected')
    return true
  }

  // 方法3: 检查navigator.userAgent中的Electron标识
  if (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron')) {
    console.log('Electron userAgent detected')
    return true
  }

  // 方法4: 检查全局的require函数（Node.js环境）
  if (typeof (window as unknown as { require?: (module: string) => unknown }).require === 'function') {
    console.log('Node.js require detected')
    return true
  }

  console.log('Not in Electron environment')
  return false
}

// 定义window上的require类型
interface WindowWithRequire extends Window {
  require?: (module: string) => {
    basename: (path: string, ext?: string) => string
    join: (...paths: string[]) => string
    dirname: (path: string) => string
    extname: (path: string) => string
  }
}

/**
 * 获取文件名（不包含扩展名）
 */
export function basename(filePath: string, ext?: string): string {
  if (isElectron() && typeof window !== 'undefined' && (window as WindowWithRequire).require) {
    // Electron环境中使用Node.js的path模块
    try {
      const path = (window as WindowWithRequire).require!('path') as {
        basename: (path: string, ext?: string) => string
      }
      return path.basename(filePath, ext)
    } catch {
      // 如果require失败，使用浏览器兼容的实现
    }
  }

  // 浏览器兼容的实现
  const separator = filePath.includes('/') ? '/' : '\\'
  const parts = filePath.split(separator)
  let filename = parts[parts.length - 1] || ''

  if (ext && filename.endsWith(ext)) {
    filename = filename.slice(0, -ext.length)
  }

  return filename
}

/**
 * 连接路径
 */
export function join(...paths: string[]): string {
  if (isElectron() && typeof window !== 'undefined' && (window as WindowWithRequire).require) {
    // Electron环境中使用Node.js的path模块
    try {
      const path = (window as WindowWithRequire).require!('path') as {
        join: (...paths: string[]) => string
      }
      return path.join(...paths)
    } catch {
      // 如果require失败，使用浏览器兼容的实现
    }
  }

  // 浏览器兼容的实现
  const separator = paths.some(p => p.includes('/')) ? '/' : '\\'

  return paths
    .filter(path => path && path.length > 0)
    .map((path, index) => {
      // 移除开头和结尾的分隔符，除了第一个路径的开头
      if (index === 0) {
        return path.replace(new RegExp(`\\${separator}+$`), '')
      } else {
        return path.replace(new RegExp(`^\\${separator}+|\\${separator}+$`, 'g'), '')
      }
    })
    .join(separator)
}

/**
 * 获取目录名
 */
export function dirname(filePath: string): string {
  if (isElectron() && typeof window !== 'undefined' && (window as WindowWithRequire).require) {
    // Electron环境中使用Node.js的path模块
    try {
      const path = (window as WindowWithRequire).require!('path') as {
        dirname: (path: string) => string
      }
      return path.dirname(filePath)
    } catch {
      // 如果require失败，使用浏览器兼容的实现
    }
  }

  // 浏览器兼容的实现
  const separator = filePath.includes('/') ? '/' : '\\'
  const parts = filePath.split(separator)
  parts.pop() // 移除文件名
  return parts.join(separator) || separator
}

/**
 * 获取文件扩展名
 */
export function extname(filePath: string): string {
  if (isElectron() && typeof window !== 'undefined' && (window as WindowWithRequire).require) {
    // Electron环境中使用Node.js的path模块
    try {
      const path = (window as WindowWithRequire).require!('path') as {
        extname: (path: string) => string
      }
      return path.extname(filePath)
    } catch {
      // 如果require失败，使用浏览器兼容的实现
    }
  }

  // 浏览器兼容的实现
  const lastDot = filePath.lastIndexOf('.')
  const lastSeparator = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))

  if (lastDot > lastSeparator && lastDot !== -1) {
    return filePath.slice(lastDot)
  }

  return ''
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时长
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * 获取文件扩展名（不包含点）
 */
export function getFileExtension(filePath: string): string {
  const ext = extname(filePath)
  return ext.startsWith('.') ? ext.slice(1) : ext
}
