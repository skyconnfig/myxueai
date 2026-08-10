import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { getStoredToken } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', public: true },
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'create',
        name: 'create-video',
        component: () => import('@/views/CreateVideo.vue'),
        meta: { title: '创建视频' },
      },
      {
        path: 'projects/:id/plan',
        name: 'video-plan',
        component: () => import('@/views/VideoPlan.vue'),
        meta: { title: 'AI 方案' },
      },
      {
        path: 'projects/:id/director',
        name: 'video-director',
        component: () => import('@/views/Director.vue'),
        meta: { title: 'AI 导演' },
      },
      {
        path: 'projects/:id/production',
        name: 'production',
        component: () => import('@/views/Production.vue'),
        meta: { title: '生产进度' },
      },
      {
        path: 'projects/:id',
        name: 'video-detail',
        component: () => import('@/views/VideoDetail.vue'),
        meta: { title: '视频详情' },
      },
      {
        path: 'assets',
        name: 'assets',
        component: () => import('@/views/Assets.vue'),
        meta: { title: '素材库' },
      },
      {
        path: 'templates',
        name: 'templates',
        component: () => import('@/views/Templates.vue'),
        meta: { title: '模板市场' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.init()
  }

  const hasToken = !!getStoredToken()

  if (to.meta.public) {
    if (hasToken && (to.name === 'login' || to.name === 'register')) {
      return { name: 'dashboard' }
    }
    return true
  }

  if (!hasToken) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'XueAI Video Factory'
  document.title = `${title} · XueAI Video Factory`
})

export default router
