<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Clapperboard, Sparkles, Zap } from 'lucide-vue-next'
import { AUTH_ILLUSTRATIONS } from '@/constants/auth-illustrations'

const props = defineProps<{
  mode: 'login' | 'register'
}>()

const mounted = ref(false)
const art = computed(() => AUTH_ILLUSTRATIONS[props.mode])

const flowSteps = computed(() =>
  props.mode === 'login'
    ? ['输入账号', '验证身份', '进入工作台']
    : ['填写信息', '创建账户', '开始创作'],
)

onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true
  })
})
</script>

<template>
  <div class="auth-page" :class="{ 'auth-page--ready': mounted }" :data-mode="mode">
    <div class="auth-page__bg" aria-hidden="true">
      <div class="auth-page__orb auth-page__orb--blue" />
      <div class="auth-page__orb auth-page__orb--purple" />
      <div class="auth-page__grid" />
    </div>

    <div class="auth-page__layout">
      <!-- 左侧：品牌 + Storyset Pana 插画 -->
      <aside class="auth-page__visual">
        <header class="auth-page__brand">
          <div class="auth-page__logo">
            <span class="auth-page__logo-mark">X</span>
          </div>
          <div>
            <div class="auth-page__brand-name">XueAI</div>
            <div class="auth-page__brand-tag">Video Factory</div>
          </div>
        </header>

        <div class="auth-page__art-wrap">
          <img
            :src="art.src"
            :alt="art.alt"
            class="auth-page__art"
            loading="eager"
            decoding="async"
          />
          <div class="auth-page__art-glow" aria-hidden="true" />
        </div>

        <div class="auth-page__copy">
          <h1 class="auth-page__headline">{{ art.title }}</h1>
          <p class="auth-page__lede">{{ art.subtitle }}</p>
        </div>

        <ul class="auth-page__pipeline" aria-label="流程概览">
          <li
            v-for="(step, i) in flowSteps"
            :key="step"
            class="auth-page__pipeline-item"
            :style="{ '--delay': `${i * 80}ms` }"
          >
            <span class="auth-page__pipeline-dot" />
            <span>{{ step }}</span>
          </li>
        </ul>

        <div class="auth-page__chips">
          <span class="auth-page__chip"><Clapperboard class="w-3 h-3" /> 自动分镜</span>
          <span class="auth-page__chip"><Sparkles class="w-3 h-3" /> AI 脚本</span>
          <span class="auth-page__chip"><Zap class="w-3 h-3" /> 一键渲染</span>
        </div>
      </aside>

      <!-- 右侧：表单 -->
      <main class="auth-page__panel">
        <!-- 移动端插画 -->
        <div class="auth-page__mobile-art lg:hidden">
          <img :src="art.src" :alt="art.alt" class="auth-page__mobile-art-img" />
        </div>

        <div class="auth-page__card">
          <div class="auth-page__card-head">
            <h2 class="auth-page__card-title">
              {{ mode === 'login' ? '登录账户' : '创建账户' }}
            </h2>
            <p class="auth-page__card-desc">
              {{ mode === 'login' ? '继续你的视频生产任务' : '免费注册，立即获得 AI 点数' }}
            </p>
          </div>

          <slot />

          <p class="auth-page__switch">
            <template v-if="mode === 'login'">
              还没有账户？
              <RouterLink to="/register" class="auth-page__link">注册</RouterLink>
            </template>
            <template v-else>
              已有账户？
              <RouterLink to="/login" class="auth-page__link">登录</RouterLink>
            </template>
          </p>
        </div>

        <footer class="auth-page__footer">
          <a
            :href="art.storysetUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="auth-page__attribution"
          >
            Illustration «{{ art.storysetName }}» by
            <strong>Storyset</strong>
          </a>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  --auth-ease: cubic-bezier(0.22, 1, 0.36, 1);
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  overflow: hidden;
  background: var(--bg-dark);
  color: var(--text-primary);
}

.auth-page__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.auth-page__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}

.auth-page__orb--blue {
  width: 420px;
  height: 420px;
  top: -120px;
  left: -80px;
  background: var(--accent-blue);
}

.auth-page__orb--purple {
  width: 360px;
  height: 360px;
  bottom: -100px;
  right: 10%;
  background: var(--accent-purple);
}

.auth-page__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 30% 40%, black 20%, transparent 70%);
}

.auth-page__layout {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 100vh;
  min-height: 100dvh;
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .auth-page__layout {
    grid-template-columns: minmax(0, 1.05fr) minmax(380px, 480px);
  }
}

