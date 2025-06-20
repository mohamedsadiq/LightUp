export const markdownStyles = {
    // whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '13px',
    lineHeight: '1.7',
    color: '#1a1a1a',
    '& p': {
      fontSize: '13px',
      margin: '0.75rem 0',
    },
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      fontWeight: '600',
      color: '#111111',
      margin: '1.5rem 0 0.75rem 0',
    },
    '& h1': { fontSize: '30px' },
    '& h2': { fontSize: '24px' },
    '& h3': { fontSize: '20px' },
    '& h4': { fontSize: '18px' },
    '& a': {
      color: '#2563eb',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& code': {
      backgroundColor: '#f3f4f6',
      padding: '0.2em 0.4em',
      borderRadius: '0.25rem',
      fontSize: '0.875em',
      fontFamily: "'JetBrains Mono', monospace",
      color: '#ef4444',
    },
    '& pre': {
      backgroundColor: '#f8fafc',
      padding: '1rem',
      borderRadius: '0.5rem',
      overflow: 'auto',
      border: '1px solid #e2e8f0',
      margin: '1rem 0',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
        color: '#334155',
        fontSize: '0.875em',
      },
    },
    '& blockquote': {
      borderLeft: '4px solid #e2e8f0',
      padding: '0.5rem 0 0.5rem 1rem',
      margin: '1rem 0',
      color: '#4b5563',
      fontStyle: 'italic',
    },
    '& ul, & ol': {
      paddingLeft: '1.5rem',
      margin: '0.75rem 0',
      marginTop: '1em',
      marginBottom: '1em',
    },
    '& li': {
      margin: '17px 0',
      marginTop: '0.5em',
      marginBottom: '0.5em',
    },
    '& img': {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: '0.375rem',
    },
    '& hr': {
      border: 'none',
      borderTop: '1px solid #e2e8f0',
      margin: '1.5rem 0',
    },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      margin: '1rem 0',
    },
    '& th, & td': {
      border: '1px solid #e2e8f0',
      padding: '0.5rem',
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: '#f8fafc',
      fontWeight: '600',
    },
    '& p:empty': {
      display: 'none',
    },
  } as const;