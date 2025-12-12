import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType = 'success' | 'error' | 'neutral';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
}

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ============================================================================
// HOOK
// ============================================================================

export const useNotification = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// ============================================================================
// ANIMATIONS - Respects reduced motion
// ============================================================================

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideDown = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(8px);
  }
`;

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const NotificationContainer = styled.div<{ position?: 'bottom' | 'top' }>`
  position: fixed;
  ${props => props.position === 'top' ? 'top: 16px;' : 'bottom: 16px;'}
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: ${props => props.position === 'top' ? 'column' : 'column-reverse'};
  gap: 8px;
  pointer-events: none;
  max-width: calc(100% - 32px);
`;

const NotificationItem = styled.div<{ 
  type: NotificationType; 
  isExiting: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  pointer-events: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 320px;
  
  /* Animation with reduced motion support */
  animation: ${props => props.isExiting ? slideDown : slideUp} 0.2s ease-out forwards;
  
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: ${props => props.isExiting ? 0 : 1};
  }
  
  /* Type-based styling - subtle, not overwhelming */
  ${props => {
    switch (props.type) {
      case 'success':
        return css`
          background: #1a1a1a;
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.2);
        `;
      case 'error':
        return css`
          background: #1a1a1a;
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.2);
        `;
      default:
        return css`
          background: #1a1a1a;
          color: #e5e5e5;
          border: 1px solid rgba(255, 255, 255, 0.1);
        `;
    }
  }}
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
`;

const Message = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ============================================================================
// ICONS - Minimal, clean
// ============================================================================

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="10.5" r="0.75" fill="currentColor"/>
  </svg>
);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface NotificationProviderProps {
  children: React.ReactNode;
  position?: 'bottom' | 'top';
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ 
  children, 
  position = 'bottom',
  maxNotifications = 3
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generate unique ID
  const generateId = useCallback(() => {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }, []);

  // Dismiss a notification with exit animation
  const dismiss = useCallback((id: string) => {
    // Clear any existing timeout
    const existingTimeout = timeoutsRef.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutsRef.current.delete(id);
    }

    // Start exit animation
    setExitingIds(prev => new Set([...prev, id]));
    
    // Remove after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setExitingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  }, []);

  // Dismiss all notifications
  const dismissAll = useCallback(() => {
    notifications.forEach(n => dismiss(n.id));
  }, [notifications, dismiss]);

  // Core notify function
  const notify = useCallback((
    message: string, 
    type: NotificationType = 'neutral',
    duration: number = type === 'error' ? 4000 : 2500
  ): string => {
    const id = generateId();
    
    const newNotification: Notification = {
      id,
      message,
      type,
      duration
    };

    setNotifications(prev => {
      // Limit notifications, remove oldest if needed
      const updated = [...prev, newNotification];
      if (updated.length > maxNotifications) {
        const toRemove = updated[0];
        dismiss(toRemove.id);
        return updated.slice(1);
      }
      return updated;
    });

    // Auto-dismiss
    if (duration > 0) {
      const timeout = setTimeout(() => {
        dismiss(id);
      }, duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [generateId, maxNotifications, dismiss]);

  // Convenience methods
  const success = useCallback((message: string, duration?: number) => {
    return notify(message, 'success', duration);
  }, [notify]);

  const error = useCallback((message: string, duration?: number) => {
    return notify(message, 'error', duration ?? 4000);
  }, [notify]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const contextValue: NotificationContextValue = {
    notify,
    success,
    error,
    dismiss,
    dismissAll
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer 
        position={position}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            type={notification.type}
            isExiting={exitingIds.has(notification.id)}
            role="alert"
          >
            {notification.type !== 'neutral' && (
              <IconWrapper>
                {notification.type === 'success' && <CheckIcon />}
                {notification.type === 'error' && <ErrorIcon />}
              </IconWrapper>
            )}
            <Message>{notification.message}</Message>
          </NotificationItem>
        ))}
      </NotificationContainer>
    </NotificationContext.Provider>
  );
};

// ============================================================================
// STANDALONE HOOK (for contexts without Provider)
// ============================================================================

interface UseStandaloneNotificationReturn extends NotificationContextValue {
  NotificationOutlet: React.FC<{ position?: 'bottom' | 'top' }>;
}

export const useStandaloneNotification = (): UseStandaloneNotificationReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const generateId = useCallback(() => {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }, []);

  const dismiss = useCallback((id: string) => {
    const existingTimeout = timeoutsRef.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutsRef.current.delete(id);
    }

    setExitingIds(prev => new Set([...prev, id]));
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setExitingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  }, []);

  const dismissAll = useCallback(() => {
    notifications.forEach(n => dismiss(n.id));
  }, [notifications, dismiss]);

  const notify = useCallback((
    message: string, 
    type: NotificationType = 'neutral',
    duration: number = type === 'error' ? 4000 : 2500
  ): string => {
    const id = generateId();
    
    setNotifications(prev => {
      const updated = [...prev, { id, message, type, duration }];
      if (updated.length > 3) {
        dismiss(updated[0].id);
        return updated.slice(1);
      }
      return updated;
    });

    if (duration > 0) {
      const timeout = setTimeout(() => dismiss(id), duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [generateId, dismiss]);

  const success = useCallback((message: string, duration?: number) => {
    return notify(message, 'success', duration);
  }, [notify]);

  const error = useCallback((message: string, duration?: number) => {
    return notify(message, 'error', duration ?? 4000);
  }, [notify]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const NotificationOutlet: React.FC<{ position?: 'bottom' | 'top' }> = ({ position = 'bottom' }) => (
    <NotificationContainer 
      position={position}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          type={notification.type}
          isExiting={exitingIds.has(notification.id)}
          role="alert"
        >
          {notification.type !== 'neutral' && (
            <IconWrapper>
              {notification.type === 'success' && <CheckIcon />}
              {notification.type === 'error' && <ErrorIcon />}
            </IconWrapper>
          )}
          <Message>{notification.message}</Message>
        </NotificationItem>
      ))}
    </NotificationContainer>
  );

  return {
    notify,
    success,
    error,
    dismiss,
    dismissAll,
    NotificationOutlet
  };
};

export default NotificationProvider;
