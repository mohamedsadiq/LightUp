import React from "react"
import type { FontSizes } from "../../styles"

interface ConnectionStatusProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  currentTheme: 'light' | 'dark';
  fontSizes: FontSizes;
  handleReconnect: () => void;
}

export const ConnectionStatus = React.memo(({ 
  connectionStatus, 
  currentTheme, 
  fontSizes, 
  handleReconnect 
}: ConnectionStatusProps) => {
  if (connectionStatus === 'connected') return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 50,
        animation: 'fadeInSlideDown 0.2s ease-out'
      }}
    >
      <div style={{
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: fontSizes.connection,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: connectionStatus === 'connecting' 
          ? (currentTheme === 'dark' ? '#4A4A00' : '#FEF3C7')
          : (currentTheme === 'dark' ? '#4A0000' : '#FEE2E2'),
        color: connectionStatus === 'connecting' 
          ? (currentTheme === 'dark' ? '#FBBF24' : '#92400E')
          : (currentTheme === 'dark' ? '#F87171' : '#991B1B')
      }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: connectionStatus === 'connecting' 
            ? '#FBBF24' 
            : '#F87171',
          animation: connectionStatus === 'connecting' ? 'pulse 2s infinite' : 'none'
        }}></span>
        {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
        {connectionStatus === 'disconnected' && (
          <button 
            onClick={handleReconnect}
            style={{
              marginLeft: '4px',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 'inherit'
            }}
          >
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus'; 