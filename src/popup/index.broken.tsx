import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { sendToBackground } from "@plasmohq/messaging"
import { motion, AnimatePresence } from "framer-motion"
import styled from "@emotion/styled"
import { css } from "@emotion/react"

import type { Mode, TranslationSettings, Settings } from "~types/settings"
import { LANGUAGES } from "~utils/constants"
import { useSettings } from "~hooks/useSettings"
import { useRateLimit } from "~hooks/useRateLimit"

// Import the popup-specific CSS file for fonts only
import "./popup-style.css"

// Define theme colors to exactly match the reference image
const theme = {
  dark: {
    background: '#171719',
    panelBackground: '#222327',
    textPrimary: '#ffffff',
    textSecondary: '#9c9c9c',
    accent: '#6366f1',
    divider: '#35373f',
    header: {
      background: '#1f2023'
    },
    sidebar: {
      background: '#1f2023',
      border: '#35373f',
      text: '#9c9c9c',
      activeText: '#ffffff',
      activeBackground: '#2a2c31',
      activeBorder: '#6366f1',
      hoverBackground: '#272a2f'
    },
    button: {
      primary: '#6366f1',
      primaryHover: '#4f46e5',
      secondary: '#35373f',
      secondaryHover: '#42444e',
      destructive: '#dc2626',
      destructiveHover: '#b91c1c',
      text: '#ffffff'
    },
    toggle: {
      background: '#35373f',
      active: '#6366f1',
      handle: '#ffffff'
    }
  }
}

// Common styling
const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`

const flexBetween = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

// Main container - With increased width as requested
const PopupContainer = styled.div`
  width: 700px;
  min-height: 480px;
  background: ${theme.dark.background};
  color: ${theme.dark.textPrimary};
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
`

// Header - Matches the dark header in the reference image
const Header = styled.header`
  ${flexBetween};
  padding: 14px 20px;
  background: ${theme.dark.header.background};
  border-bottom: 1px solid ${theme.dark.divider};
`

const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: ${theme.dark.textPrimary};
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${theme.dark.textPrimary};
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

// Main content area
const ContentWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 0;
  flex: 1;
  overflow: hidden;
`

const Sidebar = styled.div`
  width: 220px;
  background-color: ${theme.dark.sidebar.background};
  border-right: 1px solid ${theme.dark.sidebar.border};
  display: flex;
  flex-direction: column;
`

const SidebarTab = styled.div<{ active: boolean }>`
  padding: 12px 16px;
  cursor: pointer;
  color: ${props => props.active ? theme.dark.sidebar.activeText : theme.dark.sidebar.text};
  background-color: ${props => props.active ? theme.dark.sidebar.activeBackground : 'transparent'};
  border-left: 3px solid ${props => props.active ? theme.dark.sidebar.activeBorder : 'transparent'};
  font-weight: ${props => props.active ? '600' : '400'};
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? theme.dark.sidebar.activeBackground : theme.dark.sidebar.hoverBackground};
  }
`

const TabIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`

const ContentArea = styled.div`
  padding: 16px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
`

// Section styling
const Section = styled.section`
  margin-bottom: 20px;
`

const SectionTitle = styled.h2`
  font-size: 17px;
  font-weight: 500;
  margin: 0 0 14px 0;
  color: ${theme.dark.textPrimary};
`

const SectionDivider = styled.div`
  height: 1px;
  background: ${theme.dark.divider};
  margin: 18px 0;
  opacity: 0.3;
`

// Form controls
const FormGroup = styled.div`
  margin-bottom: 16px;
`

const FormRow = styled.div`
  ${flexBetween};
  padding: 12px 0;
  min-height: 42px;
  border-radius: 3px;
`

const Label = styled.label`
  font-size: 16px;
  color: ${theme.dark.textPrimary};
`

const Description = styled.p`
  font-size: 14px;
  color: ${theme.dark.textSecondary};
  margin: 4px 0 0 0;
