import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { sendToBackground } from "@plasmohq/messaging"
import { motion, AnimatePresence } from "framer-motion"
import styled from "@emotion/styled"
import { css, keyframes } from "@emotion/react"

import type { Mode, TranslationSettings, Settings } from "~types/settings"
import { LANGUAGES } from "~utils/constants"
import { useSettings } from "~hooks/useSettings"
import { useRateLimit } from "~hooks/useRateLimit"
import { useEnabled } from "~hooks/useEnabled"
import { useLocale } from "~hooks/useLocale"
import { getMessage, SUPPORTED_LANGUAGES } from "~utils/i18n"
import { useMessage } from "~hooks/useMessage"
import LanguageSelector from "~components/LanguageSelector"
import { Globe } from "lucide-react"

// Import notification system
import { useStandaloneNotification } from "~components/notifications/Notification"

// Import the popup-specific CSS file for fonts only
import "./popup-style.css"

import logoUrl from '../../assets/icon.png';

// Theme now uses CSS custom properties - see popup-style.css for light/dark values
// This object provides fallbacks and semantic names for styled components
const theme = {
  // CSS variables are used for actual values, these are just semantic access points
  background: "var(--popup-bg)",
  foreground: "var(--popup-fg)",
  sidebar: "var(--popup-sidebar-bg)",
  sidebarActive: "var(--popup-sidebar-active)",
  sidebarText: "var(--popup-sidebar-text)",
  sidebarTextActive: "var(--popup-sidebar-text-active)",
  content: "var(--popup-content-bg)",
  border: "var(--popup-border)",
  primary: "var(--popup-primary)",
  primaryHover: "var(--popup-primary-hover)",
  destructive: "var(--popup-destructive)",
  destructiveHover: "var(--popup-destructive-hover)",
  divider: "var(--popup-divider)",
  button: {
    default: "var(--popup-btn-default)",
    defaultHover: "var(--popup-btn-default-hover)",
    text: "var(--popup-btn-text)"
  },
  toggle: {
    active: "var(--popup-toggle-active)",
    inactive: "var(--popup-toggle-inactive)",
    track: "var(--popup-toggle-track)"
  },
  card: "var(--popup-card)",
  cardHover: "var(--popup-card-hover)",
  header: "var(--popup-header)",
  secondaryText: "var(--popup-secondary-text)",
  input: {
    background: "var(--popup-input-bg)",
    border: "var(--popup-input-border)",
    focusBorder: "var(--popup-input-focus-border)"
  },
  select: {
    background: "var(--popup-select-bg)",
    border: "var(--popup-select-border)"
  },
  overlay: "var(--popup-overlay-bg)",
  version: {
    background: "var(--popup-version-bg)",
    color: "var(--popup-version-color)",
    border: "var(--popup-version-border)"
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
  width: 750px;
  height: 600px;
  background: ${theme.background};
  color: ${theme.foreground};
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  will-change: auto; /* Optimize for performance */
`

// Header - Matches the dark header in the reference image
const Header = styled.header`
  ${flexBetween};
  padding: 14px 20px;
  background: ${theme.header};
  border-bottom: 1px solid ${theme.border};
  height: 80px;
`

const HeaderTitle = styled.h1`
        font-size: 22px; 
  font-weight: 600; 
  color: ${theme.foreground};
  margin: 0; 
  display: flex;
  align-items: center;
`;

const HeaderLogoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderTitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const VersionBadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const ToggleStatusGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const ToggleStatusLabel = styled.span`
  font-size: 14px;
  color: ${theme.secondaryText};
`;

const VersionBadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 12px;
`;

const BetaBadge = styled.span`
  position: relative;
  background: var(--popup-badge-bg, linear-gradient(135deg, rgb(56 56 56) 0%, rgb(33 33 33) 100%));
  color: ${theme.foreground};
        font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    padding: 1px;
    background: var(--popup-badge-border, linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1)));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const VersionNumber = styled.span`
  color: ${theme.version.color};
        font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  background: ${theme.version.background};
  padding: 3px 8px;
  border-radius: 7px;
  border: 1px solid ${theme.version.border};
`;

const LogoImage = styled.img`
  height: 3.5rem; /* 24px */
  width: 3.5rem;  /* 24px */
  margin-right: 0.5rem; /* 8px */
  border-radius: 9px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${theme.foreground};
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background: var(--popup-sidebar-active);
  }
`

// Main content area
const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  padding: 15px 0 0px 12px;
  overflow: hidden; // Prevents the wrapper itself from scrolling
  position: relative; // For positioning the overlay
`

// Overlay that appears when extension is disabled
const DisabledOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${theme.overlay};
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 2rem;
  color: ${theme.foreground};
  text-align: center;
  border-radius: 0 0 10px 10px;
`

// Sidebar
const Sidebar = styled.nav`
  width: 192px;
  background: ${theme.sidebar};
  padding: 0 13px 0 0;
  flex-shrink: 0; // Prevents sidebar from shrinking
  border-right: 1px solid ${theme.border};
`

const SidebarItem = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.active ? theme.sidebarActive : 'transparent'};
  border: none;
  color: ${props => props.active ? theme.sidebarTextActive : theme.sidebarText};
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  border-radius:7px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? theme.sidebarActive : 'var(--popup-sidebar-active)'};
    color: ${theme.sidebarTextActive};
  }
`

const SidebarIcon = styled.div`
  width: 18px;
  height: 18px;
  margin-right: 10px;
  opacity: 0.9;
  ${flexCenter};
`

const SidebarDivider = styled.div`
  height: 1px;
  background: ${theme.divider};
  margin: 16px 12px;
  opacity: 0.3;
`

const SidebarSectionTitle = styled.div`
  color: ${theme.secondaryText};
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px 16px 8px;
`

// Content area - Fixed scrolling issues
const ContentArea = styled.div`
  flex: 1;
  padding: 9px 24px 0 35px;
  background: ${theme.background};
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* Allow shrinking */
  scroll-behavior: smooth;
  
  /* Optimize scrolling performance */
  -webkit-overflow-scrolling: touch;
  transform: translateZ(0); /* Force hardware acceleration */
  scrollbar-width: none; /* Hide scrollbar in Firefox */
  -ms-overflow-style: none; /* Hide scrollbar in legacy Edge/IE */

  &::-webkit-scrollbar {
    display: none; /* Hide scrollbar in Chrome/Safari */
  }
`

// Section styling
const Section = styled.section`
  margin-bottom: 20px;
`

const SectionTitle = styled.h2`
  font-size: 17px;
  font-weight: 500;
  margin: 0 0 14px 0;
  color: ${theme.foreground};
`

const SectionDivider = styled.div`
  height: 1px;
  background: ${theme.divider};
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
  gap: 20px;
  
  > div:first-child {
    flex: 1;
    min-width: 0;
  }
  
  > div:last-child {
    flex-shrink: 0;
  }
`

const Label = styled.label`
  font-size: 16px;
  color: ${theme.foreground};
`

const Description = styled.p`
  font-size: 14px;
  color: ${theme.secondaryText};
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
    background-color: ${theme.toggle.active};
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
  background-color: ${theme.toggle.track};
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
    if (props.variant === 'primary') return theme.primary;
    if (props.variant === 'destructive') return theme.destructive;
    return theme.button.default;
  }};
  
  color: ${props => props.variant === 'primary' || props.variant === 'destructive' ? '#FFFFFF' : theme.button.text};
  
  &:hover {
    background-color: ${props => {
    if (props.variant === 'primary') return theme.primaryHover;
    if (props.variant === 'destructive') return theme.destructiveHover;
    return theme.button.defaultHover;
  }};
  }
`

// Dropdown/Select - Styled to match the dropdown in the image
const Select = styled.select`
  background-color: ${theme.select.background};
  color: ${theme.foreground};
  padding: 6px 30px 6px 8px;
  border-radius: 4px;
  border: 1px solid ${theme.select.border};
  font-size: 15px;
  min-width: 120px;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--popup-select-arrow, white)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
  background-repeat: no-repeat;
  background-position: right 8px center;
  
  &:focus {
    outline: none;
    border-color: ${theme.primary};
  }
`

const Input = styled.input`
  background-color: ${theme.input.background};
  color: ${theme.foreground};
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid ${theme.input.border};
  font-size: 16px;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: ${theme.input.focusBorder};
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
    background: var(--popup-sidebar-active);
  }
`

const RadioInput = styled.input`
  margin-right: 10px;
`

const RadioText = styled.span`
  font-size: 16px;
`

// Mode icons component (reused from original)
const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 202 201" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_171_147)">
      <circle cx="101.067" cy="101.227" r="32.1546" fill="black" />
      <circle cx="101.067" cy="101.227" r="31.5012" stroke="#A72D20" strokeWidth="1.30683" />
    </g>
    <g filter="url(#filter1_d_171_147)">
      <ellipse cx="101.782" cy="101.42" rx="29.7391" ry="30.2609" fill="black" />
    </g>
    <defs>
      <filter id="filter0_d_171_147" x="0.772979" y="0.061912" width="200.587" height="200.588" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feMorphology radius="11.4783" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_171_147" />
        <feOffset dy="-0.871223" />
        <feGaussianBlur stdDeviation="28.3304" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.670326 0 0 0 0 0.159863 0 0 0 1 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape" />
      </filter>
      <filter id="filter1_d_171_147" x="52.8761" y="51.9923" width="97.8123" height="98.8553" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset />
        <feGaussianBlur stdDeviation="9.58345" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape" />
      </filter>
    </defs>
  </svg>
)


