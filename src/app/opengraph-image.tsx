import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'BrickQuote - AI-Powered Quotes for Contractors'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #132039 50%, #1e3a5f 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#132039',
              border: '2px solid #1e3a5f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
            }}
          >
            🧱
          </div>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'white' }}>
            BrickQuote
          </span>
        </div>
        <h1
          style={{
            fontSize: '56px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            margin: '0 0 20px 0',
          }}
        >
          AI runs your quoting.
          <br />
          <span style={{ color: '#60a5fa' }}>You run the business.</span>
        </h1>
        <p
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          AI chatbot collects project details from your clients.
          You get ready-made quotes, invoices, and professional PDFs.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '32px',
            marginTop: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '20px' }}>
            ✓ AI Client Chat
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '20px' }}>
            ✓ One-Click Quotes
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '20px' }}>
            ✓ Invoicing Built In
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
