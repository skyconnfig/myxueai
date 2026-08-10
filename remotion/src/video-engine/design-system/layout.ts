export const layout = {
  safeArea: {
    horizontal: 64,
    bottom: 120,
    top: 48,
  },
  ratios: {
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '1:1': { width: 1080, height: 1080 },
  },
  maxCaptionWidth: '86%',
  browserMockupWidth: '78%',
  phoneMockupWidth: '42%',
} as const