// Main popup component
const IndexPopup = () => {
  const { settings, setSettings, isConfigured } = useSettings()
  const { remainingActions, isLoading, error, refreshRateLimit } = useRateLimit()
  const { isEnabled, handleEnabledChange } = useEnabled()
  const { locale, isLoading: isLocaleLoading, changeLocale } = useLocale()

  const [activeTab, setActiveTab] = useState('general')
  const [activeModeConfig, setActiveModeConfig] = useState(false)
  const [activeMode, setActiveMode] = useState<string>('explain')
  const { success: notifySuccess, error: notifyError, NotificationOutlet } = useStandaloneNotification()
  const [feedbackType, setFeedbackType] = useState<"general" | "bug" | "feature" | "other">("general")
  const [feedbackContent, setFeedbackContent] = useState("")
  const [feedbackEmail, setFeedbackEmail] = useState("")

  // Theme handling - set data-theme attribute based on settings
  useEffect(() => {
    const themeSetting = settings?.customization?.theme || 'dark';
    let effectiveTheme: 'light' | 'dark' = 'dark';

    if (themeSetting === 'system') {
      // Check system preference
      effectiveTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effectiveTheme = themeSetting as 'light' | 'dark';
    }

    // Set the data-theme attribute on document.documentElement
    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Listen for system theme changes if in system mode
    if (themeSetting === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings?.customization?.theme]);

  // Localized strings
  const logoAlt = useMessage("logoAlt", "LightUp Logo")
  const extensionName = "LightUp"
  const turnOffText = useMessage("turnOff", "Turn Off")
  const turnOnText = useMessage("turnOn", "Turn On")
  const betaLabel = useMessage("betaLabel", "Beta")
  const extensionDisabledText = useMessage("extensionDisabled", "LightUp is currently Off")
  const enableExtensionMessage = useMessage(
    "enableExtensionMessage",
    "Toggle the switch in the header or the button below to enable LightUp and access all features."
  )
  const enableButtonText = useMessage("enableButton", "Enable LightUp")
  const tabGeneral = useMessage("tabGeneral", "General")
  const tabAppearance = useMessage("tabAppearance", "Appearance")
  const tabLanguage = useMessage("tabLanguage", "Language")
  const tabKeyboard = useMessage("tabKeyboard", "Keyboard Shortcuts")

  // Get preferred modes from settings or use defaults (max 3)
  const preferredModes: string[] = Array.from(
    new Set((settings?.customization as any)?.preferredModes || ['summarize', 'explain', 'analyze'])
  ).slice(0, 3) as string[]
  const allModes = ['summarize', 'analyze', 'challenge', 'explain', 'translate', 'free']

  const LayoutDisplaySection = () => (
    <Section>
      <SectionTitle>{getMessage("layoutDisplayTitle")}</SectionTitle>
      <Description>{getMessage("layoutDisplayDesc")}</Description>
      <div style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '16px', marginBottom: '16px', color: theme.foreground }}>
          {getMessage("layoutModeLabel")}
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px'
          }}
        >
          {[
            {
              value: 'floating',
              label: getMessage("layoutOptionFloating"),
              icon: (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="4"
                    y="4"
                    width="16"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="8" r="1" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2" />
                </svg>
              )
            },
            {
              value: 'sidebar',
              label: getMessage("layoutOptionSidebar"),
              icon: (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2" />
                </svg>
              )
            },
            {
              value: 'centered',
              label: getMessage("layoutOptionCentered"),
              icon: (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="2"
                    y="4"
                    width="20"
                    height="16"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <rect
                    x="6"
                    y="8"
                    width="12"
                    height="8"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              )
            }
          ].map(layoutOption => (
            <div
              key={layoutOption.value}
              onClick={() => updateSettings('layoutMode', layoutOption.value)}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = theme.cardHover
                event.currentTarget.style.borderColor =
                  layoutOption.value === settings?.customization?.layoutMode
                    ? theme.toggle.active
                    : theme.border
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = theme.card
                event.currentTarget.style.borderColor =
                  layoutOption.value === settings?.customization?.layoutMode
                    ? theme.toggle.active
                    : 'transparent'
              }}
              style={{
                padding: '16px',
                background: theme.card,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border:
                  layoutOption.value === settings?.customization?.layoutMode
                    ? `2px solid ${theme.toggle.active}`
                    : '2px solid transparent',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <div style={{ marginBottom: '8px' }}>{layoutOption.icon}</div>
              <span style={{ fontSize: '14px' }}>{layoutOption.label}</span>
            </div>
          ))}
        </div>

        <SectionDivider />

        <FormRow>
          <div>
            <Label>{getMessage("resultsFontSizeLabel")}</Label>
            <Description>{getMessage("resultsFontSizeDesc")}</Description>
          </div>
          <Select
            value={settings?.customization?.fontSize}
            onChange={(event) => updateSettings('fontSize', event.target.value)}
            style={{ width: '120px' }}
          >
            <option value="x-small">{getMessage("fontSizeXSmall")}</option>
            <option value="small">{getMessage("fontSizeSmall")}</option>
            <option value="medium">{getMessage("fontSizeMedium")}</option>
            <option value="large">{getMessage("fontSizeLarge")}</option>
            <option value="x-large">{getMessage("fontSizeXLarge")}</option>
            <option value="xx-large">{getMessage("fontSizeXXLarge")}</option>
          </Select>
        </FormRow>

        <SectionDivider />

        <FormRow>
          <div>
            <Label>{getMessage("popupAnimationLabel")}</Label>
            <Description>{getMessage("popupAnimationDesc")}</Description>
          </div>
          <Select
            value={settings?.customization?.popupAnimation}
            onChange={(event) => updateSettings('popupAnimation', event.target.value)}
            style={{ width: '120px' }}
          >
            <option value="fade">{getMessage("popupAnimationOptionFade")}</option>
            <option value="slide">{getMessage("popupAnimationOptionSlide")}</option>
            <option value="scale">{getMessage("popupAnimationOptionScale")}</option>
            <option value="none">{getMessage("popupAnimationOptionNone")}</option>
          </Select>
        </FormRow>

        {settings?.customization?.layoutMode === 'floating' && (
          <>
            <SectionDivider />

            <FormRow>
              <div>
                <Label>{getMessage("popupMarginLabel")}</Label>
                <Description>{getMessage("popupMarginDesc")}</Description>
              </div>
              <Select
                value={settings?.customization?.popupMargin}
                onChange={(event) =>
                  updateSettings('popupMargin', parseInt(event.target.value, 10))
                }
                style={{ width: '120px' }}
              >
                <option value="4">4px</option>
                <option value="8">8px</option>
                <option value="12">12px</option>
                <option value="16">16px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
              </Select>
            </FormRow>
          </>
        )}

      </div>
    </Section>
  )

  const ThemeSection = () => (
    <Section>
      <SectionTitle>{getMessage("themeTitle")}</SectionTitle>
      <Description>{getMessage("themeDescription")}</Description>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '16px'
        }}
      >
        {[
          {
            value: 'dark',
            label: getMessage("darkTheme"),
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          },
          {
            value: 'light',
            label: getMessage("lightTheme"),
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          },
          {
            value: 'system',
            label: getMessage("systemTheme"),
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )
          }
        ].map((themeOption) => (
          <div
            key={themeOption.value}
            onClick={() => updateSettings('theme', themeOption.value)}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = theme.cardHover
              event.currentTarget.style.borderColor =
                themeOption.value === settings?.customization?.theme
                  ? theme.toggle.active
                  : theme.border
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = theme.card
              event.currentTarget.style.borderColor =
                themeOption.value === settings?.customization?.theme
                  ? theme.toggle.active
                  : 'transparent'
            }}
            style={{
              padding: '16px',
              background: theme.card,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border:
                themeOption.value === settings?.customization?.theme
                  ? `2px solid ${theme.toggle.active}`
                  : '2px solid transparent',
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <div style={{ marginBottom: '8px' }}>{themeOption.icon}</div>
            <span style={{ fontSize: '14px' }}>{themeOption.label}</span>
          </div>
        ))}
      </div>
    </Section>
  )

  const handleFeedbackSubmit = () => {
    const trimmedContent = feedbackContent.trim()

    if (!trimmedContent) {
      notifyError(getMessage('feedbackContentRequired', undefined, 'Please enter your feedback before sending.'))
      return
    }

    const subject = `LightUp Feedback - ${feedbackType}`

    const lines: string[] = []
    lines.push(`Type: ${feedbackType}`)
    if (feedbackEmail.trim()) {
      lines.push(`From: ${feedbackEmail.trim()}`)
    }
    lines.push('')
    lines.push(trimmedContent)

    try {
      const mailtoUrl = `mailto:boimaginations@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`
      window.open(mailtoUrl, '_blank')

      notifySuccess(getMessage('feedbackReadyToSend', undefined, 'Your feedback email is ready to send.'))

      setFeedbackType('general')
      setFeedbackContent('')
      setFeedbackEmail('')
    } catch (error) {
      console.error('Failed to open feedback email:', error)
      notifyError(getMessage('feedbackError', undefined, 'Could not start an email.'))
    }
  }

  // Handler for updating a single setting
  const updateSettings = async (key: string, value: any) => {
    if (!settings) return

    const storage = new Storage()
    const newSettings = {
      ...settings,
      customization: {
        ...settings.customization,
        [key]: value
      }
    }

    // Update local state
    setSettings(newSettings)

    // Save to storage
    await storage.set("settings", newSettings)

    // Dispatch event for other components in the same window
    window.dispatchEvent(
      new CustomEvent('settingsUpdated', { detail: { settings: newSettings } })
    )

    // Notify all tabs about the settings change for real-time updates
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "SETTINGS_UPDATED",
              settings: newSettings,
              updatedKey: key
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
    }
  }

  // Function to update multiple settings at once
  const updateMultipleSettings = async (updates: Record<string, any>) => {
    if (!settings) return

    const storage = new Storage()
    const newSettings = {
      ...settings,
      customization: {
        ...settings.customization,
        ...updates
      }
    }

    // Update local state
    setSettings(newSettings)

    // Save to storage
    await storage.set("settings", newSettings)

    // Dispatch event for other components in the same window
    window.dispatchEvent(
      new CustomEvent('settingsUpdated', { detail: { settings: newSettings } })
    )

    // Notify all tabs about the settings change for real-time updates
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "SETTINGS_UPDATED",
              settings: newSettings,
              updatedKeys: Object.keys(updates)
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
    }
  }

  // Handler for toggling modes in preferences
  const togglePreferredMode = async (mode: string) => {
    // Use Set to ensure no duplicates in the current modes
    const currentModes: string[] = [...new Set((settings?.customization as any)?.preferredModes || preferredModes)] as string[]
    let newModes: string[]

    if (currentModes.includes(mode)) {
      // Don't allow removing all modes - keep at least one
      if (currentModes.length <= 1) return
      newModes = currentModes.filter(m => m !== mode)
    } else {
      // Limit to 3 modes max
      if (currentModes.length >= 3) return
      newModes = [...currentModes, mode]
    }

    // Update settings
    updateSettings('preferredModes', newModes)

    // Also notify all tabs about the mode configuration changes specifically
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "MODES_UPDATED",
              preferredModes: newModes
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
    }
  }

  // Set active mode and save to settings
  const handleModeChange = async (mode: string) => {
    setActiveMode(mode)
    await updateSettings('defaultMode', mode)

    const existingPreferred: string[] = ((settings?.customization as any)?.preferredModes || preferredModes) as string[]

    if (!existingPreferred.includes(mode)) {
      let updatedModes: string[]

      if (existingPreferred.length < 3) {
        updatedModes = [...existingPreferred, mode]
      } else {
        // Replace the last mode to keep the list at 3 while including the new mode
        updatedModes = [...existingPreferred.slice(0, 2), mode]
      }

      await updateSettings('preferredModes', updatedModes)
    }

    const storage = new Storage()

    // If the mode is translate, also save translation settings
    if (mode === "translate" && settings?.translationSettings) {
      await storage.set("translationSettings", settings.translationSettings);
    }

    // Additional notification for mode change specifically
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "MODE_CHANGED",
              mode,
              translationSettings: mode === "translate" ? settings?.translationSettings : undefined,
              reprocessExisting: true // Add this flag to indicate we want to reprocess existing text
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
    }
  }

  // Initialize active mode from settings
  useEffect(() => {
    if ((settings?.customization as any)?.defaultMode) {
      setActiveMode((settings?.customization as any).defaultMode)
    }
  }, [(settings?.customization as any)?.defaultMode])

  // We're using the useEnabled hook instead of a custom implementation
  // This hook handles loading the current state from storage and provides
  // the handleEnabledChange function to toggle the state

  // Use the handleEnabledChange function from the useEnabled hook
  // This function handles all the necessary storage updates and event notifications

  // Icons for the different modes
  const modeIcons = {
    summarize: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 8h16M8 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    analyze: (
      <svg width="20" height="20" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-6">
        <path d="M35.9064 0.109375C16.194 0.109375 0.136719 16.1667 0.136719 35.8791C0.136719 55.5914 16.194 71.6487 35.9064 71.6487C44.44 71.6487 52.2816 68.6328 58.4391 63.6205L83.5695 95.1014C83.5695 95.1014 89.0738 95.9195 92.4913 92.358C95.9325 88.7694 95.1254 83.5488 95.1254 83.5488L63.6478 58.4117C68.6602 52.2543 71.6761 44.4127 71.6761 35.8791C71.6761 16.1667 55.6188 0.109375 35.9064 0.109375ZM35.9064 7.26397C51.7528 7.26397 64.5215 20.0327 64.5215 35.8791C64.5215 51.7254 51.7528 64.4941 35.9064 64.4941C20.06 64.4941 7.29132 51.7254 7.29132 35.8791C7.29132 20.0327 20.06 7.26397 35.9064 7.26397Z" fill="currentColor" />
      </svg>
    ),
    challenge: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    explain: (
      <svg width="20" height="20" viewBox="0 0 89 99" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.55007 23.009C0.994225 23.8875 0.0273438 25.5563 0.0273438 27.3624V71.2893C0.0273438 73.1053 0.994225 74.7642 2.55007 75.6427C10.3882 80.0649 34.2363 93.503 41.8389 97.7877C42.5849 98.2049 43.4045 98.416 44.2291 98.416C45.034 98.416 45.8389 98.2147 46.5702 97.8123C54.1727 93.6159 77.9325 80.5213 85.805 76.1777C87.3903 75.309 88.3719 73.6304 88.3719 71.8046V27.3624C88.3719 25.5563 87.405 23.8875 85.8443 23.009C78.0159 18.5967 54.2169 5.18303 46.5849 0.883599C45.8438 0.466416 45.0193 0.255371 44.1996 0.255371C43.3751 0.255371 42.5554 0.466416 41.8143 0.883599C34.1823 5.18303 10.3784 18.5967 2.55007 23.009ZM81.0098 33.3895V70.3224L47.8806 88.5901V51.397L81.0098 33.3895ZM11.0017 26.7931L44.1996 8.07877L77.5791 26.8962L44.1996 45.1344L11.0017 26.7931Z" fill="currentColor" />
      </svg>
    ),
    translate: (
      <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    ),
    free: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12h8M12 8v8M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <PopupContainer>
      {/* Notification outlet */}
      <NotificationOutlet />
      <Header>
        <HeaderLogoWrapper>
          <LogoImage src={logoUrl} alt={logoAlt} />
          <HeaderTitleGroup>
            <HeaderTitle>{extensionName}</HeaderTitle>
            <VersionBadgeRow>
              <BetaBadge>{betaLabel}</BetaBadge>
              <VersionNumber>v0.1.18</VersionNumber>
            </VersionBadgeRow>
          </HeaderTitleGroup>
        </HeaderLogoWrapper>

        <ToggleStatusGroup>
          <ToggleStatusLabel>
            {isEnabled ? turnOffText : turnOnText}
          </ToggleStatusLabel>
          <ToggleContainer
            onClick={async (e) => {
              e.preventDefault()
              e.stopPropagation()
              try {
                // Update the state optimistically for instant feedback
                const newState = !isEnabled;
                // Call the handler to update the state in storage and notify other components
                await handleEnabledChange(newState);
              } catch (error) {
                console.error('Failed to update enabled state:', error);
              }
            }}
            style={{ cursor: 'pointer' }}
            aria-label={isEnabled ? turnOffText : turnOnText}
            role="switch"
            aria-checked={isEnabled}
          >
            <ToggleInput
              type="checkbox"
              checked={isEnabled}
              onChange={() => { }} // Empty onChange to avoid React warning about readonly input with no handler
              aria-hidden="true"
              tabIndex={-1}
            />
            <ToggleSlider />
          </ToggleContainer>
        </ToggleStatusGroup>
      </Header>
      <ContentWrapper>
        {/* Overlay when extension is disabled */}
        <AnimatePresence>
          {!isEnabled && (
            <DisabledOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2 style={{ fontSize: '24px', marginTop: '0', marginBottom: '0', fontWeight: 'bold' }}>
                {extensionDisabledText}
              </h2>
              <p style={{ fontSize: '16px', opacity: 0.8, maxWidth: '400px', lineHeight: '1.5' }}>
                {enableExtensionMessage}
              </p>
              <button
                onClick={async () => {
                  try {
                    await handleEnabledChange(true);
                  } catch (error) {
                    console.error('Failed to enable extension:', error);
                  }
                }}
                style={{
                  marginTop: '0.5rem',
                  backgroundColor: theme.toggle.active,
                  border: 'none',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '27px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>


                {enableButtonText}
              </button>
            </DisabledOverlay>
          )}
        </AnimatePresence>
        <Sidebar>
          {/* Main Navigation */}
          <SidebarItem active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>


            </SidebarIcon>
            {tabGeneral}
          </SidebarItem>
          <SidebarItem active={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')}>
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
            </SidebarIcon>
            {tabAppearance}
          </SidebarItem>

          <SidebarItem active={activeTab === 'language'} onClick={() => setActiveTab('language')}>
            <SidebarIcon>
              <Globe size={24} color="currentColor" />
            </SidebarIcon>
            {tabLanguage}
          </SidebarItem>
          <SidebarItem active={activeTab === 'keyboard'} onClick={() => setActiveTab('keyboard')}>
            <SidebarIcon>
              <svg width="80" height="80" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0 0 0)">
                <path d="M6.44141 7.95293C5.99958 7.95293 5.64141 8.3111 5.64141 8.75293C5.64141 9.19476 5.99958 9.55293 6.44141 9.55293H6.45141C6.89323 9.55293 7.25141 9.19476 7.25141 8.75293C7.25141 8.3111 6.89323 7.95293 6.45141 7.95293H6.44141Z" fill="currentColor" />
                <path d="M5.63945 12.1279C5.63945 11.6861 5.99763 11.3279 6.43945 11.3279H6.44945C6.89128 11.3279 7.24945 11.6861 7.24945 12.1279C7.24945 12.5698 6.89128 12.9279 6.44945 12.9279H6.43945C5.99763 12.9279 5.63945 12.5698 5.63945 12.1279Z" fill="currentColor" />
                <path d="M10.1445 7.95293C9.7027 7.95293 9.34453 8.3111 9.34453 8.75293C9.34453 9.19476 9.7027 9.55293 10.1445 9.55293H10.1545C10.5964 9.55293 10.9545 9.19476 10.9545 8.75293C10.9545 8.3111 10.5964 7.95293 10.1545 7.95293H10.1445Z" fill="currentColor" />
                <path d="M9.3582 12.1279C9.3582 11.6861 9.71638 11.3279 10.1582 11.3279H10.1682C10.61 11.3279 10.9682 11.6861 10.9682 12.1279C10.9682 12.5698 10.61 12.9279 10.1682 12.9279H10.1582C9.71638 12.9279 9.3582 12.5698 9.3582 12.1279Z" fill="currentColor" />
                <path d="M8 14.7529C7.58579 14.7529 7.25 15.0887 7.25 15.5029C7.25 15.9171 7.58579 16.2529 8 16.2529H16C16.4142 16.2529 16.75 15.9171 16.75 15.5029C16.75 15.0887 16.4142 14.7529 16 14.7529H8Z" fill="currentColor" />
                <path d="M13.0457 8.75293C13.0457 8.3111 13.4039 7.95293 13.8457 7.95293H13.8557C14.2975 7.95293 14.6557 8.3111 14.6557 8.75293C14.6557 9.19476 14.2975 9.55293 13.8557 9.55293H13.8457C13.4039 9.55293 13.0457 9.19476 13.0457 8.75293Z" fill="currentColor" />
                <path d="M17.5479 7.95293C17.106 7.95293 16.7479 8.3111 16.7479 8.75293C16.7479 9.19476 17.106 9.55293 17.5479 9.55293H17.5579C17.9997 9.55293 18.3579 9.19476 18.3579 8.75293C18.3579 8.3111 17.9997 7.95293 17.5579 7.95293H17.5479Z" fill="currentColor" />
                <path d="M13.0369 12.1279C13.0369 11.6861 13.3951 11.3279 13.8369 11.3279H13.8469C14.2887 11.3279 14.6469 11.6861 14.6469 12.1279C14.6469 12.5698 14.2887 12.9279 13.8469 12.9279H13.8369C13.3951 12.9279 13.0369 12.5698 13.0369 12.1279Z" fill="currentColor" />
                <path d="M17.5557 11.3279C17.1138 11.3279 16.7557 11.6861 16.7557 12.1279C16.7557 12.5698 17.1138 12.9279 17.5557 12.9279H17.5657C18.0075 12.9279 18.3657 12.5698 18.3657 12.1279C18.3657 11.6861 18.0075 11.3279 17.5657 11.3279H17.5557Z" fill="currentColor" />
                <path fillRule="evenodd" clipRule="evenodd" d="M4.25 4.62793C3.00736 4.62793 2 5.63529 2 6.87793V17.3779C2 18.6206 3.00736 19.6279 4.25 19.6279H19.7501C20.9927 19.6279 22.0001 18.6206 22.0001 17.3779V6.87793C22.0001 5.63529 20.9927 4.62793 19.7501 4.62793H4.25ZM3.5 6.87793C3.5 6.46372 3.83579 6.12793 4.25 6.12793H19.7501C20.1643 6.12793 20.5001 6.46372 20.5001 6.87793V17.3779C20.5001 17.7921 20.1643 18.1279 19.7501 18.1279H4.25C3.83579 18.1279 3.5 17.7921 3.5 17.3779V6.87793Z" fill="currentColor" />
              </svg>

            </SidebarIcon>
            {tabKeyboard}
          </SidebarItem>
          <SidebarItem
            active={false}
            onClick={() => {
              if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.openOptionsPage();
              }
            }}
          >
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>

            </SidebarIcon>
            {getMessage("tabAdvanced")}
          </SidebarItem>

          {/* Divider */}
          <SidebarDivider />

          {/* Important Links */}
          {/* <SidebarSectionTitle>Support</SidebarSectionTitle> */}
          {/* <SidebarItem active={activeTab === 'documentation'} onClick={() => setActiveTab('documentation')}>
            <SidebarIcon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </SidebarIcon>
            Documentation
          </SidebarItem> */}
          <SidebarItem active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')}>
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>

            </SidebarIcon>
            {getMessage("tabFeedback")}
          </SidebarItem>
          <SidebarItem active={activeTab === 'privacy'} onClick={() => setActiveTab('privacy')}>
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>

            </SidebarIcon>
            {getMessage("tabPrivacy")}
          </SidebarItem>



          <SidebarDivider />

          <SidebarItem
            onClick={() => window.open('https://www.boimaginations.com/lightup', '_blank')}
            active={false}
          >
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
              </svg>

            </SidebarIcon>
            {getMessage("website")}
          </SidebarItem>

          <SidebarItem
            onClick={() => window.open('https://chromewebstore.google.com/detail/lightup-ai-powered-web-an/pncapgeoeedlfppkohlbelelkkihikel/reviews', '_blank')}
            active={false}
          >
            <SidebarIcon>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>

            </SidebarIcon>
            {getMessage("rateUs")}
          </SidebarItem>
        </Sidebar>

        <ContentArea>
          {/* General Settings */}
          {activeTab === 'general' && (
            <>


              <Section>
                <SectionTitle>{getMessage("dailyUsage")}</SectionTitle>
                {isLoading ? (
                  <div style={{ padding: '16px', background: theme.card, borderRadius: '8px', marginTop: '12px' }}>
                    <span style={{ color: theme.secondaryText, fontSize: '14px' }}>{getMessage("loadingUsageInfo")}</span>
                  </div>
                ) : error ? (
                  <div style={{ padding: '16px', background: theme.card, borderRadius: '8px', marginTop: '12px', borderLeft: '4px solid #E74C3C' }}>
                    <span style={{ color: theme.secondaryText, fontSize: '14px' }}>{error}</span>
                  </div>
                ) : (
                  <div style={{ padding: '16px', background: theme.card, borderRadius: '8px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ color: theme.secondaryText, fontSize: '14px' }}>{getMessage("freeUsesRemaining")}</span>
                      <span style={{ fontWeight: 500, fontSize: '14px' }}>
                        {remainingActions} / {(settings?.rateLimit as any)?.dailyLimit ?? 80}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: theme.button.default, borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, (remainingActions / ((settings?.rateLimit as any)?.dailyLimit ?? 80)) * 100)}%`,
                          height: '100%',
                          backgroundColor: theme.toggle.active,
                          borderRadius: '4px'
                        }}
                      ></div>
                    </div>

                  </div>
                )}
              </Section>
              <SectionDivider />
              <Section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <SectionTitle>{getMessage("modeSelection")}</SectionTitle>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      onClick={() => setActiveModeConfig(!activeModeConfig)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '12px',
                        padding: '8px 14px',
                        border: `1px solid ${theme.border}`,
                        background: activeModeConfig ? theme.card : 'transparent',
                        color: theme.foreground,
                        fontWeight: 500,
                        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      aria-label={activeModeConfig ? getMessage("hideModeConfig") : getMessage("configureModes")}
                    >
                      {activeModeConfig ? getMessage("hideModeConfigShort") : getMessage("configureModes")}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6v12m-6-6h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          transform={activeModeConfig ? "rotate(45, 12, 12)" : ""} />
                      </svg>
                    </Button>
                    <Button
                      onClick={() => {
                        if (typeof chrome !== 'undefined' && chrome.runtime) {
                          chrome.runtime.openOptionsPage();
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '12px',
                        padding: '8px 14px',
                        border: `1px solid ${theme.border}`,
                        background: 'transparent',
                        color: theme.foreground,
                        fontWeight: 500,
                        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      aria-label={getMessage("goToPrompts")}
                    >
                      {getMessage("goToPrompts")}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6v12m-6-6h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Button>
                  </div>
                </div>

                {activeModeConfig ? (
                  <div style={{ marginBottom: '20px', padding: '16px', background: theme.card, borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '12px', color: theme.foreground }}>{getMessage("configureModeSelector")}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      {allModes.map((mode) => (
                        <Button
                          key={mode}
                          variant={preferredModes.includes(mode) ? 'primary' : 'default'}
                          onClick={() => togglePreferredMode(mode)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px' }}
                        >
                          {preferredModes.includes(mode) && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {modeIcons[mode as keyof typeof modeIcons]}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                            {mode === 'translate' && (
                              <span style={{ fontSize: '10px', opacity: 0.8 }}>
                                {settings?.translationSettings?.fromLanguage ?
                                  `${LANGUAGES[settings.translationSettings.fromLanguage] || LANGUAGES['auto']} → ${LANGUAGES[settings.translationSettings.toLanguage] || LANGUAGES['en']}` :
                                  getMessage("autoTranslate")}
                              </span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                    <p style={{ fontSize: '14px', color: theme.secondaryText }}>{getMessage("modeSelectorHelp")}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {preferredModes.map((mode) => (
                      <Button
                        key={mode}
                        variant={activeMode === mode ? 'primary' : 'default'}
                        onClick={() => handleModeChange(mode)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px' }}
                      >
                        {modeIcons[mode as keyof typeof modeIcons]}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                          {mode === 'translate' && (
                            <span style={{ fontSize: '10px', opacity: 0.8 }}>
                              {settings?.translationSettings?.fromLanguage ?
                                `${LANGUAGES[settings.translationSettings.fromLanguage] || LANGUAGES['auto']} → ${LANGUAGES[settings.translationSettings.toLanguage] || LANGUAGES['en']}` :
                                'Auto → English'}
                            </span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </Section>

              <SectionDivider />

              <Section>
                {/* <SectionTitle>General Settings</SectionTitle>
                <Description>Configure the basic settings for your extension</Description> */}
                <FormRow>
                  <div style={{ flex: '0 0 auto' }}>
                    <Label>{getMessage("translationSettings")}</Label>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    <Select
                      value={settings?.translationSettings?.fromLanguage}
                      onChange={async (e) => {
                        const translationSettings = {
                          ...(settings?.translationSettings || {}),
                          fromLanguage: e.target.value,
                          toLanguage: settings?.translationSettings?.toLanguage
                        }
                        const newSettings = {
                          ...settings,
                          translationSettings
                        }

                        console.log('Translation settings updated:', translationSettings)

                        // Update local state immediately for instant UI feedback
                        setSettings(newSettings)

                        const storage = new Storage()
                        await storage.set("settings", newSettings)

                        // Also save dedicated translationSettings
                        await storage.set("translationSettings", translationSettings)

                        // Notify all tabs about the translation settings change
                        if (typeof chrome !== 'undefined' && chrome.tabs) {
                          chrome.tabs.query({}, (tabs) => {
                            tabs.forEach(tab => {
                              if (tab.id) {
                                chrome.tabs.sendMessage(tab.id, {
                                  type: "TRANSLATION_SETTINGS_UPDATED",
                                  translationSettings: translationSettings
                                }).catch(err => {
                                  // Ignore errors for tabs that don't have the content script running
                                  console.log(`Could not send message to tab ${tab.id}:`, err);
                                });
                              }
                            });
                          });
                        }

                        // Dispatch event for other components in the same window
                        window.dispatchEvent(
                          new CustomEvent('settingsUpdated', { detail: { settings: newSettings } })
                        )
                      }}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.nativeName} ({lang.name})</option>
                      ))}
                    </Select>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '0 4px', flex: '0 0 auto' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    <Select
                      value={settings?.translationSettings?.toLanguage}
                      onChange={async (e) => {
                        const translationSettings = {
                          ...(settings?.translationSettings || {}),
                          fromLanguage: settings?.translationSettings?.fromLanguage,
                          toLanguage: e.target.value
                        }
                        const newSettings = {
                          ...settings,
                          translationSettings
                        }

                        console.log('Translation settings updated (toLanguage):', translationSettings)

                        // Update local state immediately for instant UI feedback
                        setSettings(newSettings)

                        const storage = new Storage()
                        await storage.set("settings", newSettings)

                        // Also save dedicated translationSettings
                        await storage.set("translationSettings", translationSettings)

                        // Notify all tabs about the translation settings change
                        if (typeof chrome !== 'undefined' && chrome.tabs) {
                          chrome.tabs.query({}, (tabs) => {
                            tabs.forEach(tab => {
                              if (tab.id) {
                                chrome.tabs.sendMessage(tab.id, {
                                  type: "TRANSLATION_SETTINGS_UPDATED",
                                  translationSettings: translationSettings
                                }).catch(err => {
                                  // Ignore errors for tabs that don't have the content script running
                                  console.log(`Could not send message to tab ${tab.id}:`, err);
                                });
                              }
                            });
                          });
                        }

                        // Dispatch event for other components in the same window
                        window.dispatchEvent(
                          new CustomEvent('settingsUpdated', { detail: { settings: newSettings } })
                        )
                      }}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      {SUPPORTED_LANGUAGES.filter((lang) => lang.code !== 'auto').map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.nativeName} ({lang.name})</option>
                      ))}
                    </Select>
                  </div>
                </FormRow>

                <SectionDivider />

                {/* Layout & Display directly after Translation Settings */}
                <LayoutDisplaySection />

                <SectionDivider />

                <FormRow>
                  <div>
                    <Label>{getMessage("pageContextLabel")}</Label>
                    <Description>{getMessage("pageContextDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings?.customization?.contextAwareness === true}
                      onChange={(e) => updateSettings('contextAwareness', e.target.checked)}
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>


                <SectionDivider />

                <FormRow>
                  <div>
                    <Label>{getMessage("showWebsiteInfoLabel")}</Label>
                    <Description>{getMessage("showWebsiteInfoDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings?.customization?.showWebsiteInfo !== false}
                      onChange={(e) => updateSettings('showWebsiteInfo', e.target.checked)}
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>

                <SectionDivider />
                <FormRow>
                  <div>
                    <Label>{getMessage("showSelectedTextLabel")}</Label>
                    <Description>{getMessage("showSelectedTextDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings?.customization?.showSelectedText !== false}
                      onChange={(e) => updateSettings('showSelectedText', e.target.checked)}
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>
                <SectionDivider />

                <FormRow>
                  <div>
                    <Label>{getMessage("showInstantAIButtonLabel")}</Label>
                    <Description>{getMessage("showInstantAIButtonDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings?.customization?.showGlobalActionButton !== false}
                      onChange={(e) => updateSettings('showGlobalActionButton', e.target.checked)}
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>

                <SectionDivider />

                <FormRow>
                  <div>
                    <Label>{getMessage("distractionFreeModeLabel")}</Label>
                    <Description>{getMessage("distractionFreeModeDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings?.customization?.radicallyFocus === true}
                      onChange={(e) => updateSettings('radicallyFocus', e.target.checked)}
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>

                <SectionDivider />

                <FormRow>
                  <div>
                    <Label>{getMessage("keepHighlightedTextLabel")}</Label>
                    <Description>{getMessage("keepHighlightedTextDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings?.customization?.persistHighlight === true}
                      onChange={(e) => updateSettings('persistHighlight', e.target.checked)}
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>

                <SectionDivider />

                <FormRow>
                  <div>
                    <Label>{getMessage("showActionButtonLabel")}</Label>
                    <Description>{getMessage("showActionButtonDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings?.customization?.showTextSelectionButton !== false}
                      onChange={(e) => updateSettings('showTextSelectionButton', e.target.checked)}
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>

                <SectionDivider />

                <FormRow>
                  <div>
                    <Label>{getMessage("autoOpenLabel")}</Label>
                    <Description>{getMessage("autoOpenDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings?.customization?.automaticActivation === true}
                      onChange={(e) => {
                        // Update both settings to ensure consistency with options page
                        const newValue = e.target.checked;
                        updateMultipleSettings({
                          'automaticActivation': newValue,
                          'activationMode': newValue ? "automatic" : "manual"
                        });
                      }}
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>



              </Section>


            </>
          )}

          {/* Keyboard Shortcuts */}
          {activeTab === 'keyboard' && (
            <>
              <Section>
                <SectionTitle>{getMessage("keyboardShortcuts")}</SectionTitle>
                <Description>{getMessage("keyboardShortcutsDesc")}</Description>

                <div style={{ background: theme.card, borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      {/* <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>Mode Switching</h3>
                      <Button variant="default" style={{ padding: '6px 10px', borderRadius: '16px', fontSize: '14px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Customize
                      </Button> */}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    {[
                      { key: "Ctrl+Shift+Z", description: getMessage("shortcutExplainMode") },
                      { key: "Ctrl+Shift+S", description: getMessage("shortcutSummarizeMode") },
                      { key: "Ctrl+Shift+A", description: getMessage("shortcutAnalyzeMode") },
                      { key: "Ctrl+Shift+T", description: getMessage("shortcutTranslateMode") },
                      { key: "Ctrl+Shift+F", description: getMessage("shortcutFreeMode") }
                    ].map((shortcut, index) => (
                      <div key={index} className="shortcut-row" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: index === 4 ? 'none' : `1px solid ${theme.divider}`,
                      }}>
                        <span style={{ fontSize: '15px', color: theme.secondaryText }}>{shortcut.description}</span>
                        <div style={{
                          padding: '5px 10px',
                          backgroundColor: theme.button.default,
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          color: theme.foreground,
                          border: `1px solid ${theme.border}`
                        }}>
                          {shortcut.key}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>

              <SectionDivider />

              <Section>
                <SectionTitle>{getMessage("featureToggles")}</SectionTitle>
                <Description>{getMessage("featureTogglesDesc")}</Description>

                <div style={{ background: theme.card, borderRadius: '8px', padding: '16px', marginTop: '16px' }}>
                  {[
                    { key: "Ctrl+Shift+X", description: getMessage("shortcutToggleOnOff") },
                    { key: "Ctrl+Shift+R", description: getMessage("shortcutToggleFocus") },
                    { key: "Ctrl+Shift+D", description: getMessage("shortcutToggleTheme") }
                  ].map((shortcut, index) => (
                    <div key={index} className="shortcut-row" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: index === 2 ? 'none' : `1px solid ${theme.divider}`,
                    }}>
                      <span style={{ fontSize: '15px', color: theme.secondaryText }}>{shortcut.description}</span>
                      <div style={{
                        padding: '5px 10px',
                        backgroundColor: theme.button.default,
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        color: theme.foreground,
                        border: `1px solid ${theme.border}`
                      }}>
                        {shortcut.key}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <SectionDivider />

              <Section>
                <Description style={{ marginTop: '8px' }}>
                  {getMessage("shortcutAfterSettingDesc")}
                </Description>
                <FormRow style={{ marginTop: '20px' }}>
                  <div>
                    <Label>{getMessage("resetAllShortcutsLabel")}</Label>
                    <Description>{getMessage("resetAllShortcutsDesc")}</Description>
                  </div>
                  <Button variant="destructive">{getMessage("resetButton")}</Button>
                </FormRow>
              </Section>
            </>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <>
              {/* Reuse ThemeSection in the Appearance tab */}
              <ThemeSection />

              <SectionDivider />

              <Section>
                <SectionTitle>{getMessage("highlightColorTitle")}</SectionTitle>
                <Description>{getMessage("highlightColorDesc")}</Description>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                  {[
                    { value: 'default', label: getMessage("colorDefault"), color: 'linear-gradient(45deg, rgb(211, 232, 255), rgb(197, 225, 255))' },
                    { value: 'yellow', label: getMessage("colorYellow"), color: '#fff8bc' },
                    { value: 'orange', label: getMessage("colorOrange"), color: '#FFBF5A' },
                    { value: 'blue', label: getMessage("colorBlue"), color: '#93C5FD' },
                    { value: 'green', label: getMessage("colorGreen"), color: '#86EFAC' },
                    { value: 'purple', label: getMessage("colorPurple"), color: '#C4B5FD' },
                    { value: 'pink', label: getMessage("colorPink"), color: '#FDA4AF' }
                  ].map(colorOption => (
                    <div
                      key={colorOption.value}
                      style={{
                        width: '75px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div
                        onClick={() => updateSettings('highlightColor', colorOption.value)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: colorOption.color,
                          backgroundColor: colorOption.value === 'default' ? undefined : colorOption.color,
                          border: colorOption.value === (settings?.customization?.highlightColor) ? `2px solid ${theme.primary}` : '2px solid transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        {colorOption.value === (settings?.customization?.highlightColor) && (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 13l4 4L19 7" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: theme.secondaryText }}>{colorOption.label}</span>
                    </div>
                  ))}
                </div>
              </Section>

              <SectionDivider />

              {/* Layout & Display options are also available in the Appearance tab */}
              <LayoutDisplaySection />

              <SectionDivider />

              <FormRow>
                <div>
                  <Label>{getMessage("radicalFocusLabel")}</Label>
                  <Description>{getMessage("radicalFocusDesc")}</Description>
                </div>
                <ToggleContainer>
                  <ToggleInput
                    type="checkbox"
                    checked={settings?.customization?.radicallyFocus === true}
                    onChange={(e) => updateSettings('radicallyFocus', e.target.checked)}
                    aria-label={getMessage("radicalFocusLabel")}
                  />
                  <ToggleSlider />
                </ToggleContainer>
              </FormRow>

              <SectionDivider />

              <FormRow>
                <div>
                  <Label>{getMessage("persistentHighlightingLabel")}</Label>
                  <Description>{getMessage("keepHighlightedTextDesc")}</Description>
                </div>
                <ToggleContainer>
                  <ToggleInput
                    type="checkbox"
                    checked={settings?.customization?.persistHighlight === true}
                    onChange={(e) => updateSettings('persistHighlight', e.target.checked)}
                    aria-label={getMessage("persistentHighlightingLabel")}
                  />
                  <ToggleSlider />
                </ToggleContainer>
              </FormRow>

              <SectionDivider />
            </>
          )}

          {/* Language */}
          {activeTab === 'language' && (
            <Section>
              <SectionTitle>{getMessage("languageLabel")}</SectionTitle>
              <Description>{getMessage("languageDesc")}</Description>

              <div style={{ marginTop: '20px', maxWidth: '420px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: theme.card,
                    border: `1px solid ${theme.border}`,
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Globe size={20} color="currentColor" />
                    <span style={{ fontSize: '14px', color: theme.foreground }}>
                      {getMessage("languageLabel")}
                    </span>
                  </div>
                  <div style={{ width: '200px' }}>
                    <LanguageSelector
                      onChange={(newLocale) => {
                        // Change the locale using the useLocale hook
                        changeLocale(newLocale).then(() => {
                          notifySuccess(getMessage('languageChanged'));
                        }).catch(error => {
                          console.error('Error changing locale:', error);
                          notifyError(getMessage('languageChangeError'));
                        });
                      }}
                      compact={true}
                    />
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Feedback */}
          {activeTab === 'feedback' && (
            <Section>
              <SectionTitle>{getMessage("feedbackTitle")}</SectionTitle>
              <Description>{getMessage("feedbackDesc")}</Description>

              {/* Feedback Type Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                marginTop: '20px',
                marginBottom: '20px'
              }}>
                {[
                  {
                    value: 'general',
                    label: getMessage("feedbackTypeGeneral", undefined, "General"),
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    ),
                    color: '#3B82F6'
                  },
                  {
                    value: 'bug',
                    label: getMessage("feedbackTypeBug", undefined, "Bug Report"),
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ),
                    color: '#EF4444'
                  },
                  {
                    value: 'feature',
                    label: getMessage("feedbackTypeFeature", undefined, "Feature"),
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ),
                    color: '#F59E0B'
                  },
                  {
                    value: 'other',
                    label: getMessage("feedbackTypeOther", undefined, "Other"),
                    icon: (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    ),
                    color: '#8B5CF6'
                  }
                ].map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setFeedbackType(type.value as "general" | "bug" | "feature" | "other")}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setFeedbackType(type.value as "general" | "bug" | "feature" | "other")
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${type.label} feedback type`}
                    aria-pressed={feedbackType === type.value}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '14px 8px',
                      background: feedbackType === type.value ? `${type.color}15` : theme.card,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: feedbackType === type.value ? `2px solid ${type.color}` : '2px solid transparent',
                      transition: 'all 0.2s ease',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      if (feedbackType !== type.value) {
                        e.currentTarget.style.background = theme.cardHover
                        e.currentTarget.style.borderColor = theme.divider
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (feedbackType !== type.value) {
                        e.currentTarget.style.background = theme.card
                        e.currentTarget.style.borderColor = 'transparent'
                      }
                    }}
                  >
                    <div style={{ color: feedbackType === type.value ? type.color : theme.secondaryText }}>
                      {type.icon}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: feedbackType === type.value ? type.color : theme.foreground,
                      textAlign: 'center'
                    }}>
                      {type.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Feedback Form Card */}
              <div style={{ background: theme.card, borderRadius: '12px', padding: '20px' }}>
                {/* Contextual hint based on feedback type */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  background: theme.button.default,
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.secondaryText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span style={{ fontSize: '13px', color: theme.secondaryText }}>
                    {feedbackType === 'bug' && "Please describe what happened, what you expected, and steps to reproduce."}
                    {feedbackType === 'feature' && "Describe the feature you'd like and how it would help your workflow."}
                    {feedbackType === 'general' && "Share your thoughts, suggestions, or general experience with LightUp."}
                    {feedbackType === 'other' && "Tell us anything else on your mind about LightUp."}
                  </span>
                </div>

                <FormGroup>
                  <Label htmlFor="feedback-content" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{getMessage("feedbackContentLabel")}</span>
                  </Label>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      id="feedback-content"
                      placeholder={
                        feedbackType === 'bug'
                          ? "I encountered an issue when...\n\nExpected behavior:\nActual behavior:\nSteps to reproduce:"
                          : feedbackType === 'feature'
                            ? "I would love to see...\n\nThis would help me because..."
                            : getMessage("feedbackContentPlaceholder")
                      }
                      value={feedbackContent}
                      onChange={(event) => setFeedbackContent(event.target.value)}
                      maxLength={2000}
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        backgroundColor: theme.background,
                        color: theme.foreground,
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        padding: '12px',
                        paddingBottom: '28px',
                        minHeight: '140px',
                        fontSize: '14px',
                        resize: 'vertical',
                        lineHeight: '1.5',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '12px',
                      fontSize: '11px',
                      color: feedbackContent.length > 1800 ? '#EF4444' : theme.secondaryText
                    }}>
                      {feedbackContent.length}/2000
                    </span>
                  </div>
                </FormGroup>

                <FormGroup style={{ marginTop: '16px' }}>
                  <Label htmlFor="feedback-email" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getMessage("feedbackEmailLabel")}
                    <span style={{ fontSize: '11px', color: theme.secondaryText, fontWeight: 400 }}>(optional)</span>
                  </Label>
                  <Description style={{ marginBottom: '8px', fontSize: '13px' }}>{getMessage("feedbackEmailDesc")}</Description>
                  <Input
                    id="feedback-email"
                    type="email"
                    placeholder={getMessage("feedbackEmailPlaceholder")}
                    value={feedbackEmail}
                    onChange={(event) => setFeedbackEmail(event.target.value)}
                    style={{ backgroundColor: theme.background, width: '100%', boxSizing: 'border-box' }}
                  />
                </FormGroup>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <span style={{ fontSize: '12px', color: theme.secondaryText }}>
                    Opens your email client
                  </span>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={handleFeedbackSubmit}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {getMessage("feedbackSubmit")}
                  </Button>
                </div>
              </div>

              {/* Direct contact option */}
              <div style={{
                marginTop: '16px',
                padding: '14px 16px',
                background: theme.button.default,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: `1px solid ${theme.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.secondaryText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span style={{ fontSize: '13px', color: theme.secondaryText }}>
                    Or email us directly at
                  </span>
                </div>
                <a
                  href="mailto:boimaginations@gmail.com"
                  style={{
                    fontSize: '13px',
                    color: theme.primary,
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  boimaginations@gmail.com
                </a>
              </div>
            </Section>
          )}

          {/* Privacy Policy */}
          {activeTab === 'privacy' && (
            <Section>
              <SectionTitle>{getMessage("privacyTitle")}</SectionTitle>
              <Description>{getMessage("privacyDesc")}</Description>

              <div style={{ background: theme.card, borderRadius: '8px', padding: '20px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" strokeWidth="1.5" stroke="currentColor" style={{ marginRight: '12px', color: '#2DCA6E' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: theme.foreground }}>{getMessage("zeroDataCollection")}</h3>
                </div>

                <div style={{ fontSize: '14px', color: theme.secondaryText, lineHeight: '1.6', marginBottom: '24px' }}>
                  <p style={{ margin: '0 0 16px 0' }}>
                    {getMessage("privacyMainText")}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', background: 'rgba(45, 202, 110, 0.1)', borderRadius: '8px', border: '1px solid rgba(45, 202, 110, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', color: '#2DCA6E' }}>
                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontWeight: 500, color: theme.foreground, fontSize: '14px' }}>{getMessage("localStorage")}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: theme.secondaryText }}>
                      {getMessage("localStorageDesc")}
                    </p>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(0, 120, 212, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 120, 212, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', color: '#0078D4' }}>
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontWeight: 500, color: theme.foreground, fontSize: '14px' }}>{getMessage("directProcessing")}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: theme.secondaryText }}>
                      {getMessage("directProcessingDesc")}
                    </p>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(156, 39, 176, 0.1)', borderRadius: '8px', border: '1px solid rgba(156, 39, 176, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', color: '#9C27B0' }}>
                        <path d="M18.364 5.636L16.95 7.05A7 7 0 1019 12h2a9 9 0 11-2.636-6.364z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontWeight: 500, color: theme.foreground, fontSize: '14px' }}>{getMessage("noTracking")}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: theme.secondaryText }}>
                      {getMessage("noTrackingDesc")}
                    </p>
                  </div>

                  <div style={{ padding: '16px', background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', color: '#FFC107' }}>
                        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                      <span style={{ fontWeight: 500, color: theme.foreground, fontSize: '14px' }}>{getMessage("yourControl")}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: theme.secondaryText }}>
                      {getMessage("yourControlDesc")}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <Button
                    variant="primary"
                    onClick={() => window.open('https://www.boimaginations.com/lightup/privacy-policy', '_blank')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6m4-3h6v6m-11 5L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getMessage("fullPolicy")}
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => window.open('mailto:boimaginations@gmail.com?subject=Privacy Inquiry - LightUp', '_blank')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getMessage("contact")}
                  </Button>
                </div>
              </div>
            </Section>
          )}


          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <Section>
              <SectionTitle>{getMessage("advancedSettingsTitle")}</SectionTitle>
              <Description>{getMessage("advancedSettingsDesc")}</Description>

              <div style={{ background: theme.card, borderRadius: '8px', padding: '20px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>{getMessage("apiConfigTitle")}</h3>

                <FormGroup>
                  <Label htmlFor="api-key" style={{ marginBottom: '8px' }}>{getMessage("apiKeyLabel")}</Label>
                  <Description style={{ marginBottom: '8px' }}>{getMessage("apiKeyDesc")}</Description>
                  <Input id="api-key" type="password" placeholder={getMessage("apiKeyPlaceholder")} />
                </FormGroup>

                <FormGroup style={{ marginTop: '16px' }}>
                  <Label htmlFor="api-endpoint" style={{ marginBottom: '8px' }}>{getMessage("apiEndpointLabel")}</Label>
                  <Description style={{ marginBottom: '8px' }}>{getMessage("apiEndpointDesc")}</Description>
                  <Input id="api-endpoint" type="text" placeholder={getMessage("apiEndpointPlaceholder")} />
                </FormGroup>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <Button variant="primary">{getMessage("saveApiSettings")}</Button>
                </div>
              </div>

              <SectionDivider />

              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>{getMessage("advancedOptionsTitle")}</h3>

                <FormRow>
                  <div>
                    <Label>{getMessage("pageContextLabel")}</Label>
                    <Description>{getMessage("pageContextDesc")}</Description>
                  </div>
                  <ToggleContainer>
                    <ToggleInput type="checkbox" />
                    <ToggleSlider />
                  </ToggleContainer>
                </FormRow>

                <SectionDivider />

                <FormRow>
                  <div>
                    <Label>{getMessage("maxCharsLabel")}</Label>
                    <Description>{getMessage("maxCharsDesc")}</Description>
                  </div>
                  <Select defaultValue="4000" style={{ width: '120px' }}>
                    <option value="2000">{getMessage("chars2000")}</option>
                    <option value="4000">{getMessage("chars4000")}</option>
                    <option value="8000">{getMessage("chars8000")}</option>
                    <option value="16000">{getMessage("chars16000")}</option>
                  </Select>
                </FormRow>

                <SectionDivider />

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <Button variant="primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getMessage("promptTemplates")}
                  </Button>
                  <Button variant="default" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getMessage("exportSettings")}
                  </Button>
                </div>
              </div>
            </Section>
          )}
        </ContentArea>
      </ContentWrapper>
    </PopupContainer>
  )
}

// Error boundary wrapper from original file
const PopupWithErrorBoundary = () => {
  return <IndexPopup />
}

export default PopupWithErrorBoundary
