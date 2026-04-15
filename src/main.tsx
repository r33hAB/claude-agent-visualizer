import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

function detectWebGL(): { supported: boolean; message: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (gl) {
      return { supported: true, message: '' };
    }
    return {
      supported: false,
      message: 'WebGL is not available in this browser.',
    };
  } catch {
    return {
      supported: false,
      message: 'WebGL detection failed.',
    };
  }
}

function WebGLFallback({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0e1a',
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f59e0b' }}>
        WebGL Required
      </h1>
      <p style={{ maxWidth: '500px', lineHeight: 1.6, marginBottom: '1.5rem', color: '#94a3b8' }}>
        {message}
      </p>
      <div style={{
        background: '#1e293b',
        borderRadius: '8px',
        padding: '1.5rem',
        maxWidth: '500px',
        textAlign: 'left',
        fontSize: '0.875rem',
        lineHeight: 1.8,
      }}>
        <p style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '0.75rem' }}>
          To enable WebGL:
        </p>
        <ul style={{ color: '#94a3b8', paddingLeft: '1.25rem', margin: 0 }}>
          <li><strong>Chrome/Chromium:</strong> Go to <code style={{ color: '#22d3ee' }}>chrome://flags/#enable-webgl</code> and set to Enabled</li>
          <li><strong>Opera:</strong> Go to <code style={{ color: '#22d3ee' }}>opera://flags/#enable-webgl</code> and set to Enabled</li>
          <li><strong>Firefox:</strong> Go to <code style={{ color: '#22d3ee' }}>about:config</code> and set <code style={{ color: '#22d3ee' }}>webgl.force-enabled</code> to true</li>
          <li><strong>Safari:</strong> Preferences → Advanced → Show Develop menu, then Develop → Experimental Features → WebGL 2.0</li>
          <li><strong>All browsers:</strong> Ensure hardware acceleration is enabled in browser settings</li>
        </ul>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: '1.5rem',
          padding: '0.5rem 1.5rem',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        Retry
      </button>
    </div>
  );
}

const webgl = detectWebGL();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {webgl.supported ? <App /> : <WebGLFallback message={webgl.message} />}
  </StrictMode>,
);
