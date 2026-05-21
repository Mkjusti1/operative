export default function BlockedPage() {
  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#1F2B2D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'rgba(13,138,158,.15)',
          border: '0.5px solid #23717B',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '24px',
        }}>
          🔒
        </div>

        <h1 style={{
          fontSize: '22px', fontWeight: 500,
          color: '#E5F9F8', marginBottom: '10px',
          letterSpacing: '-0.01em',
        }}>
          Access Restricted
        </h1>

        <p style={{
          fontSize: '13px', color: '#7ab8be',
          lineHeight: 1.7, marginBottom: '28px',
        }}>
          Operative is currently invite-only. Your email hasn't been added to the access list yet.
          Reach out to request access.
        </p>

        <div style={{
          background: '#243436',
          border: '0.5px solid #23717B',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          <p style={{ fontSize: '11px', color: '#4a7f85', marginBottom: '8px', letterSpacing: '.04em' }}>CONTACT</p>
          <p style={{ fontSize: '13px', color: '#E5F9F8', marginBottom: '4px' }}>Justice Obonin</p>
          
            href="mailto:mktechhub261@gmail.com"
            style={{ fontSize: '13px', color: '#12B2C1', textDecoration: 'none' }}
          >
            mktechhub261@gmail.com
          </a>
          <br />
          
            href="https://linkedin.com/company/mktechhub261"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', color: '#12B2C1', textDecoration: 'none' }}
          >
            linkedin.com/company/mktechhub261
          </a>
        </div>

        
          href="/"
          style={{
            fontSize: '12px', color: '#4a7f85',
            textDecoration: 'none',
          }}
        >
          ← Back to home
        </a>
      </div>
    </main>
  )
}