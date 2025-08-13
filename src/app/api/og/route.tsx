import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'castr.me'
    const subtitle = searchParams.get('subtitle') || 'Transform Nostr feeds into beautiful podcast feeds'
    const type = searchParams.get('type') || 'default'
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            backgroundImage: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
            }}
          />
          
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                borderRadius: '16px',
                padding: '16px 24px',
                boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)',
              }}
            >
              <span
                style={{
                  fontSize: '48px',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                castr.me
              </span>
            </div>
          </div>
          
          {/* Title */}
          <div
            style={{
              fontSize: '64px',
              fontWeight: 600,
              color: '#1f2937',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.2,
              marginBottom: '24px',
            }}
          >
            {title}
          </div>
          
          {/* Subtitle */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: 400,
              color: '#6b7280',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </div>
          
          {/* Type indicator */}
          {type !== 'default' && (
            <div
              style={{
                position: 'absolute',
                top: '40px',
                right: '40px',
                background: 'rgba(99, 102, 241, 0.1)',
                color: '#6366f1',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '20px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {type}
            </div>
          )}
          
          {/* Bottom accent */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '8px',
              background: 'linear-gradient(90deg, #6366f1, #ec4899)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