/* Visual panel */
.auth-page__visual {
  display: none;
  flex-direction: column;
  padding: 2.5rem 3rem 2rem;
  border-right: 1px solid var(--border-subtle);
  background: linear-gradient(160deg, rgba(21, 25, 34, 0.6) 0%, transparent 55%);
}

@media (min-width: 1024px) {
  .auth-page__visual {
    display: flex;
  }
}

.auth-page__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s var(--auth-ease), transform 0.6s var(--auth-ease);
}

.auth-page--ready .auth-page__brand {
  opacity: 1;
  transform: none;
}

.auth-page__logo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.65rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  display: grid;
  place-items: center;
}

.auth-page__logo-mark {
  font-weight: 800;
  font-size: 1rem;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.auth-page__brand-name {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.auth-page__brand-tag {
  font-size: 0.65rem;
  font-family: ui-monospace, monospace;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-page__art-wrap {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  max-height: 42vh;
  margin: 0 auto 1.5rem;
  width: 100%;
  max-width: 420px;
  opacity: 0;
  transform: translateY(20px) scale(0.98);
  transition:
    opacity 0.7s var(--auth-ease) 0.1s,
    transform 0.7s var(--auth-ease) 0.1s;
}

.auth-page--ready .auth-page__art-wrap {
  opacity: 1;
  transform: none;
}

.auth-page__art {
  width: 100%;
  height: auto;
  max-height: 100%;
  object-fit: contain;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 24px 48px rgba(59, 130, 246, 0.12));
}

.auth-page__art-glow {
  position: absolute;
  inset: 20% 10%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  z-index: 0;
}

.auth-page__copy {
  margin-bottom: 1.25rem;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s var(--auth-ease) 0.2s, transform 0.6s var(--auth-ease) 0.2s;
}

.auth-page--ready .auth-page__copy {
  opacity: 1;
  transform: none;
}

.auth-page__headline {
  margin: 0 0 0.5rem;
  font-size: clamp(1.35rem, 2.2vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.25;
}

.auth-page__lede {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-muted);
  max-width: 36ch;
}

.auth-page__pipeline {
  list-style: none;
  margin: 0 0 1.25rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-page__pipeline-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: ui-monospace, monospace;
  opacity: 0;
  transform: translateX(-8px);
  transition:
    opacity 0.5s var(--auth-ease) calc(0.3s + var(--delay, 0ms)),
    transform 0.5s var(--auth-ease) calc(0.3s + var(--delay, 0ms));
}

.auth-page--ready .auth-page__pipeline-item {
  opacity: 1;
  transform: none;
}

.auth-page__pipeline-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-blue);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
  flex-shrink: 0;
}

.auth-page__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.auth-page__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.65rem;
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--text-muted);
  background: rgba(27, 32, 42, 0.8);
  border: 1px solid var(--border-color);
  border-radius: 999px;
}

/* Form panel */
.auth-page__panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  min-height: 100vh;
  min-height: 100dvh;
}

@media (min-width: 1024px) {
  .auth-page__panel {
    padding: 2.5rem 2rem;
    background: rgba(11, 13, 16, 0.5);
  }
}

.auth-page__card {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: var(--glass-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  box-shadow:
    0 0 0 1px rgba(59, 130, 246, 0.06),
    0 24px 64px rgba(0, 0, 0, 0.35);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.65s var(--auth-ease) 0.15s, transform 0.65s var(--auth-ease) 0.15s;
}

.auth-page--ready .auth-page__card {
  opacity: 1;
  transform: none;
}

.auth-page__card-head {
  margin-bottom: 1.75rem;
}

.auth-page__card-title {
  margin: 0 0 0.35rem;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.auth-page__card-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

/* Mobile art */
.auth-page__mobile-art {
  width: 100%;
  max-width: 400px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

.auth-page__mobile-art-img {
  width: min(280px, 70vw);
  height: auto;
  filter: drop-shadow(0 16px 32px rgba(59, 130, 246, 0.1));
}

.auth-page__switch {
  margin: 1.5rem 0 0;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.auth-page__link {
  color: var(--accent-blue);
  font-weight: 600;
  margin-left: 0.25rem;
  transition: color 0.15s ease;
}

.auth-page__link:hover {
  color: var(--accent-blue-hover);
}

.auth-page__footer {
  margin-top: 1.5rem;
  text-align: center;
}

.auth-page__attribution {
  font-size: 0.65rem;
  color: var(--text-muted);
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.auth-page__attribution:hover {
  opacity: 1;
  color: var(--text-muted);
}

.auth-page__attribution strong {
  color: var(--accent-blue);
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .auth-page__brand,
  .auth-page__art-wrap,
  .auth-page__copy,
  .auth-page__pipeline-item,
  .auth-page__card {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
