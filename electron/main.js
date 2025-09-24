import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 保持对窗口对象的全局引用，如果不这样做，当JavaScript对象被垃圾回收时，窗口会被自动关闭
let mainWindow

function createWindow() {
  // 创建浏览器窗口
  // 检测是否为开发环境，打包后app.isPackaged为true
  const isDev = !app.isPackaged

  // 在打包后的应用中，preload.cjs会被打包到app.asar中
  const preloadPath = isDev
    ? path.join(__dirname, 'preload.cjs')
    : path.join(__dirname, 'preload.cjs')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      sandbox: false,
      preload: preloadPath
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false
  })

  // 在开发环境中加载开发服务器，在生产环境中加载构建后的文件
  if (isDev) {
    // 开发环境：加载开发服务器
    console.log('开发环境：加载开发服务器')
    mainWindow.loadURL('http://localhost:5173')
    // 开发环境打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境：直接加载构建后的文件
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('加载生产环境文件:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  // 当窗口准备好显示时显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 设置安全响应头
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Frame-Options': ['DENY'],
        'X-Content-Type-Options': ['nosniff']
      }
    })
  })

  // 设置安全响应头
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Frame-Options': ['DENY'],
        'X-Content-Type-Options': ['nosniff']
      }
    })
  })

  // 当窗口被关闭时发出
  mainWindow.on('closed', () => {
    // 取消引用window对象，如果你的应用支持多窗口，通常会把多个window对象存放在一个数组里，与此同时，你应该删除相应的元素
    mainWindow = null
  })
}

// Electron会在初始化后并准备创建浏览器窗口时，调用这个函数
// 部分API在ready事件触发后才能使用
app.whenReady().then(createWindow)

// 当全部窗口关闭时退出
app.on('window-all-closed', () => {
  // 在macOS上，除非用户用Cmd + Q确定地退出，否则绝大部分应用及其菜单栏会保持激活
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // 在macOS上，当单击dock图标并且没有其他窗口打开时，通常在应用程序中重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC处理程序
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'showHiddenFiles'],
    // 设置默认标题
    title: '选择包含音乐文件的文件夹'
  })

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  }
  return null
})

ipcMain.handle('scan-folder', async (event, folderPath) => {
  try {
    console.log('🔍 开始扫描文件夹:', folderPath)
    console.log('📁 路径类型:', typeof folderPath)
    console.log('📁 路径长度:', folderPath ? folderPath.length : 'undefined')

    const files = []

    function scanDirectory(dirPath) {
      console.log('📁 扫描目录:', dirPath)
      try {
        const items = fs.readdirSync(dirPath)
        console.log(`📋 目录 ${dirPath} 包含 ${items.length} 个项目`)

        for (const item of items) {
          const fullPath = path.join(dirPath, item)
          try {
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
              console.log('📂 发现子目录:', item)
              scanDirectory(fullPath)
            } else {
              // 只扫描.ncm文件
              const fileExtension = path.extname(item).toLowerCase()

              // 只处理.ncm文件
              if (fileExtension === '.ncm') {
                const relativePath = path.relative(folderPath, fullPath)
                files.push({
                  name: item,
                  path: fullPath,
                  relativePath: relativePath,
                  size: stat.size,
                  lastModified: stat.mtime.getTime(),
                  status: 'pending',
                  progress: 0,
                  selected: false,
                  fileType: 'ncm',
                  type: 'ncm'
                })

                console.log('🎵 找到NCM文件:', item, '路径:', fullPath)
              }
            }
          } catch (statError) {
            console.warn(`⚠️ 无法访问文件 ${fullPath}:`, statError.message)
          }
        }
      } catch (readError) {
        console.warn(`⚠️ 无法读取目录 ${dirPath}:`, readError.message)
      }
    }

    // 检查文件夹是否存在
    if (!folderPath) {
      console.error('❌ 文件夹路径为空')
      throw new Error('文件夹路径为空')
    }

    if (!fs.existsSync(folderPath)) {
      console.error('❌ 文件夹不存在:', folderPath)
      throw new Error(`文件夹不存在: ${folderPath}`)
    }

    console.log('✅ 文件夹存在，开始扫描...')
    scanDirectory(folderPath)

    console.log(`📊 扫描完成，共找到 ${files.length} 个NCM文件`)

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    const result = {
      files,
      totalSize,
      totalCount: files.length
    }

    console.log('📤 返回扫描结果:', {
      totalCount: result.totalCount,
      totalSize: result.totalSize
    })

    return result
  } catch (error) {
    console.error('扫描文件夹错误:', error)
    throw error
  }
})

ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stat = fs.statSync(filePath)
    return {
      name: path.basename(filePath),
      size: stat.size,
      path: filePath
    }
  } catch (error) {
    console.error('获取文件信息错误:', error)
    throw error
  }
})

