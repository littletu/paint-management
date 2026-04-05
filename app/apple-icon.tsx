import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#f97316',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span style={{ color: 'white', fontSize: 90, fontWeight: 700, lineHeight: 1 }}>妙</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: 500, letterSpacing: 2 }}>根塗裝</span>
      </div>
    ),
    { ...size }
  )
}
