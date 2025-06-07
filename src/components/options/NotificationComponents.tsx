import React from 'react';
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

// Enhanced notification types and interfaces
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

// Enhanced animations for notifications
const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Enhanced Toast Notification Container
export const ToastContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  pointer-events: none;
`;

// Individual Toast Component
export const Toast = styled.div<{ type: ToastNotification['type']; isExiting?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid;
  pointer-events: auto;
  animation: ${props => props.isExiting ? slideOutRight : slideInRight} 0.3s ease-out;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  min-width: 320px;
  max-width: 400px;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return css`
          background: rgba(45, 202, 110, 0.1);
          border-color: rgba(45, 202, 110, 0.3);
          color: #2DCA6E;
        `;
      case 'error':
        return css`
          background: rgba(231, 76, 60, 0.1);
          border-color: rgba(231, 76, 60, 0.3);
          color: #E74C3C;
        `;
      case 'warning':
        return css`
          background: rgba(255, 191, 90, 0.1);
          border-color: rgba(255, 191, 90, 0.3);
          color: #FFBF5A;
        `;
      case 'info':
        return css`
          background: rgba(0, 120, 212, 0.1);
          border-color: rgba(0, 120, 212, 0.3);
          color: #0078D4;
        `;
    }
  }}
`;

export const ToastIcon = styled.div`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
`;

export const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ToastTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  color: inherit;
`;

export const ToastMessage = styled.div`
  font-size: 13px;
  opacity: 0.8;
  line-height: 1.4;
  color: inherit;
`;

export const ToastCloseButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
`;
// Unsaved changes indicator
export const UnsavedChangesIndicator = styled.div<{ visible: boolean }>`
  display: flex;
  flex-direction: row;
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 191, 90, 0.1);
  border: 1px solid rgba(255, 191, 90, 0.3);
  color: #FFBF5A;
  padding: 12px 20px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
  font-size: 14px;
  font-weight: 500;
  z-index: 9998;
  transition: all 0.3s ease;
  opacity: ${props => props.visible ? 1 : 0};
  transform: translateX(-50%) ${props => props.visible ? 'translateY(0)' : 'translateY(10px)'};
  pointer-events: ${props => props.visible ? 'auto' : 'none'};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

// Auto-save status indicator
export const AutoSaveStatus = styled.div<{ status: 'idle' | 'saving' | 'saved' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  animation: ${fadeIn} 0.3s ease-out;
  
  ${props => {
    switch (props.status) {
      case 'saving':
        return css`
          color: #FFBF5A;
        `;
      case 'saved':
        return css`
          color: #2DCA6E;
        `;
      case 'error':
        return css`
          color: #E74C3C;
        `;
      default:
        return css`
          color: rgba(255, 255, 255, 0.6);
        `;
    }
  }}
`;

// Loading spinner component
export const LoadingSpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: ${keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `} 1s linear infinite;
`;

// Enhanced save button with states (extends the base Button component)
export const EnhancedSaveButton = styled.button<{ hasUnsavedChanges?: boolean; variant?: 'primary' | 'destructive' | 'default' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  gap: 8px;
  
  background-color: ${props => {
    if (props.variant === 'primary') return '#0078D4';
    if (props.variant === 'destructive') return '#E74C3C';
    return '#444444';
  }};
  
  color: #FFFFFF;
  
  &:hover {
    background-color: ${props => {
      if (props.variant === 'primary') return '#106EBE';
      if (props.variant === 'destructive') return '#C0392B';
      return '#505050';
    }};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  ${props => props.hasUnsavedChanges && css`
    background-color: #FFBF5A;
    color: #000;
    
    &:hover {
      background-color: #E6A94D;
    }
    
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #FFBF5A, #2DCA6E);
      border-radius: 32px;
      z-index: -1;
      animation: ${keyframes`
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
      `} 2s ease-in-out infinite;
    }
  `}
`; 