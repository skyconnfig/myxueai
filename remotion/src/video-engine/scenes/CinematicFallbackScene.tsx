import React from 'react'
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig, Video } from 'remotion'
import { getCameraPreset, getEmotionTint } from '../animations/camera-presets.js'
import { ChapterOverlay } from '../components/shared/ChapterOverlay.js'
import type { SceneComponentProps } from '../registry/types.js'
import { CaptionLayer } from '../subtitles/CaptionLayer.js'
import { SubtitleTrack } from '../subtitles/SubtitleTrack.js'
import { ShotDirector } from '../shot/ShotDirector.js'

function resolveSrc(src?: string) {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('renders/')) return staticFile(src)
  return staticFile(src)
}

export const CinematicFallbackScene: React.FC<SceneComponentProps> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // NOTE: voice audio is rendered by SceneRenderer's <SceneAudio /> — do NOT
  // render a second <Audio> here (would cause double playback / echo).
  const videoSrc = resolveSrc(scene.media?.video)
  const imageSrc = resolveSrc(scene.media?.image)
  const useVideo =
    (scene.media?.mediaType === 'video' || scene.media?.mediaType === 'both') && videoSrc

  const cameraType = scene.camera?.type ?? 'zoom_in'
  const motion = getCameraPreset(cameraType, scene.camera?.speed ?? 0.5)
  const progress = durationInFrames <= 1 ? 0 : frame / Math.max(durationInFrames - 1, 1)

  const scale = interpolate(progress, [0, 1], [motion.scaleFrom, motion.scaleTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const translateX = interpolate(progress, [0, 1], [motion.translateXFrom, motion.translateXTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const translateY = interpolate(progress, [0, 1], [motion.translateYFrom, motion.translateYTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const uiPulse =
    scene.meta?.sceneType === 'ui_demo'
      ? 1 + Math.sin((frame / fps) * Math.PI * 2) * 0.008
      : 1

  const hasSubtitleCues = Array.isArray(scene.props?.subtitleCues)
    && (scene.props?.subtitleCues as unknown[]).length > 0

  // Shot Engine: when the scene declares a `shot` config and we have an image,
  // delegate the image layer to ShotDirector (multi-sub-shot cinematography).
  // Video media and the no-shot case keep the legacy single-transform path.
  const useShotEngine = Boolean(scene.shot) && Boolean(imageSrc) && !useVideo

  return (
    <AbsoluteFill style={{ backgroundColor: '#05070A', overflow: 'hidden' }}>
      {useShotEngine ? (
        <ShotDirector scene={scene} durationInFrames={durationInFrames} imageSrc={imageSrc!} />
      ) : useVideo ? (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Video
            src={videoSrc!}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale * uiPulse}) translate(${translateX}px, ${translateY}px)`,
              transformOrigin: 'center center',
            }}
          />
        </AbsoluteFill>
      ) : imageSrc ? (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img
            src={imageSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${scale * uiPulse}) translate(${translateX}px, ${translateY}px)`,
              transformOrigin: 'center center',
            }}
          />
        </AbsoluteFill>
      ) : null}

      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, ${getEmotionTint(scene.meta?.emotion)} 45%, rgba(0,0,0,0.78) 100%)`,
        }}
      />

      {/* Film vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      <ChapterOverlay
        chapterIndex={scene.order}
        purpose={scene.purpose ?? scene.meta?.storyBeat}
        title={scene.meta?.viewerTask ?? undefined}
        durationInFrames={durationInFrames}
      />

      {hasSubtitleCues ? <SubtitleTrack scene={scene} /> : <CaptionLayer scene={scene} durationInFrames={durationInFrames} />}
    </AbsoluteFill>
  )
}

export function isCinematicFallbackComponent(component: string) {
  return component === 'CinematicFallback' || component === 'cinematic_still' || component === 'broll_video'
}
