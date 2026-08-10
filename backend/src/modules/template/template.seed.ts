export const TEMPLATE_SEEDS = [
  {
    style: {
      slug: 'apple-saas',
      label: 'Apple SaaS 商业片',
      motionFamily: 'spring-subtle',
      negativePrompt: 'plastic 3D, floating card, cartoon, template animation',
    },
    template: {
      slug: 'saas-promo-60',
      name: 'SaaS 商业宣传 60秒',
      category: 'SaaS宣传',
      description: '痛点 → 方案 → 产品演示 → 成果 → CTA 标准商业结构',
      duration: 60,
      ratio: '16:9',
    },
    scenes: [
      { order: 1, sceneType: 'hook', componentName: 'cinematic_still', durationRatio: 0.12, cameraRule: 'close_up, slow_dolly_in', assetRole: 'illustration', voiceHint: '强钩子问题', transition: 'cut' },
      { order: 2, sceneType: 'problem', componentName: 'broll_video', durationRatio: 0.18, cameraRule: 'wide, tracking', assetRole: 'evidence', voiceHint: '描述痛点场景', transition: 'crossfade' },
      { order: 3, sceneType: 'solution', componentName: 'BrowserWindow', durationRatio: 0.2, cameraRule: 'medium, push_in', assetRole: 'illustration', voiceHint: '引入产品', transition: 'push' },
      { order: 4, sceneType: 'demo', componentName: 'ProductDemo', durationRatio: 0.25, cameraRule: 'over_shoulder, slow_dolly_in', assetRole: 'evidence', voiceHint: '功能演示', transition: 'crossfade' },
      { order: 5, sceneType: 'result', componentName: 'DashboardAnimation', durationRatio: 0.15, cameraRule: 'wide, orbit', assetRole: 'illustration', voiceHint: '成果数据', transition: 'crossfade' },
      { order: 6, sceneType: 'cta', componentName: 'CTA', durationRatio: 0.1, cameraRule: 'medium, static', assetRole: 'illustration', voiceHint: '行动号召', transition: 'fade' },
    ],
  },
  {
    style: { slug: 'tech-fast', label: '快节奏科技', motionFamily: 'spring-snappy', negativePrompt: 'PPT slide, white rectangle frame' },
    template: { slug: 'ai-tool-intro-30', name: 'AI 工具介绍 30秒', category: 'AI工具', description: 'Hook + 浏览器演示 + 功能揭示 + CTA', duration: 30, ratio: '9:16' },
    scenes: [
      { order: 1, sceneType: 'hook', componentName: 'HookScene', durationRatio: 0.15, cameraRule: 'close_up', assetRole: 'illustration', transition: 'cut' },
      { order: 2, sceneType: 'demo', componentName: 'BrowserWindow', durationRatio: 0.35, cameraRule: 'medium, push_in', assetRole: 'evidence', transition: 'push' },
      { order: 3, sceneType: 'solution', componentName: 'FeatureReveal', durationRatio: 0.3, cameraRule: 'tracking', assetRole: 'illustration', transition: 'crossfade' },
      { order: 4, sceneType: 'cta', componentName: 'CTA', durationRatio: 0.2, cameraRule: 'medium', assetRole: 'illustration', transition: 'fade' },
    ],
  },
  {
    style: { slug: 'launch-cinematic', label: '产品发布电影感', motionFamily: 'cinematic-dolly', negativePrompt: 'stock watermark, fake UI' },
    template: { slug: 'product-launch-45', name: '产品发布 45秒', category: '产品发布', description: '预告 → 揭示 → 仪表盘 → 社会证明 → CTA', duration: 45, ratio: '16:9' },
    scenes: [
      { order: 1, sceneType: 'hook', componentName: 'cinematic_still', durationRatio: 0.15, cameraRule: 'wide, slow_dolly_in', assetRole: 'illustration', transition: 'cut' },
      { order: 2, sceneType: 'solution', componentName: 'FeatureReveal', durationRatio: 0.25, cameraRule: 'close_up, orbit', assetRole: 'illustration', transition: 'push' },
      { order: 3, sceneType: 'demo', componentName: 'DashboardAnimation', durationRatio: 0.3, cameraRule: 'medium, pan_left', assetRole: 'evidence', transition: 'crossfade' },
      { order: 4, sceneType: 'result', componentName: 'broll_video', durationRatio: 0.15, cameraRule: 'tracking', assetRole: 'evidence', transition: 'crossfade' },
      { order: 5, sceneType: 'cta', componentName: 'CTA', durationRatio: 0.15, cameraRule: 'medium', assetRole: 'illustration', transition: 'fade' },
    ],
  },
  {
    style: { slug: 'brand-documentary', label: '品牌纪录片', motionFamily: 'spring-subtle', negativePrompt: 'cartoon, 3d render' },
    template: { slug: 'brand-ad-30', name: '品牌广告 30秒', category: '品牌广告', description: '情绪 → 故事 → 生活方式 B-roll → 品牌定版', duration: 30, ratio: '16:9' },
    scenes: [
      { order: 1, sceneType: 'hook', componentName: 'cinematic_still', durationRatio: 0.2, cameraRule: 'wide, handheld', assetRole: 'evidence', transition: 'cut' },
      { order: 2, sceneType: 'problem', componentName: 'broll_video', durationRatio: 0.3, cameraRule: 'tracking', assetRole: 'evidence', transition: 'crossfade' },
      { order: 3, sceneType: 'result', componentName: 'cinematic_still', durationRatio: 0.3, cameraRule: 'close_up, slow_dolly_in', assetRole: 'illustration', transition: 'crossfade' },
      { order: 4, sceneType: 'cta', componentName: 'CTA', durationRatio: 0.2, cameraRule: 'medium', assetRole: 'illustration', transition: 'fade' },
    ],
  },
  {
    style: { slug: 'tutorial-clean', label: '教程清晰风', motionFamily: 'spring-subtle', negativePrompt: 'over animation, particle effects' },
    template: { slug: 'tutorial-60', name: '教程视频 60秒', category: '教程视频', description: '问题 → 分步演示 × N → 总结 → CTA', duration: 60, ratio: '16:9' },
    scenes: [
      { order: 1, sceneType: 'hook', componentName: 'ProblemScene', durationRatio: 0.1, cameraRule: 'medium', assetRole: 'illustration', transition: 'cut' },
      { order: 2, sceneType: 'demo', componentName: 'BrowserWindow', durationRatio: 0.25, cameraRule: 'over_shoulder', assetRole: 'evidence', transition: 'crossfade' },
      { order: 3, sceneType: 'demo', componentName: 'ProductDemo', durationRatio: 0.25, cameraRule: 'close_up', assetRole: 'evidence', transition: 'crossfade' },
      { order: 4, sceneType: 'result', componentName: 'BeforeAfter', durationRatio: 0.2, cameraRule: 'medium', assetRole: 'illustration', transition: 'push' },
      { order: 5, sceneType: 'cta', componentName: 'CTA', durationRatio: 0.2, cameraRule: 'medium', assetRole: 'illustration', transition: 'fade' },
    ],
  },
] as const

