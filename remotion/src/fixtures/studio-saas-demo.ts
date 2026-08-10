import type { RenderInput } from '@xueai/shared'

/** Remotion Studio default props — SaaS ProductDemo single scene preview */
export const studioSaasDemoProps: RenderInput = {
  duration: 15,
  ratio: '16:9',
  width: 1920,
  height: 1080,
  fps: 30,
  scenes: [
    {
      order: 1,
      duration: 15,
      text: '一键配置工作流，实时查看团队效率数据',
      componentType: 'ProductDemo',
      purpose: 'demo',
      props: {
        title: 'XueAI 团队协作',
        subtitle: '仪表盘与工作流自动化',
        url: 'app.demo/dashboard',
        theme: 'dark',
        steps: [
          { at: 0.4, action: 'move', x: 0.35, y: 0.42, target: 'nav-dashboard' },
          { at: 5.25, action: 'click', target: 'nav-dashboard' },
          { at: 8.25, action: 'navigate', value: 'Automation Workflow' },
          { at: 11.25, action: 'dataChange', target: 'metric-primary', value: 87 },
          { at: 12.25, action: 'type', value: '任务已完成' },
        ],
      },
      caption: {
        text: '一键配置工作流，实时查看团队效率数据',
        style: { color: '#ffffff', fontSize: 38 },
      },
      shotType: 'over_shoulder',
      cameraMotion: 'push_in',
      transition: 'crossfade',
    },
  ],
  composition: {
    meta: {
      id: 'studio-saas-demo',
      title: 'Studio · SaaS ProductDemo',
      templateSlug: 'saas-promo-60',
      version: 1,
    },
    fps: 30,
    width: 1920,
    height: 1080,
    ratio: '16:9',
    duration: 15,
    scenes: [],
  },
}
