/// <reference types="vite/client" />

import type { NCMFile } from './src/utils/ncmDecoder'

// 扩展Window接口，添加electronAPI的类型声明
declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>
      scanFolder: (folderPath: string) => Promise<{ files: NCMFile[] }>
      getFileInfo: (filePath: string) => Promise<{ name: string; size: number; path: string }>
      convertNCM: (inputPath: string, outputPath: string) => Promise<{ success: boolean; error?: string; outputPath?: string }>
      executeNCMDump: (args: string[]) => Promise<{ success: boolean; error?: string; stdout?: string; stderr?: string }>
      decryptNCM: (filePath: string) => Promise<{ success: boolean; error?: string; outputPath?: string; filename?: string }>
      checkFileExists: (filePath: string) => Promise<boolean>
      openFolder: (folderPath: string) => Promise<void>
      getCurrentUsername: () => string
      isElectron: boolean
      platform: string
    }
  }
}

export {}
