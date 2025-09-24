<template>
  <div class="about-view">
    <!-- 导航菜单 -->
    <nav class="top-nav">
      <router-link to="/" class="nav-link">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">返回首页</span>
      </router-link>
      <router-link to="/about" class="nav-link active">
        <span class="nav-icon">ℹ️</span>
        <span class="nav-text">关于</span>
      </router-link>
    </nav>

    <div class="hero-section">
      <h2 class="hero-title">关于音乐解密器</h2>
      <p class="hero-subtitle">一个开源的音乐文件解密工具</p>
    </div>

    <div class="content-sections">
      <section class="section">
        <h3 class="section-title">项目介绍</h3>
        <div class="section-content">
          <p>
            音乐解密器是一个基于 Vue 3 和 TypeScript 开发的现代化 Web 应用，
            专门用于解密各种音乐平台的加密音频文件。本工具支持多种主流音乐平台的加密格式，
            为用户提供便捷的音乐文件转换服务。
          </p>
          <p>
            我们致力于为用户提供简洁、高效、安全的音乐解密体验，
            所有处理过程都在本地进行，确保用户文件的隐私安全。
          </p>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">支持的格式</h3>
        <div class="format-grid">
          <div class="format-card">
            <div class="format-icon">🎵</div>
            <h4>网易云音乐</h4>
            <p>.ncm 格式</p>
          </div>
          <div class="format-card">
            <div class="format-icon">🎶</div>
            <h4>QQ音乐</h4>
            <p>.qmc, .qmcflac, .qmcogg 格式</p>
          </div>
          <div class="format-card">
            <div class="format-icon">🎼</div>
            <h4>酷狗音乐</h4>
            <p>.kgm, .vpr 格式</p>
          </div>
          <div class="format-card">
            <div class="format-icon">🎤</div>
            <h4>酷我音乐</h4>
            <p>.kwm 格式</p>
          </div>
          <div class="format-card">
            <div class="format-icon">🎧</div>
            <h4>虾米音乐</h4>
            <p>.xm 格式</p>
          </div>
          <div class="format-card">
            <div class="format-icon">🎹</div>
            <h4>太合音乐</h4>
            <p>.tm0, .tm2, .tm3, .tm6 格式</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">技术栈</h3>
        <div class="tech-grid">
          <div class="tech-item">
            <div class="tech-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2,3H5.5L12,15L18.5,3H22L12,21L2,3Z"/>
              </svg>
            </div>
            <div class="tech-info">
              <h4>Vue 3</h4>
              <p>现代化的前端框架</p>
            </div>
          </div>
          <div class="tech-item">
            <div class="tech-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M1.125,0C0.502,0,0,0.502,0,1.125v21.75C0,23.498,0.502,24,1.125,24h21.75c0.623,0,1.125-0.502,1.125-1.125V1.125C24,0.502,23.498,0,22.875,0H1.125z M18.75,8.25H16.5v7.5h2.25V8.25z M15,8.25h-2.25v7.5H15V8.25z M11.25,8.25H9v7.5h2.25V8.25z M7.5,8.25H5.25v7.5H7.5V8.25z"/>
              </svg>
            </div>
            <div class="tech-info">
              <h4>TypeScript</h4>
              <p>类型安全的 JavaScript</p>
            </div>
          </div>
          <div class="tech-item">
            <div class="tech-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.23,12.004a2.236,2.236,0,0,1-2.235,2.236A2.236,2.236,0,0,1,9.759,12.004a2.236,2.236,0,0,1,2.236-2.236A2.236,2.236,0,0,1,14.23,12.004Z"/>
                <path d="M19.25,9.004a.75.75,0,0,0-.75-.75H5.5a.75.75,0,0,0-.75.75v6a.75.75,0,0,0,.75.75h13a.75.75,0,0,0,.75-.75Z"/>
              </svg>
            </div>
            <div class="tech-info">
              <h4>Vite</h4>
              <p>快速的构建工具</p>
            </div>
          </div>
          <div class="tech-item">
            <div class="tech-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
            </div>
            <div class="tech-info">
              <h4>Pinia</h4>
              <p>状态管理库</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">功能特性</h3>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🚀</div>
            <h4>高性能处理</h4>
            <p>采用现代化的 Web 技术，提供快速的文件处理体验</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔒</div>
            <h4>隐私保护</h4>
            <p>所有文件处理都在本地进行，不会上传到服务器</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📱</div>
            <h4>响应式设计</h4>
            <p>完美适配桌面和移动设备，随时随地使用</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⚡</div>
            <h4>批量处理</h4>
            <p>支持同时处理多个文件，提高工作效率</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🎯</div>
            <h4>拖拽上传</h4>
            <p>支持拖拽文件上传，操作简单直观</p>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🔧</div>
            <h4>开源免费</h4>
            <p>完全开源，免费使用，持续更新维护</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">使用须知</h3>
        <div class="notice-content">
          <div class="notice-item">
            <div class="notice-icon">⚠️</div>
            <div class="notice-text">
              <h4>法律声明</h4>
              <p>本工具仅供学习和研究使用，请遵守相关法律法规，尊重版权。用户应确保拥有所处理音频文件的合法使用权。</p>
            </div>
          </div>
          <div class="notice-item">
            <div class="notice-icon">🛡️</div>
            <div class="notice-text">
              <h4>隐私保护</h4>
              <p>我们重视用户隐私，所有文件处理都在您的设备本地进行，不会收集或存储任何用户数据。</p>
            </div>
          </div>
          <div class="notice-item">
            <div class="notice-icon">🔄</div>
            <div class="notice-text">
              <h4>持续更新</h4>
              <p>我们会持续更新和改进工具，添加对更多音乐格式的支持，优化用户体验。</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">联系我们</h3>
        <div class="contact-content">
          <p>如果您在使用过程中遇到问题，或有任何建议和反馈，欢迎通过以下方式联系我们：</p>
          <div class="contact-links">
            <a href="#" class="contact-link">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              GitHub
            </a>
            <a href="#" class="contact-link">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
              </svg>
              Email
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// 关于页面不需要额外的逻辑
</script>

