import React from 'react'
import { AbsoluteFill, Img, staticFile, Video } from 'remotion'

function resolveSrc(src?: string) {
  if (!src) return null
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return staticFile(src)
}

export interface MediaLayerProps {
  image?: string
  video?: string
  mediaType?: 'image' | 'video' | 'both'
  objectFit?: 'cover' | 'contain'
  transform?: string
}

export const MediaLayer: React.FC<MediaLayerProps> = ({
  image,
  video,
  mediaType,
  objectFit = 'cover',
  transform,
}) => {
  const videoSrc = resolveSrc(video)
  const imageSrc = resolveSrc(image)
  const useVideo = (mediaType === 'video' || mediaType === 'both') && videoSrc

  if (useVideo) {
    return (
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Video
          src={videoSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            transform,
            transformOrigin: 'center center',
          }}
        />
      </AbsoluteFill>
    )
  }

  if (imageSrc) {
    return (
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={imageSrc}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            transform,
            transformOrigin: 'center center',
          }}
        />
      </AbsoluteFill>
    )
  }

  return null
}