// 检查文件是否存在
ipcMain.handle('check-file-exists', async (event, filePath) => {
  try {
    return fs.existsSync(filePath)
  } catch (error) {
    console.error('检查文件存在性错误:', error)
    return false
  }
})

// 转换NCM文件
ipcMain.handle('convert-ncm', async (event, inputPath, outputPath) => {
  try {
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // 获取ncmdump.exe的路径
    const isDev = !app.isPackaged
    const ncmdumpPath = isDev
      ? path.join(__dirname, '../app/ncmdump.exe')
      : path.join(process.resourcesPath, 'app/ncmdump.exe')

    if (!fs.existsSync(ncmdumpPath)) {
      throw new Error('ncmdump.exe 不存在')
    }

    // 解密NCM文件
ipcMain.handle('decrypt-ncm', async (event, filePath) => {
  try {
    const isDev = !app.isPackaged
    const ncmdumpPath = isDev
      ? path.join(__dirname, '../app/ncmdump.exe')
      : path.join(process.resourcesPath, 'app/ncmdump.exe')

    if (!fs.existsSync(ncmdumpPath)) {
      throw new Error('ncmdump.exe 不存在')
    }

    if (!fs.existsSync(filePath)) {
      throw new Error('输入文件不存在')
    }

    // 获取文件信息
    const fileInfo = path.parse(filePath)
    const outputDir = fileInfo.dir

    // 执行ncmdump命令解密文件
    const args = [filePath, '-o', outputDir]
    const result = await executeCommand(ncmdumpPath, args)

    if (result.success) {
      // 查找输出文件
      const baseName = fileInfo.name
      const possibleExtensions = ['.mp3', '.flac', '.wav', '.m4a']
      let outputPath = null
      let outputFilename = null

      for (const ext of possibleExtensions) {
        const testPath = path.join(outputDir, baseName + ext)
        if (fs.existsSync(testPath)) {
          outputPath = testPath
          outputFilename = baseName + ext
          break
        }
      }

      if (outputPath) {
        return {
          success: true,
          outputPath: outputPath,
          filename: outputFilename
        }
      } else {
        return {
          success: false,
          error: '解密成功但未找到输出文件'
        }
      }
    } else {
      return {
        success: false,
        error: result.error || '解密失败'
      }
    }
  } catch (error) {
    console.error('解密NCM文件错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// 执行ncmdump命令
    const args = [inputPath, '-o', outputDir]
    const result = await executeCommand(ncmdumpPath, args)

    return {
      success: result.success,
      error: result.error,
      outputPath: result.success ? outputPath : undefined
    }
  } catch (error) {
    console.error('转换NCM文件错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// 执行ncmdump命令
ipcMain.handle('execute-ncmdump', async (event, args) => {
  try {
    const isDev = !app.isPackaged
    const ncmdumpPath = isDev
      ? path.join(__dirname, '../app/ncmdump.exe')
      : path.join(process.resourcesPath, 'app/ncmdump.exe')

    if (!fs.existsSync(ncmdumpPath)) {
      throw new Error('ncmdump.exe 不存在')
    }

    const result = await executeCommand(ncmdumpPath, args)
    return result
  } catch (error) {
    console.error('执行ncmdump错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// 打开文件夹
ipcMain.handle('open-folder', async (event, folderPath) => {
  try {
    await shell.openPath(folderPath)
    return { success: true }
  } catch (error) {
    console.error('打开文件夹错误:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// 获取用户名
ipcMain.handle('get-username', async () => {
  try {
    const os = await import('os')
    return os.userInfo().username
  } catch (error) {
    console.warn('无法获取用户名:', error)
    return 'Unknown'
  }
})

// 执行命令的辅助函数
function executeCommand(command, args) {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    process.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    process.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve({
          success: true,
          stdout: stdout,
          stderr: stderr
        })
      } else {
        resolve({
          success: false,
          error: stderr || `进程退出码: ${code}`,
          stdout: stdout,
          stderr: stderr
        })
      }
    })

    process.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      })
    })
  })
}