export const COMPONENT_SEEDS = [
  { slug: 'cinematic_still', name: '电影静帧', remotionComponent: 'CinematicScene', motionPattern: 'ken-burns' },
  { slug: 'broll_video', name: 'B-roll 视频', remotionComponent: 'CinematicScene', motionPattern: 'video-broll' },
  { slug: 'ProductDemo', name: '产品演示', remotionComponent: 'ProductDemo', motionPattern: 'ui-interaction' },
  { slug: 'BrowserWindow', name: '浏览器窗口', remotionComponent: 'BrowserWindow', motionPattern: 'browser-reveal' },
  { slug: 'DashboardAnimation', name: '仪表盘动画', remotionComponent: 'DashboardAnimation', motionPattern: 'data-counter' },
  { slug: 'FeatureReveal', name: '功能揭示', remotionComponent: 'FeatureReveal', motionPattern: 'stagger-reveal' },
  { slug: 'BeforeAfter', name: '前后对比', remotionComponent: 'BeforeAfter', motionPattern: 'comparison' },
  { slug: 'CTA', name: '行动号召', remotionComponent: 'CTA', motionPattern: 'cta-pulse' },
  { slug: 'HookScene', name: '开场钩子', remotionComponent: 'HookScene', motionPattern: 'hook-impact' },
  { slug: 'ProblemScene', name: '痛点场景', remotionComponent: 'ProblemScene', motionPattern: 'tension-build' },
] as const
