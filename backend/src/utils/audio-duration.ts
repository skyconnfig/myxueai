import fs from 'node:fs'

/** Rough MP3 duration from file size (128kbps default). Good enough for scene timing. */
export function estimateMp3DurationSeconds(filePath: string, bitrateKbps = 128): number {
  const stat = fs.statSync(filePath)
  return Math.max(1, Math.ceil((stat.size * 8) / (bitrateKbps * 1000)))
}

export function estimateBufferMp3DurationSeconds(buffer: Buffer, bitrateKbps = 128): number {
  return Math.max(1, Math.ceil((buffer.length * 8) / (bitrateKbps * 1000)))
}