`

// Toggle switch - Styled to exactly match the green toggle in the reference image
const ToggleContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 22px;
  cursor: pointer;
`

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: ${theme.dark.toggle.active};
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`

const ToggleSlider = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${theme.dark.toggle.background};
  transition: 0.3s;
  border-radius: 34px;
  
  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`

// Button styles - Styled to exactly match the reference image
const Button = styled.button<{ variant?: 'primary' | 'destructive' | 'default' }>`
  padding: 8px 16px;
  border-radius: 30px; /* More rounded buttons as seen in the reference */
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  
  background-color: ${props => {
    if (props.variant === 'primary') return theme.dark.button.primary;
    if (props.variant === 'destructive') return theme.dark.button.destructive;
    return theme.dark.button.secondary;
  }};
  
  color: ${theme.dark.button.text};
  
  &:hover {
    background-color: ${props => {
      if (props.variant === 'primary') return theme.dark.button.primaryHover;
      if (props.variant === 'destructive') return theme.dark.button.destructiveHover;
      return theme.dark.button.secondaryHover;
    }};
  }
`

// Dropdown/Select - Styled to match the dropdown in the image
const Select = styled.select`
  background-color: transparent;
  color: ${theme.dark.textPrimary};
  padding: 6px 30px 6px 8px;
  border-radius: 4px;
  border: 1px solid ${theme.dark.divider};
  font-size: 15px;
  min-width: 120px;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
  background-repeat: no-repeat;
  background-position: right 8px center;
  
  &:focus {
    outline: none;
    border-color: ${theme.dark.button.primary};
  }
`

const Input = styled.input`
  background-color: ${theme.dark.panelBackground};
  color: ${theme.dark.textPrimary};
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid ${theme.dark.divider};
  font-size: 16px;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: ${theme.dark.button.primary};
  }
`

// Radio group for mode selection
const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`

const RadioInput = styled.input`
  margin-right: 10px;
`

const RadioText = styled.span`
  font-size: 16px;
`

// Styled components for ActionButton
const ActionButtonWrapper = styled.div`
  position: relative;
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 8px;
  group: hover;
`

const ActionButtonElement = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  background-color: ${props => props.active ? theme.dark.toggle.active : theme.dark.button.default};
  color: ${props => props.active ? 'white' : 'white'};
  
  &:hover {
    background-color: ${props => props.active ? '#25A75C' : '#555555'};
  }
  
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 6px 10px;
  background-color: #333;
  color: white;
  font-size: 13px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 10;
  
  ${ActionButtonWrapper}:hover & {
    opacity: 1;
  }
`

const TooltipArrow = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #333;
`

// Styled components for ShortcutsSection
const ShortcutsSectionWrapper = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: ${theme.dark.panelBackground};
  border-radius: 8px;
  border: 1px solid ${theme.dark.divider};
`

const ShortcutsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`

const ShortcutsTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: ${theme.dark.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`

const ShortcutIcon = styled.svg`
  width: 16px;
  height: 16px;
  viewBox: 0 0 24 24;
  fill: none;
  xmlns: "http://www.w3.org/2000/svg";
  rect {
    stroke: currentColor;
    stroke-width: 2;
  }
  path {
    fill: currentColor;
  }
  
  rect {
    x: 2;
    y: 4;
    width: 20;
    height: 16;
    rx: 2;
  }
  
  path {
    d: "M6 10h2v2H6v-2zM10 10h2v2h-2v-2zM14 10h2v2h-2v-2zM6 14h12v2H6v-2z";
  }
`

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${theme.dark.textPrimary};
  opacity: 0.7;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 1;
  }
