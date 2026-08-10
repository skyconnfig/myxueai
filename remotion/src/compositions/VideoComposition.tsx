import { AbsoluteFill, Audio, Img, Sequence, staticFile, useVideoConfig } from 'remotion'
import type { RenderInput } from '@xueai/shared'

type Scene = RenderInput['scenes'][number]

function resolveSrc(src?: string) {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('renders/')) return staticFile(src)
  return staticFile(src)
}

export const SceneSlide: React.FC<{ scene: Scene }> = ({ scene }) => {
  const imageSrc = resolveSrc(scene.image)
  const audioSrc = resolveSrc(scene.audio)

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #0B0D10 0%, #111827 45%, #1B202A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
      }}
    >
      {audioSrc ? <Audio src={audioSrc} volume={1} /> : null}
      {imageSrc ? (
        <Img
          src={imageSrc}
          style={{
            width: '82%',
            maxHeight: '58%',
            objectFit: 'cover',
            borderRadius: 16,
            marginBottom: 32,
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          }}
        />
      ) : null}
      <div
        style={{
          color: scene.caption?.style?.color ?? '#ffffff',
          fontSize: 42,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.45,
          fontFamily: '"Plus Jakarta Sans", "Noto Sans SC", system-ui, sans-serif',
          maxWidth: '88%',
          textShadow: '0 2px 24px rgba(0,0,0,0.6)',
        }}
      >
        {scene.caption?.text ?? scene.text}
      </div>
    </AbsoluteFill>
  )
}

export const VideoComposition: React.FC<RenderInput> = (props) => {
  const { fps } = useVideoConfig()
  let frameOffset = 0

  return (
    <AbsoluteFill style={{ backgroundColor: '#0B0D10' }}>
      {props.scenes.map((scene) => {
        const durationInFrames = Math.max(1, Math.round(scene.duration * fps))
        const from = frameOffset
        frameOffset += durationInFrames
        return (
          <Sequence key={scene.order} from={from} durationInFrames={durationInFrames}>
            <SceneSlide scene={scene} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
