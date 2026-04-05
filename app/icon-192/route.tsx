import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
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
          gap: 6,
        }}
      >
        <span style={{ color: 'white', fontSize: 96, fontWeight: 700, lineHeight: 1 }}>妙</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 28, fontWeight: 500, letterSpacing: 3 }}>根塗裝</span>
      </div>
    ),
    { width: 192, height: 192 }
  )
}