`

const ExpandIcon = styled.svg<{ rotate?: boolean }>`
  width: 16px;
  height: 16px;
  viewBox: 0 0 24 24;
  fill: none;
  xmlns: "http://www.w3.org/2000/svg";
  transform: ${props => props.rotate ? 'rotate(180deg)' : 'rotate(0)'};
  transition: transform 0.3s ease;
  
  path {
    d: "M19 9l-7 7-7-7";
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`

const ShortcutsContent = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ShortcutsInfo = styled.div`
  font-size: 14px;
  color: ${theme.dark.textPrimary};
  opacity: 0.7;
  padding-bottom: 8px;
  border-bottom: 1px solid ${theme.dark.divider};
`

const ShortcutRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid ${theme.dark.divider};
  
  &:last-child {
    border-bottom: none;
  }
`

const ShortcutDescription = styled.span`
  font-size: 14px;
  color: ${theme.dark.textPrimary};
  opacity: 0.9;
`

const ShortcutKey = styled.kbd`
  padding: 4px 8px;
  font-size: 13px;
  font-weight: 600;
  color: ${theme.dark.textPrimary};
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid ${theme.dark.divider};
  border-radius: 4px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
`

const ShortcutNote = styled.p`
  font-size: 13px;
  color: ${theme.dark.textPrimary};
  opacity: 0.7;
  margin-top: 8px;
  padding-top: 8px;
`

// Styled components for RateLimitDisplay
const RateLimitWrapper = styled.div`
  padding: 16px;
  background-color: ${theme.dark.panelBackground};
  border-radius: 8px;
  border: 1px solid ${theme.dark.divider};
`

const RateLimitError = styled(RateLimitWrapper)`
  background-color: rgba(231, 76, 60, 0.1);
  border-color: rgba(231, 76, 60, 0.3);
  
  p {
    color: #e74c3c;
    font-size: 14px;
  }
`

const RateLimitTitle = styled.h4`
  font-size: 16px;
  font-weight: 500;
  color: ${theme.dark.textPrimary};
  margin-bottom: 10px;
`

const RateLimitProgress = styled.div`
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`

const RateLimitProgressInner = styled.div<{ width: number }>`
  height: 100%;
  width: ${props => props.width}%;
  background-color: ${theme.dark.toggle.active};
  border-radius: 4px;
  transition: width 0.3s ease;
`

const RateLimitText = styled.p`
  font-size: 14px;
  color: ${theme.dark.textPrimary};
  opacity: 0.9;
`

// Styled components for Switch
const SwitchWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`

const SwitchLabel = styled.label`
  font-size: 16px;
  color: ${theme.dark.textPrimary};
  font-weight: 500;
`

const SwitchDescription = styled.p`
  font-size: 14px;
  color: ${theme.dark.textPrimary};
  opacity: 0.7;
  margin-top: 4px;
`

// Mode icons component (reused from original)
const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 202 201" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_171_147)">
      <circle cx="101.067" cy="101.227" r="32.1546" fill="black"/>
      <circle cx="101.067" cy="101.227" r="31.5012" stroke="#A72D20" strokeWidth="1.30683"/>
    </g>
    <g filter="url(#filter1_d_171_147)">
      <ellipse cx="101.782" cy="101.42" rx="29.7391" ry="30.2609" fill="black"/>
    </g>
    <defs>
      <filter id="filter0_d_171_147" x="0.772979" y="0.061912" width="200.587" height="200.588" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feMorphology radius="11.4783" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_171_147"/>
        <feOffset dy="-0.871223"/>
        <feGaussianBlur stdDeviation="28.3304"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.670326 0 0 0 0 0.159863 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
      </filter>
      <filter id="filter1_d_171_147" x="52.8761" y="51.9923" width="97.8123" height="98.8553" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset/>
        <feGaussianBlur stdDeviation="9.58345"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
      </filter>
    </defs>
  </svg>
)

// Mode icons component (reused from original)
interface ActionButtonProps {
  mode: Mode
  activeMode: Mode
  onClick: () => void
  children: React.ReactNode
}

const ActionButton = ({ mode, activeMode, onClick, children }: ActionButtonProps) => {
  const icons = {
    summarize: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 8h16M8 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    analyze: (
      <svg width="20" height="20" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M35.9064 0.109375C16.194 0.109375 0.136719 16.1667 0.136719 35.8791C0.136719 55.5914 16.194 71.6487 35.9064 71.6487C44.44 71.6487 52.2816 68.6328 58.4391 63.6205L83.5695 95.1014C83.5695 95.1014 89.0738 95.9195 92.4913 92.358C95.9325 88.7694 95.1254 83.5488 95.1254 83.5488L63.6478 58.4117C68.6602 52.2543 71.6761 44.4127 71.6761 35.8791C71.6761 16.1667 55.6188 0.109375 35.9064 0.109375ZM35.9064 7.26397C51.7528 7.26397 64.5215 20.0327 64.5215 35.8791C64.5215 51.7254 51.7528 64.4941 35.9064 64.4941C20.06 64.4941 7.29132 51.7254 7.29132 35.8791C7.29132 20.0327 20.06 7.26397 35.9064 7.26397Z" fill="currentColor"/>
      </svg>
    ),
    explain: (
      <svg width="20" height="20" viewBox="0 0 89 99" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.55007 23.009C0.994225 23.8875 0.0273438 25.5563 0.0273438 27.3624V71.2893C0.0273438 73.1053 0.994225 74.7642 2.55007 75.6427C10.3882 80.0649 34.2363 93.503 41.8389 97.7877C42.5849 98.2049 43.4045 98.416 44.2291 98.416C45.034 98.416 45.8389 98.2147 46.5702 97.8123C54.1727 93.6159 77.9325 80.5213 85.805 76.1777C87.3903 75.309 88.3719 73.6304 88.3719 71.8046V27.3624C88.3719 25.5563 87.405 23.8875 85.8443 23.009C78.0159 18.5967 54.2169 5.18303 46.5849 0.883599C45.8438 0.466416 45.0193 0.255371 44.1996 0.255371C43.3751 0.255371 42.5554 0.466416 41.8143 0.883599C34.1823 5.18303 10.3784 18.5967 2.55007 23.009ZM81.0098 33.3895V70.3224L47.8806 88.5901V51.397L81.0098 33.3895ZM11.0017 26.7931L44.1996 8.07877L77.5791 26.8962L44.1996 45.1344L11.0017 26.7931Z" fill="currentColor"/>
      </svg>
    ),
    translate: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5h12M9 3v2m1.048 8.5A18.022 18.022 0 008 5.3m3.048 8.2l1.452 3.2m-1.452-3.2a18.019 18.019 0 002.048-3.2M9 19l3-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    free: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12h8M12 8v8M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }

  // Tooltip descriptions for each mode
  const tooltips = {
    summarize: "Condense text into key points",
    analyze: "Examine text for insights and patterns",
    explain: "Clarify complex concepts in simple terms",
    translate: "Convert text to another language",
    free: "Ask any question about selected text"
  }

  return (
    <ActionButtonWrapper>
      <ActionButtonElement
        onClick={onClick}
        active={activeMode === mode}
        aria-label={`${children} - ${tooltips[mode]}`}
        title={tooltips[mode]}>
        <span className="icon">{icons[mode]}</span>
        {children}
      </ActionButtonElement>
      <Tooltip>
        {tooltips[mode]}
        <TooltipArrow />
      </Tooltip>
    </ActionButtonWrapper>
  )
}

// ShortcutsSection component
const ShortcutsSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shortcuts = [
    { key: "Ctrl+Shift+Z", description: "Switch to Explain mode" },
    { key: "Ctrl+Shift+S", description: "Switch to Summarize mode" },
    { key: "Ctrl+Shift+A", description: "Switch to Analyze mode" },
    { key: "Ctrl+Shift+T", description: "Switch to Translate mode" },
    { key: "Ctrl+Shift+F / Command+Shift+F", description: "Open popup in Free mode" },
    { key: "Ctrl+Shift+X", description: "Toggle LightUp on/off" },
    { key: "Ctrl+Shift+R", description: "Toggle Radically Focus mode" },
    { key: "Ctrl+Shift+D", description: "Toggle Light/Dark theme" }
  ];
  
  return (
    <ShortcutsSectionWrapper>
      <ShortcutsHeader onClick={() => setIsExpanded(!isExpanded)}>
        <ShortcutsTitle>
          <ShortcutIcon />
          Keyboard Shortcuts
        </ShortcutsTitle>
        <ExpandButton aria-label={isExpanded ? "Collapse shortcuts" : "Expand shortcuts"}>
          <ExpandIcon rotate={isExpanded} />
        </ExpandButton>
      </ShortcutsHeader>
      
      {isExpanded && (
        <ShortcutsContent>
          <ShortcutsInfo>
            Use these shortcuts to quickly switch between modes or toggle features
          </ShortcutsInfo>
          {shortcuts.map((shortcut, index) => (
            <ShortcutRow key={index}>
              <ShortcutDescription>{shortcut.description}</ShortcutDescription>
              <ShortcutKey>{shortcut.key}</ShortcutKey>
            </ShortcutRow>
          ))}
          <ShortcutNote>
            After setting the mode via shortcut, select any text and LightUp will appear with your chosen mode.
          </ShortcutNote>
        </ShortcutsContent>
      )}
    </ShortcutsSectionWrapper>
  );
};

// Define interface for RateLimitDisplay data
interface RateLimitData {
  remaining: number;
  total: number;
  percentage: number;
}

// Switch component for settings
const Switch = ({ id, checked, onChange, label, description }) => {
  return (
    <SwitchWrapper>
      <div>
        <SwitchLabel htmlFor={id}>{label}</SwitchLabel>
        {description && <SwitchDescription>{description}</SwitchDescription>}
      </div>
      <ToggleContainer>
        <ToggleInput 
          type="checkbox" 
          id={id} 
          checked={checked} 
          onChange={onChange} 
        />
        <ToggleSlider />
      </ToggleContainer>
    </SwitchWrapper>
  )
}

// Main popup component
const IndexPopup = () => {
  const [activeMode, setActiveMode] = useState<Mode>("explain")
  const [fromLanguage, setFromLanguage] = useState("en")
  const [toLanguage, setToLanguage] = useState("es")
  const [customInstruction, setCustomInstruction] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const [showModeConfig, setShowModeConfig] = useState(false)
  const [preferredModes, setPreferredModes] = useState<Mode[]>(["summarize", "explain", "analyze", "free"])
  const [showSettings, setShowSettings] = useState(false)
  const [showFeatureNotification, setShowFeatureNotification] = useState(true)
  const [activeTab, setActiveTab] = useState('modes')
  
  const storage = new Storage()
  const { settings, setSettings } = useSettings()
  const isContextAwareEnabled = settings?.customization && 'contextAwareness' in settings.customization 
    ? settings.customization.contextAwareness 
    : false

  // All available modes
  const allModes: Mode[] = ["summarize", "analyze", "explain", "translate", "free"]

  useEffect(() => {
    console.log("Loading saved settings...")
    const loadSavedSettings = async () => {
      try {
        const savedMode = await storage.get("mode") as Mode
        const savedTranslationSettings = await storage.get("translationSettings") as TranslationSettings
        const savedPreferredModes = await storage.get("preferredModes") as Mode[] | undefined
        const featureNotificationDismissed = await storage.get("featureNotificationDismissed") as boolean
        
        console.log("Saved mode:", savedMode)
        console.log("Saved translation settings:", savedTranslationSettings)
        console.log("Saved preferred modes:", savedPreferredModes)
        
        if (savedMode) {
          setActiveMode(savedMode)
        }
        if (savedTranslationSettings) {
          setFromLanguage(savedTranslationSettings.fromLanguage)
          setToLanguage(savedTranslationSettings.toLanguage)
        }
        if (savedPreferredModes && savedPreferredModes.length > 0) {
          setPreferredModes(savedPreferredModes)
        }
        if (featureNotificationDismissed) {
          setShowFeatureNotification(false)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }
    loadSavedSettings()
  }, [])

  const handleModeChange = async (mode: Mode) => {
    setActiveMode(mode)
    await storage.set("mode", mode)
    
    // Check if the selected mode is in the preferred modes
    if (!preferredModes.includes(mode)) {
      // Add the mode to preferred modes
      let newPreferredModes: Mode[];
      
      if (preferredModes.length >= 4) {
        // If we already have 4 modes, replace the last one
        newPreferredModes = [...preferredModes.slice(0, 3), mode];
      } else {
        // Otherwise, just add it
        newPreferredModes = [...preferredModes, mode];
      }
      
      setPreferredModes(newPreferredModes);
      await storage.set("preferredModes", newPreferredModes);
      
      // Also update settings if they exist
      const currentSettings = await storage.get("settings") as Settings | undefined;
      if (currentSettings) {
        const updatedSettings = {
          ...currentSettings,
          preferredModes: newPreferredModes
        };
        
        await storage.set("settings", updatedSettings);
        
        // Notify all tabs about the mode configuration changes
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { 
                type: "MODES_UPDATED", 
                settings: updatedSettings,
                preferredModes: newPreferredModes
              }).catch(err => {
                // Ignore errors for tabs that don't have the content script running
                console.log(`Could not send message to tab ${tab.id}:`, err);
              });
            }
          });
        });
      }
    }
    
    if (mode === "translate") {
      const translationSettings = {
        fromLanguage,
        toLanguage
      };
     
      await storage.set("translationSettings", translationSettings);
    }
    
    // Notify all tabs about the mode change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { 
            type: "MODE_CHANGED", 
            mode,
            translationSettings: mode === "translate" ? { fromLanguage, toLanguage } : undefined,
            reprocessExisting: true // Add this flag to indicate we want to reprocess existing text
          }).catch(err => {
            // Ignore errors for tabs that don't have the content script running
            console.log(`Could not send message to tab ${tab.id}:`, err);
          });
        }
      });
    });
  }

  // Function to toggle a mode in the preferred modes list
  const togglePreferredMode = async (mode: Mode) => {
    let newPreferredModes: Mode[]
    
    if (preferredModes.includes(mode)) {
      // Don't allow removing if it would result in less than 1 mode
      if (preferredModes.length <= 1) {
        return
      }
      // Remove the mode
      newPreferredModes = preferredModes.filter(m => m !== mode)
    } else {
      // Don't allow adding if already at 4 modes
      if (preferredModes.length >= 4) {
        return
      }
      // Add the mode
      newPreferredModes = [...preferredModes, mode]
    }
    
    setPreferredModes(newPreferredModes)
    await storage.set("preferredModes", newPreferredModes)
    
    // Also update settings if they exist
    const currentSettings = await storage.get("settings") as Settings | undefined
    if (currentSettings) {
      const updatedSettings = {
        ...currentSettings,
        preferredModes: newPreferredModes
      };
      
      await storage.set("settings", updatedSettings);
      
      // Notify all tabs about the mode configuration changes
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              type: "MODES_UPDATED", 
              settings: updatedSettings,
              preferredModes: newPreferredModes
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
      
      // Show a brief success animation
      setShowSaveAnimation(true);
      setTimeout(() => {
        setShowSaveAnimation(false);
      }, 1500);
    }
  }

  useEffect(() => {
    if (activeMode === "translate") {
      storage.set("translationSettings", {
        fromLanguage,
        toLanguage
      });
    }
  }, [fromLanguage, toLanguage, activeMode]);

  // Function to handle immediate settings updates
  const handleImmediateSettingUpdate = async (key: string, value: any) => {
    try {
      if (!settings) return;
      
      const newSettings = {
        ...settings,
        customization: {
          ...settings.customization,
          [key]: value
        }
      };
      
      setSettings(newSettings);
      await storage.set("settings", newSettings);
      
      // Notify all tabs about the settings change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              type: "SETTINGS_UPDATED", 
              settings: newSettings,
              key,
              value
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
      
      // Show a brief success animation
      setShowSaveAnimation(true);
      setTimeout(() => {
        setShowSaveAnimation(false);
      }, 1500);
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
    }
  };

  const handleOpenOptions = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") })
  }

  const handleOpenPromptTemplates = () => {
    // Open the options page with the prompt-templates hash
    chrome.tabs.create({ 
      url: chrome.runtime.getURL("options.html#prompt-templates"),
      active: true
    });
  }

  const dismissFeatureNotification = async () => {
    setShowFeatureNotification(false)
    await storage.set("featureNotificationDismissed", true)
  }
  
  // We're using the activeTab state defined above to manage sidebar navigation
  
  return (
    <PopupContainer>
      {/* Toast notification for settings saved */}
      <AnimatePresence>
        {showSaveAnimation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: theme.dark.toggle.active,
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              zIndex: 50,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            Setting updated successfully
          </motion.div>
        )}
      </AnimatePresence>
      
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo />
          <HeaderTitle>LightUp</HeaderTitle>
        </div>
        <CloseButton>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </CloseButton>
      </Header>
      {/* Main Content Area with Sidebar */}
      <ContentWrapper>
        <Sidebar>
          <SidebarTab 
            active={activeTab === 'modes'} 
            onClick={() => setActiveTab('modes')}
          >
            <TabIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.5 12a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" stroke="currentColor" strokeWidth="2" />
                <path d="M12 5V3m0 18v-2M5 12H3m18 0h-2M7.05 7.05L5.636 5.636m12.728 12.728L16.95 16.95M7.05 16.95l-1.414 1.414M18.364 5.636L16.95 7.05" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </TabIcon>
            Modes
          </SidebarTab>
          
          <SidebarTab 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
          >
            <TabIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" />
              </svg>
            </TabIcon>
            Settings
          </SidebarTab>
          
          <SidebarTab 
            active={activeTab === 'shortcuts'} 
            onClick={() => setActiveTab('shortcuts')}
          >
            <TabIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </TabIcon>
            Shortcuts
          </SidebarTab>
          
          <SidebarTab 
            active={activeTab === 'account'} 
            onClick={() => setActiveTab('account')}
          >
            <TabIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15c-2.25 0-4.5.5625-6.75 1.6875 1.125 1.6875 3 2.8125 5.0625 3.1875.5625.1125 1.125.1875 1.6875.1875s1.125-.0625 1.6875-.1875c2.0625-.375 3.9375-1.5 5.0625-3.1875C16.5 15.5625 14.25 15 12 15z" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
          {/* New Feature Announcement */}
        {showFeatureNotification && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(45, 202, 110, 0.1)',
            border: '1px solid rgba(45, 202, 110, 0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            position: 'relative'
          }}>
            <div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>New Feature: Smart Mode</div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>LightUp now intelligently extracts the main content from pages, ignoring navigation and UI elements.</div>
            </div>
            <CloseButton onClick={dismissFeatureNotification} style={{ background: 'transparent' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </CloseButton>
          </div>
        )}
        
        <ContentArea>
          {/* Mode Selection Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <SectionTitle>
              Define LightUp's purpose
              <span style={{ marginLeft: '8px', color: 'rgba(255, 255, 255, 0.4)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
            </SectionTitle>
            <Button 
              onClick={() => setShowModeConfig(!showModeConfig)}
              variant="default"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {showModeConfig ? "Hide Mode Config" : "Configure Modes"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M12 6v12m-6-6h12" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  transform={showModeConfig ? "rotate(45, 12, 12)" : ""}
                />
              </svg>
            </Button>
          </div>
          
          {/* Mode Configuration Section */}
          {showModeConfig && (
            <Section style={{ 
              padding: '16px', 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: '8px', 
              marginBottom: '24px',
              border: `1px solid ${theme.dark.divider}`
            }}>
              <SectionTitle style={{ marginBottom: '16px', fontSize: '16px' }}>
                Configure Mode Selector (Choose up to 4)
              </SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {allModes.map((mode) => (
                  <div key={mode} style={{ position: 'relative' }}>
                    <button
                      onClick={() => togglePreferredMode(mode)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '30px',
                        fontSize: '15px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: preferredModes.includes(mode) ? theme.dark.toggle.active : theme.dark.button.default,
                        color: 'white',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {preferredModes.includes(mode) && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {mode === "summarize" && "Summarize"}
                      {mode === "analyze" && "Analyze"}
                      {mode === "explain" && "Explain"}
                      {mode === "translate" && "Translate"}
                      {mode === "free" && "Ask Anything"}
                    </button>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '8px' }}>
                These modes will appear in the mode selector when using LightUp.
              </p>
            </Section>
          )}
          
          {/* Available Actions */}
          <Section style={{ marginBottom: '24px' }}>
            <SectionTitle style={{ marginBottom: '16px' }}>
              Available actions
            </SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <ActionButton
                mode="summarize"
                activeMode={activeMode}
                onClick={() => handleModeChange("summarize")}>
                Summarize
              </ActionButton>
              <ActionButton
                mode="analyze"
                activeMode={activeMode}
                onClick={() => handleModeChange("analyze")}>
                Analyze
              </ActionButton>
              <ActionButton
                mode="explain"
                activeMode={activeMode}
                onClick={() => handleModeChange("explain")}>
                Explain
              </ActionButton>
              <ActionButton
                mode="translate"
                activeMode={activeMode}
                onClick={() => handleModeChange("translate")}>
                Translate
              </ActionButton>
              <ActionButton
                mode="free"
                activeMode={activeMode}
                onClick={() => handleModeChange("free")}>
                Ask Anything
              </ActionButton>
            </div>
          </Section>
          
          {/* Translation Settings */}
          {activeMode === "translate" && (
            <Section style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <Label style={{ display: 'block', marginBottom: '8px' }}>From</Label>
                  <Select 
                    value={fromLanguage}
                    onChange={(e) => setFromLanguage(e.target.value)}
                  >
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div style={{ flex: 1 }}>
                  <Label style={{ display: 'block', marginBottom: '8px' }}>To</Label>
                  <Select 
                    value={toLanguage}
                    onChange={(e) => setToLanguage(e.target.value)}
                  >
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Section>
          )}
          
          {/* Free Mode Info */}
          {activeMode === "free" && (
            <Section style={{ 
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: `1px solid ${theme.dark.divider}`
            }}>
              <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.8)', margin: '0' }}>
                In "Ask Anything" mode, you can have free-form conversations with the AI about any topic.
                {settings?.customization?.layoutMode === "sidebar" ? (
                  <span> With sidebar layout enabled, the AI assistant appears as a fixed sidebar on the right side of your screen.</span>
                ) : settings?.customization?.layoutMode === "centered" ? (
                  <span> With centered layout, the AI assistant appears as a larger modal in the middle of your screen with a blurred background for a more immersive experience.</span>
                ) : (
                  <span> With floating layout, you can either highlight text to ask about specific content or use the popup for general questions.</span>
                )}
              </p>
            </Section>
          )}
          
          {/* Context Awareness and Rate Limit */}
          <Section style={{ marginTop: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              {isContextAwareEnabled && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(45, 202, 110, 0.1)',
                  color: theme.dark.toggle.active,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Context Aware
                </div>
              )}
              
              <div style={{ flex: 1, marginLeft: isContextAwareEnabled ? '16px' : '0' }}>
                <RateLimitDisplay />
              </div>
            </div>
            
            {/* Shortcuts Section */}
            <ShortcutsSection />
          </Section>
        </ContentArea>
      </ContentWrapper>
    </PopupContainer>
  );
};

// RateLimitDisplay component implementation with proper typing
const RateLimitDisplay = () => {
  const { remainingActions, isLoading, error } = useRateLimit()
  
  if (isLoading) {
    return (
      <RateLimitWrapper>
        <p>Loading usage info...</p>
      </RateLimitWrapper>
    )
  }
  
  if (error) {
    return (
      <RateLimitError>
        <p>{error}</p>
      </RateLimitError>
    )
  }
  
  // Cast to proper type with the expected properties
  const rateLimitData = remainingActions as unknown as RateLimitData;
  
  return (
    <RateLimitWrapper>
      <RateLimitTitle>Daily Usage</RateLimitTitle>
      <RateLimitProgress>
        <RateLimitProgressInner width={rateLimitData?.percentage || 0} />
      </RateLimitProgress>
      <RateLimitText>
        {rateLimitData?.remaining || 0} / {rateLimitData?.total || 0} actions left today
      </RateLimitText>
    </RateLimitWrapper>
  )
}

// Error boundary wrapper from original file
const PopupWithErrorBoundary = () => {
  return <IndexPopup />
}

export default PopupWithErrorBoundary
