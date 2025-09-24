import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 保持对窗口对象的全局引用，如果不这样做，当JavaScript对象被垃圾回收时，窗口会被自动关闭
let mainWindow
let viteProcess

async function createWindow() {
  // 创建浏览器窗口
  // 检测是否为开发环境，打包后app.isPackaged为true
  const isDev = !app.isPackaged

  // 在开发环境下，关闭 Electron 的安全警告提示（仅开发环境）
  if (isDev) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
  }

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
    console.log('开发环境：尝试连接开发服务器')
    const devUrl = 'http://localhost:5173'
    let ready = await waitForDevServer(devUrl, 5000)
    if (!ready) {
      console.log('开发服务器未就绪，尝试启动 Vite...')
      try {
        await startViteDevServer()
      } catch (err) {
        console.warn('启动 Vite 失败:', err)
      }
      ready = await waitForDevServer(devUrl, 30000)
    }
    if (ready) {
      mainWindow.loadURL(devUrl)
      // 开发环境打开开发者工具
      mainWindow.webContents.openDevTools()
    } else {
      console.warn('开发服务器仍不可用，回退到占位页面')
      const html = encodeURIComponent(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>开发服务器不可用</title><style>html,body{height:100%;margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center} .card{max-width:720px;padding:24px 28px;border-radius:16px;background:#111827;border:1px solid #1f2937;box-shadow:0 10px 30px rgba(0,0,0,.4)} h1{font-size:22px;margin:0 0 12px} p{line-height:1.6;margin:0 0 8px;color:#94a3b8} code{background:#0b1220;color:#93c5fd;padding:2px 6px;border-radius:6px} .btn{display:inline-block;margin-top:14px;padding:8px 12px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none} .btn:hover{background:#1d4ed8}</style></head><body><div class="card"><h1>开发服务器未启动</h1><p>Electron 正尝试加载 <code>${devUrl}</code>，但未检测到可用的 Vite 开发服务器。</p><p>请在项目根目录运行：<code>npm run dev</code>，或稍后再试。</p><a class="btn" href="${devUrl}">重试打开开发地址</a></div></body></html>`)
      mainWindow.loadURL(`data:text/html;charset=utf-8,${html}`)
    }
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

  // 设置安全响应头（去掉重复注册，按环境设置 CSP）
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const isDevEnv = !app.isPackaged
    const cspDev = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' http: https: ws:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    const cspProd = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'X-Frame-Options': ['DENY'],
        'X-Content-Type-Options': ['nosniff'],
        'Content-Security-Policy': [isDevEnv ? cspDev : cspProd]
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

// 在应用退出时清理 Vite 进程
app.on('before-quit', () => {
  if (viteProcess) {
    try {
      viteProcess.kill()
    } catch (e) {
      console.warn('关闭 Vite 开发服务器进程失败:', e)
    }
  }
})

// 等待开发服务器就绪
async function waitForDevServer(url, timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok) return true
    } catch (err) {
      // 未就绪，继续等待
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return false
}

// 启动 Vite 开发服务器
function startViteDevServer() {
  return new Promise((resolve, reject) => {
    const projectRoot = path.join(__dirname, '..')
    try {
      const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
      const args = ['run', 'dev']
      viteProcess = spawn(command, args, {
        cwd: projectRoot,
        shell: process.platform === 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env }
      })
    } catch (err) {
      return reject(err)
    }
    viteProcess.on('spawn', () => {
      console.log('已启动 Vite 开发服务器进程')
      resolve()
    })
    viteProcess.on('error', (err) => {
      reject(err)
    })
    viteProcess.stderr.on('data', (d) => {
      const msg = d.toString()
      if (msg.toLowerCase().includes('error')) console.warn('[vite]', msg)
    })
  })
}

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

    // 执行ncmdump命令
    const args = [inputPath, '-o', outputDir]
    const result = await executeCommand(ncmdumpPath, args)

    // 查找输出文件（基于输入文件名）
    if (result.success) {
      const fileInfo = path.parse(inputPath)
      const baseName = fileInfo.name
      const possibleExtensions = ['.mp3', '.flac', '.wav', '.m4a']
      let detectedOutputPath = null
      let detectedFilename = null
      for (const ext of possibleExtensions) {
        const testPath = path.join(outputDir, baseName + ext)
        if (fs.existsSync(testPath)) {
          detectedOutputPath = testPath
          detectedFilename = baseName + ext
          break
        }
      }
      return {
        success: true,
        error: undefined,
        outputPath: detectedOutputPath,
        filename: detectedFilename
      }
    } else {
      return {
        success: false,
        error: result.error
      }
    }

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

// 重复定义已移除

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

    const fileInfo = path.parse(filePath)
    const outputDir = fileInfo.dir

    const args = [filePath, '-o', outputDir]
    const result = await executeCommand(ncmdumpPath, args)

    if (!result.success) {
      return { success: false, error: result.error || '解密失败' }
    }

    const baseName = fileInfo.name
    const possibleExtensions = ['.mp3', '.flac', '.wav', '.m4a']
    for (const ext of possibleExtensions) {
      const testPath = path.join(outputDir, baseName + ext)
      if (fs.existsSync(testPath)) {
        return { success: true, outputPath: testPath, filename: baseName + ext }
      }
    }
    return { success: false, error: '解密成功但未找到输出文件' }
  } catch (error) {
    console.error('解密NCM文件错误:', error)
    return { success: false, error: error.message }
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
