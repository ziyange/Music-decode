const { contextBridge, ipcRenderer } = require('electron')

// 暴露受保护的方法，允许渲染进程使用
contextBridge.exposeInMainWorld('electronAPI', {
  // 选择文件夹
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // 扫描文件夹中的NCM文件
  scanFolder: (folderPath) => ipcRenderer.invoke('scan-folder', folderPath),

  // 获取文件信息
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),

  // 转换NCM文件
  convertNCM: (inputPath, outputPath) => ipcRenderer.invoke('convert-ncm', inputPath, outputPath),

  // 解密NCM文件
  decryptNCM: (filePath) => ipcRenderer.invoke('decrypt-ncm', filePath),

  // 执行ncmdump命令
  executeNCMDump: (args) => ipcRenderer.invoke('execute-ncmdump', args),

  // 检查文件是否存在
  checkFileExists: (filePath) => ipcRenderer.invoke('check-file-exists', filePath),

  // 打开文件夹
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),

  // 获取当前用户名
  getCurrentUsername: () => {
    try {
      // 使用 ipcRenderer 调用主进程获取用户名，避免直接使用 os 模块
      return ipcRenderer.invoke('get-username')
    } catch (error) {
      console.warn('无法获取用户名:', error)
      return 'Unknown'
    }
  },

  // 检查是否在Electron环境中
  isElectron: true,

  // 获取平台信息
  platform: process.platform
})
