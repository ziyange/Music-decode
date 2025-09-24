<template>
  <div v-if="!isElectronEnv && !dismissed" class="environment-warning">
    <div class="warning-card">
      <div class="warning-icon">⚠️</div>
      <div class="warning-content">
        <h3>环境提示</h3>
        <p>当前运行在浏览器环境中，部分功能受限：</p>
        <ul>
          <li>无法直接访问本地文件系统</li>
          <li>无法使用文件夹扫描功能</li>
          <li>无法进行NCM文件转换</li>
        </ul>
        <div class="warning-actions">
          <button @click="openElectronGuide" class="btn-primary">
            如何使用完整功能？
          </button>
          <button @click="dismissWarning" class="btn-secondary">
            我知道了
          </button>
        </div>
      </div>
    </div>
    
    <!-- 使用指南弹窗 -->
    <div v-if="showGuide" class="guide-modal" @click="closeGuide">
      <div class="guide-content" @click.stop>
        <div class="guide-header">
          <h3>如何使用完整功能</h3>
          <button @click="closeGuide" class="close-btn">×</button>
        </div>
        <div class="guide-body">
          <div class="guide-section">
            <h4>🖥️ 开发环境</h4>
            <p>如果您正在开发环境中，请运行以下命令启动Electron版本：</p>
            <code>npm run electron</code>
          </div>
          
          <div class="guide-section">
            <h4>📦 生产环境</h4>
            <p>请下载并安装桌面版应用程序，或构建Electron应用：</p>
            <code>npm run build:electron</code>
          </div>
          
          <div class="guide-section">
            <h4>🌐 浏览器环境限制</h4>
            <p>由于浏览器安全限制，以下功能在网页版中不可用：</p>
            <ul>
              <li>文件夹批量扫描</li>
              <li>NCM文件解密转换</li>
              <li>本地文件系统访问</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isElectron } from '@/utils/pathUtils'

const isElectronEnv = ref(false)
const showGuide = ref(false)
const dismissed = ref(false)

onMounted(() => {
  isElectronEnv.value = isElectron()
  console.log('Environment check:', isElectronEnv.value ? 'Electron' : 'Browser')
})

const openElectronGuide = () => {
  showGuide.value = true
}

const closeGuide = () => {
  showGuide.value = false
}

const dismissWarning = () => {
  dismissed.value = true
}
</script>

<style scoped>
.environment-warning {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
}

.warning-card {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #ffc107;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(255, 193, 7, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.warning-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.warning-content h3 {
  margin: 0 0 10px 0;
  color: #856404;
  font-size: 18px;
}

.warning-content p {
  margin: 0 0 10px 0;
  color: #856404;
  font-size: 14px;
}

.warning-content ul {
  margin: 10px 0;
  padding-left: 20px;
  color: #856404;
  font-size: 13px;
}

.warning-content li {
  margin: 5px 0;
}

.warning-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-primary, .btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.guide-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.guide-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #eee;
}

.guide-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.guide-body {
  padding: 20px;
}

.guide-section {
  margin-bottom: 25px;
}

.guide-section h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.guide-section p {
  margin: 0 0 10px 0;
  color: #666;
  line-height: 1.5;
}

.guide-section code {
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #e83e8c;
  display: block;
  margin: 10px 0;
}

.guide-section ul {
  margin: 10px 0;
  padding-left: 20px;
  color: #666;
}

.guide-section li {
  margin: 5px 0;
}
</style>