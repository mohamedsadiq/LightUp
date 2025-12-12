import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

// Animation for status indicators
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