<style scoped>
.about-view {
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 100%;
  box-sizing: border-box;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  padding-top: 1rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: white;
}

.nav-link.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-text {
  font-size: 0.95rem;
}

.hero-section {
  text-align: center;
  margin-bottom: 4rem;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.content-sections {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: white;
  margin-bottom: 2rem;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.section-content p {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.section-content p:last-child {
  margin-bottom: 0;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.format-card {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 0.75rem;
  text-align: center;
  transition: transform 0.3s ease;
}

.format-card:hover {
  transform: translateY(-4px);
}

.format-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.format-card h4 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.format-card p {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.9rem;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.tech-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 0.75rem;
  transition: transform 0.3s ease;
}

.tech-item:hover {
  transform: translateY(-2px);
}

.tech-icon {
  width: 3rem;
  height: 3rem;
  color: #667eea;
  flex-shrink: 0;
}

.tech-icon svg {
  width: 100%;
  height: 100%;
}

.tech-info h4 {
  color: #2c3e50;
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.tech-info p {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.9rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-item {
  text-align: center;
  padding: 1.5rem;
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-item h4 {
  color: white;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.feature-item p {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin: 0;
}

.notice-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.notice-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #fff3cd;
  border-radius: 0.75rem;
  border-left: 4px solid #ffc107;
}

.notice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-text h4 {
  color: #856404;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.notice-text p {
  color: #664d03;
  margin: 0;
  line-height: 1.6;
}

.contact-content p {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.contact-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.contact-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  font-weight: 500;
}

.contact-link:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
}

.contact-link svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .section {
    padding: 2rem 1.5rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .format-grid,
  .tech-grid,
  .features-grid {
    grid-template-columns: 1fr;
  }

  .tech-item {
    flex-direction: column;
    text-align: center;
  }

  .notice-item {
    flex-direction: column;
    text-align: center;
  }

  .contact-links {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .section {
    padding: 1.5rem 1rem;
  }

  .format-card,
  .tech-item,
  .feature-item {
    padding: 1rem;
  }
}
</style>
