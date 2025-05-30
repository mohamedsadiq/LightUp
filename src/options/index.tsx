import { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
// Animation imports removed
import styled from "@emotion/styled"
import { css } from "@emotion/react"

import type { Settings, ModelType, GeminiModel, GrokModel, LocalModel, Mode } from "~types/settings"
import { useRateLimit } from "~hooks/useRateLimit"
import ErrorMessage from "~components/common/ErrorMessage"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../utils/constants"
import { useSettings } from "~hooks/useSettings"

// Import the options-specific CSS file for fonts only
import "./options-style.css"

import logoUrl from '../../assets/lightup.png';

const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  {
    value: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Latest version with improved capabilities and faster response times"
  },
  {
    value: "gemini-2.0-flash-lite-preview-02-05",
    label: "Gemini 2.0 Flash-Lite",
    description: "Lightweight version optimized for efficiency and speed"
  },
  {
    value: "gemini-2.0-flash-thinking-exp-01-21",
    label: "Gemini 2.0 Flash Thinking",
    description: "Experimental model focused on reasoning and analytical tasks"
  },
  {
    value: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    description: "Stable version with balanced performance"
  },
  {
    value: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    description: "Faster, smaller model for quick responses"
  },
  {
    value: "gemini-1.5-flash-8b",
    label: "Gemini 1.5 Flash-8B",
    description: "8-bit quantized version for efficient processing"
  }
];

const GROK_MODELS: { value: GrokModel; label: string; description: string; price: string }[] = [
  {
    value: "grok-2",
    label: "Grok 2",
    description: "Standard text model with balanced performance",
    price: "$2.00 per 1M tokens"
  },
  {
    value: "grok-2-latest",
    label: "Grok 2 Latest",
    description: "Latest version with improved capabilities",
    price: "$2.00 per 1M tokens"
  },
  {
    value: "grok-beta",
    label: "Grok Beta",
    description: "Beta version with experimental features",
    price: "$5.00 per 1M tokens"
  }
];

const LOCAL_MODELS: { value: LocalModel; label: string; description: string; size: string }[] = [
  {
    value: "llama-2-70b-chat",
    label: "Llama 2 70B Chat",
    description: "Most powerful Llama 2 model, best for complex tasks",
    size: "70B parameters"
  },
  {
    value: "deepseek-v3",
    label: "DeepSeek V3",
    description: "Latest DeepSeek model with enhanced reasoning capabilities",
    size: "67B parameters"
  },
  {
    value: "mixtral-8x7b-instruct",
    label: "Mixtral 8x7B Instruct",
    description: "High-performance mixture of experts model",
    size: "47B parameters"
  },
  {
    value: "llama-2-13b-chat",
    label: "Llama 2 13B Chat",
    description: "Balanced performance and resource usage",
    size: "13B parameters"
  },
  {
    value: "mistral-7b-instruct",
    label: "Mistral 7B Instruct",
    description: "Efficient instruction-following model",
    size: "7B parameters"
  },
  {
    value: "neural-chat-7b-v3-1",
    label: "Neural Chat V3.1",
    description: "Optimized for natural conversations",
    size: "7B parameters"
  },
  {
    value: "deepseek-v3-base",
    label: "DeepSeek V3 Base",
    description: "Lighter version of DeepSeek with good reasoning",
    size: "7B parameters"
  },
  {
    value: "llama-3.2-3b-instruct",
    label: "Llama 3.2 3B Instruct",
    description: "Lightweight model for basic tasks",
    size: "3B parameters"
  },
  {
    value: "phi-2",
    label: "Phi-2",
    description: "Compact but powerful for its size",
    size: "2.7B parameters"
  },
  {
    value: "openchat-3.5",
    label: "OpenChat 3.5",
    description: "Optimized for chat interactions",
    size: "7B parameters"
  }
];

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('Address copied to clipboard!');
  }, (err) => {
    console.error('Could not copy text: ', err);
  });
};

// Animation variants removed

// Form row - matching popup page screenshot exactly
const FormRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  min-height: 48px;
`

// Label and description - matching popup screenshot exactly
const Label = styled.label`
  font-size: 16px;
  font-weight: 500;
  color: #FFFFFF;
  display: block;
`

const Description = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 4px 0 0 0;
  line-height: 1.4;
  // margin-bottom: 10px;
`

// Toggle components - matching green toggles from the popup screenshot
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
    background-color: #2DCA6E; /* theme.dark.toggle.active */
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
  background-color: #4d4d4d; /* theme.dark.toggle.track */
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

// Toggle switch component using styled components - exactly matching popup component
const Switch = ({ id, checked, onChange, label, description = undefined }) => (
  <FormRow>
    <div>
      <Label htmlFor={id}>{label}</Label>
      {description && <Description>{description}</Description>}
    </div>
    <ToggleContainer>
      <ToggleInput
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        aria-checked={checked}
      />
      <ToggleSlider />
    </ToggleContainer>
  </FormRow>
);

const RateLimitDisplay = ({ rateLimitRemaining, rateLimitReset }) => {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="lu-flex lu-items-center lu-justify-between lu-text-xs lu-text-gray-500 lu-mt-2">
      <span>Rate Limit Remaining: {rateLimitRemaining}</span>
      <span>Reset in: {formatTime(rateLimitReset)}</span>
    </div>
  );
};

// Styled components for the SettingsCard
const CardContainer = styled.div`
  // background-color: #333333;
  border-radius: 10px;
  padding: 0 24px;
  margin-bottom: 24px;
  // border: 1px solid #3A3A3A;
  transition: all 0.2s ease;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const CardIcon = styled.div`
  margin-right: 12px;
  color: #9CA3AF;
`;

const CardTitle = styled.h3`
  font-size: 21px;
  font-weight: 600;
  color: #FFFFFF;
`;

// SettingsCard component using styled components
const SettingsCard = ({ id = undefined, title, icon, children, className = "" }) => (
  <CardContainer id={id} className={className}>
    <CardHeader>
      {icon && <CardIcon>{icon}</CardIcon>}
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    {children}
  </CardContainer>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const baseStyle = "lu-inline-flex lu-items-center lu-px-2.5 lu-py-0.5 lu-rounded-full lu-text-xs lu-font-medium";
  const variantStyle = {
    default: "lu-bg-gray-100 lu-text-gray-800",
    success: "lu-bg-green-100 lu-text-green-800",
    warning: "lu-bg-yellow-100 lu-text-yellow-800",
    danger: "lu-bg-red-100 lu-text-red-800",
    info: "lu-bg-blue-100 lu-text-blue-800",
  }[variant];

  return (
    <span className={`${baseStyle} ${variantStyle} ${className}`}>
      {children}
    </span>
  );
};

// Styled components for ModelOption
const ModelOptionLabel = styled.label`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: #2D2D2D;
  border: 1px solid transparent;
  
  &:hover {
    background-color: #3D3D3D;
    border-color: #444444;
  }
`;

const ModelRadioInput = styled.input`
  height: 16px;
  width: 16px;
  color: #0078D4;
  transition: all 0.2s ease-in-out;
  background-color: #444444;
  border: 1px solid #555555;
  
  &:focus {
    box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.3);
  }
`;

const ModelContentContainer = styled.div`
  margin-left: 12px;
`;

const ModelTitle = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: #FFFFFF;
`;

const ModelDescription = styled.p`
  font-size: 12px;
  color: #9CA3AF;
`;

const ModelMetadata = styled.p`
  font-size: 12px;
  color: #93C5FD;
  font-weight: 500;
  margin-top: 4px;
`;

// ModelOption component using styled components
const ModelOption = ({ model, selected, onChange, showPrice = false, showSize = false }) => (
  <ModelOptionLabel>
    <ModelRadioInput
      type="radio"
      name="model"
      value={model.value}
      checked={selected}
      onChange={onChange}
    />
    <ModelContentContainer>
      <ModelTitle>{model.label}</ModelTitle>
      <ModelDescription>{model.description}</ModelDescription>
      {showPrice && model.price && (
        <ModelMetadata>Price: {model.price}</ModelMetadata>
      )}
      {showSize && model.size && (
        <ModelMetadata>Size: {model.size}</ModelMetadata>
      )}
    </ModelContentContainer>
  </ModelOptionLabel>
);

// Define theme colors to exactly match the reference image
const theme = {
  dark: {
    background: "#2A2A2A",       // Main popup background
    foreground: "#FFFFFF",      // Text color
    sidebar: "#2A2A2A",         // Sidebar background (darker than before)
    sidebarActive: "#2D2D2D",   // Active sidebar item
    content: "#2A2A2A",         // Content area background
    border: "#3A3A3A",          // Border color
    primary: "#0078D4",         // Primary button color
    destructive: "#E74C3C",     // Destructive button color (delete)
    divider: "#9d9d9d",         // Divider line color
    button: {
      default: "#444444",       // Default button background (gray buttons in reference)
      text: "#FFFFFF"           // Button text color
    },
    toggle: {
      active: "#2DCA6E",        // Active toggle switch (green color in reference)
      inactive: "#6B6B6B",      // Inactive toggle
      track: "#333333"          // Toggle track
    },
    card: "#333333"            // Card background color
  }
}

// Styled components for form elements - Exactly matching popup component
const FormGroup = styled.div`
  margin-bottom: 18px;
`

const FormLabel = styled.label`
  display: block;
  font-size: 16px;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 8px;
`

const FormDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 4px 0 0 0;
  line-height: 1.4;
  margin-bottom: 10px;
`

const FormSelect = styled.select`
  background-color: rgba(0, 0, 0, 0.2);
  color: #FFFFFF;
  padding: 8px 30px 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 15px;
  min-width: 180px;
  appearance: none;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>');
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #2DCA6E;
    box-shadow: 0 0 0 1px rgba(45, 202, 110, 0.2);
  }
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }
`

const FormInput = styled.input`
  background-color: #2A2A2A;
  color: #FFFFFF;
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid #3A3A3A;
  font-size: 16px;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #0078D4;
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const FormTextarea = styled.textarea`
  background-color: ${theme.dark.background};
  color: ${theme.dark.foreground};
  color: #FFFFFF;
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid #3A3A3A;
  font-size: 16px;
  width: 100%;
  resize: vertical;
  min-height: 120px;
  font-family: 'Roboto', sans-serif;
  line-height: 1.5;
  
  &:focus {
    outline: none;
    border-color: #0078D4;
  }
`

const SectionHeader = styled.h4`
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 14px 0;
  color: #FFFFFF;
  padding-bottom: 8px;
  // border-bottom: 1px solid rgba(157, 157, 157, 0.3);
`

const SectionContainer = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`

const Button = styled.button<{ variant?: 'primary' | 'destructive' | 'default' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 30px; /* More rounded buttons to match popup */
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  
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
`

const SubContainer = styled.div`
  background-color: #2D2D2D;
  border-radius: 8px;
  padding: 18px;
  border: 1px solid #444444;
  margin-bottom: 16px;
  // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const StyledPromptDisplay = styled.div`
  margin-top: 10px;
  padding: 14px;
  background-color: #2D2D2D;
  border: 1px solid #444444;
  border-radius: 8px;
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  color: #BDC3CF;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: inset 0 1px 5px rgba(0, 0, 0, 0.2);
  line-height: 1.5;
`;

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
const OptionsContainer = styled.div`
  width: 100vw;
  height: 100vh; // Use 100vh to fill the viewport height
  max-height: unset; // Remove max-height constraint
  background: #2A2A2A; // Match popup dark background
  color: #FFFFFF;
  overflow: hidden; // Prevents the whole container from scrolling
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
`

// Header - Matches the popup component exactly
const Header = styled.header`
  ${flexBetween};
  padding: 14px 20px;
  background: #232323;
  border-bottom: 1px solid #3A3A3A;
  height: 80px;
`

const HeaderTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 600; 
  color: white;
  margin: 0; 
  display: flex;
  align-items: center;
`;

const HeaderLogoWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const VersionBadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 12px;
`;

const BetaBadge = styled.span`
  position: relative;
  background: linear-gradient(135deg, rgb(56 56 56) 0%, rgb(33 33 33) 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
`;

const VersionNumber = styled.span`
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  background: rgba(0, 0, 0, 0.2);
  padding: 3px 8px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  color: ${theme.dark.foreground};
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`

// Main content area - Exactly matching popup component
const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  padding:22px 14px 0 14px;
  overflow: hidden; // Prevents the wrapper itself from scrolling
`

// Sidebar - Matching popup component
const Sidebar = styled.nav`
  width: 192px;
  background: #2A2A2A;
  padding: 0;
  flex-shrink: 0; // Prevents sidebar from shrinking
`

const SidebarItem = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.active ? '#ffffff0d' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)'};
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  border-radius: 7px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? '#2D2D2D' : 'rgba(255, 255, 255, 0.05)'};
    color: #FFFFFF;
  }
`

const SidebarIcon = styled.div`
  width: 18px;
  height: 18px;
  margin-right: 10px;
  opacity: 0.9;
  ${flexCenter};
`

// Content area - Exactly matching popup component
const ContentArea = styled.div`
  flex: 1;
  padding: 10px 20px;
  background: #2A2A2A;
  overflow-y: auto; // Enables vertical scrolling
  overflow-x: hidden; // Prevents horizontal scrolling
`

// Section styling - Exactly matching popup component
const Section = styled.section`
  margin-bottom: 20px;
`

const SectionTitle = styled.h2`
  font-size: 17px;
  font-weight: 500;
  margin: 0 0 14px 0;
  color: #FFFFFF;
`

const SectionDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0;
  width: 100%;
`

const ThemeButton = styled.button<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #333333;
  border: 2px solid ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border-radius: 8px;
  padding: 16px;
  min-width: 120px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #3a3a3a;
    border-color: ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.3)'};
  }
  
  div {
    margin-top: 8px;
    font-size: 14px;
    font-weight: 500;
  }
`

const ThemeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
`

const ColorButton = styled.button<{ color: string; selected: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.15)'};
  background-color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  outline: none;
  
  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  svg {
    opacity: ${props => props.selected ? 1 : 0};
    width: 16px;
    height: 16px;
    position: absolute;
    top: 4px;
    right: 4px;
    color: #2DCA6E;
  }
`;

const SaveButton = styled.button<{ success?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  color: white;
  background-color: ${props => props.success ? '#2DCA6E' : props.disabled ? '#555555' : '#0078D4'};
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  &:hover {
    background-color: ${props => props.success ? '#25AE5F' : props.disabled ? '#555555' : '#0069BA'};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const FontSizeButton = styled.button<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #333333;
  border: 2px solid ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #3a3a3a;
    border-color: ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.3)'};
  }
  
  .size-preview {
    font-weight: 500;
    margin-bottom: 6px;
  }
  
  .size-label {
`

const LayoutButton = styled.button<{ selected?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.selected ? 'rgba(45, 202, 110, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.1)'};
  color: ${theme.dark.foreground};
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 150px;
  
  .layout-icon {
    margin-bottom: 8px;
  }
  
  .layout-label {
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const ActionButton = styled.button<{ selected?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.selected ? 'rgba(45, 202, 110, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.1)'};
  color: ${theme.dark.foreground};
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 95px;
  min-height: 95px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: ${props => props.selected ? '#2DCA6E' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const Logo = () => (
  <HeaderLogoWrapper>
    <LogoImage src={logoUrl} alt="LightUp Logo" />
    <HeaderTitle theme={theme.dark}>LightUp</HeaderTitle>
  </HeaderLogoWrapper>
);

function IndexOptions() {
  const storage = useRef(new Storage()).current;
  const [settings, setSettings] = useState<Settings>({
    modelType: "basic",
    maxTokens: 2048,
    apiKey: "",
    geminiApiKey: "",
    xaiApiKey: "",
    grokModel: "grok-2",
    localModel: "llama-2-70b-chat",
    basicModel: "gemini-2.0-flash-lite-preview-02-05",
    customization: {
      showSelectedText: false,
      theme: "light",
      radicallyFocus: false,
      fontSize: "1rem",
      highlightColor: "default",
      popupAnimation: "scale",
      persistHighlight: false,
      layoutMode: "sidebar",
      activationMode: "manual",
      enablePDFSupport: false
    }
  });

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [activePromptMode, setActivePromptMode] = useState<Mode>("explain");
  const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState(false);
  const [isEditingUserPrompt, setIsEditingUserPrompt] = useState(false);
  const [editedSystemPrompt, setEditedSystemPrompt] = useState("");
  const [editedUserPrompt, setEditedUserPrompt] = useState("");

  // Load settings from storage when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await storage.get("settings") as Settings | undefined;
        if (savedSettings) {
          setSettings({
            ...savedSettings,
            customization: {
              showSelectedText: savedSettings.customization?.showSelectedText ?? true,
              theme: savedSettings.customization?.theme ?? "light",
              radicallyFocus: savedSettings.customization?.radicallyFocus ?? false,
              fontSize: savedSettings.customization?.fontSize ?? "medium",
              highlightColor: savedSettings.customization?.highlightColor ?? "default",
              popupAnimation: savedSettings.customization?.popupAnimation ?? "fade",
              persistHighlight: savedSettings.customization?.persistHighlight ?? false,
              layoutMode: savedSettings.customization?.layoutMode ?? "sidebar",
              quickView: savedSettings.customization?.quickView ?? true,
              automaticActivation: savedSettings.customization?.automaticActivation ?? false,
              contextAwareness: savedSettings.customization?.contextAwareness ?? false,
              activationMode: savedSettings.customization?.activationMode ?? "manual",
              enablePDFSupport: savedSettings.customization?.enablePDFSupport ?? false
            }
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings");
      }
    };
    
    loadSettings();
  }, []);

  useEffect(() => {
    // const scrollToElement = (id: string) => {
    //   setTimeout(() => {
    //     const element = document.getElementById(id);
    //     if (element) {
    //       element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //     }
    //   }, 300);
    // };

    // if (window.location.hash) {
    //   const id = window.location.hash.substring(1);
    //   scrollToElement(id);
    // }

    // const handleHashChange = () => {
    //   if (window.location.hash) {
    //     const id = window.location.hash.substring(1);
    //     scrollToElement(id);
    //   }
    // };

    // window.addEventListener('hashchange', handleHashChange);

    // return () => {
    //   window.removeEventListener('hashchange', handleHashChange);
    // };
  }, []);

  // Helper functions from old options page (commented out for now)
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedSettings = {
        ...settings,
        modelType: settings.modelType,
        apiKey: settings.apiKey,
        geminiApiKey: settings.geminiApiKey,
        xaiApiKey: settings.xaiApiKey,
        serverUrl: settings.serverUrl,
        geminiModel: settings.geminiModel,
        grokModel: settings.grokModel,
        localModel: settings.localModel,
        maxTokens: settings.maxTokens,
        preferredModes: settings.preferredModes,
        customPrompts: settings.customPrompts,
        customization: settings.customization
      };
      
      await storage.set("settings", updatedSettings);
      
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { 
                type: "SETTINGS_UPDATED", 
                settings: updatedSettings 
              }).catch(err => {
                console.log(`Could not send message to tab ${tab.id}:`, err);
              });
            }
          });
        });
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings");
      setIsSaving(false);
    }
  };

  const handleServerUrlChange = (e) => {
    let url = e.target.value;
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      url = `http://${url}`;
    }
    setSettings(prev => ({
      ...prev,
      serverUrl: url
    }));
  };

  const colorOptions = [
    { value: 'default', label: 'Default (System)', color: 'lu-bg-[#fff8bc]' },
    { value: 'orange', label: 'Orange', color: 'lu-bg-[#FFBF5A]' },
    { value: 'blue', label: 'Blue', color: 'lu-bg-[#93C5FD]' },
    { value: 'green', label: 'Green', color: 'lu-bg-[#86EFAC]' },
    { value: 'purple', label: 'Purple', color: 'lu-bg-[#C4B5FD]' },
    { value: 'pink', label: 'Pink', color: 'lu-bg-[#FDA4AF]' }
  ];

  const handleImmediateSettingUpdate = async (key: string, value: any) => {
    try {
      const newSettings = {
        ...settings,
        customization: {
          ...settings.customization,
          [key]: value
        }
      };
      
      // Update local state
      setSettings(newSettings);
      
      // Save to storage
      await storage.set("settings", newSettings);
      
      // Dispatch event for other components in the same window
      window.dispatchEvent(
        new CustomEvent('settingsUpdated', { detail: { settings: newSettings } })
      );
      
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
    } catch (error) {
      console.error("Error updating setting:", error);
    }
  };
  
  // Function to update multiple settings at once
  const handleMultipleSettingsUpdate = async (settingsUpdates: Record<string, any>) => {
    try {
      const newSettings = {
        ...settings,
        customization: {
          ...settings.customization,
          ...settingsUpdates
        }
      };
      
      // Update local state
      setSettings(newSettings);
      
      // Save to storage
      await storage.set("settings", newSettings);
      
      // Dispatch event for other components in the same window
      window.dispatchEvent(
        new CustomEvent('settingsUpdated', { detail: { settings: newSettings } })
      );
      
      // Notify all tabs about the settings change for real-time updates
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { 
                type: "SETTINGS_UPDATED", 
                settings: newSettings,
                updatedKeys: Object.keys(settingsUpdates)
              }).catch(err => {
                // Ignore errors for tabs that don't have the content script running
                console.log(`Could not send message to tab ${tab.id}:`, err);
              });
            }
          });
        });
      }
    } catch (error) {
      console.error("Error updating multiple settings:", error);
    }
  };

  const [activeTab, setActiveTab] = useState("general");

  return (
    <OptionsContainer>
      <Header>
        <Logo />
        <VersionBadgeContainer>
          <BetaBadge>BETA</BetaBadge>
          <VersionNumber>v1.1.12</VersionNumber>
        </VersionBadgeContainer>
        {/* <CloseButton onClick={() => window.close()}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </CloseButton> */}
      </Header>
      <ContentWrapper>
        <Sidebar>
          <SidebarItem active={activeTab === "general"} onClick={() => setActiveTab("general")}>
            <SidebarIcon>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
</svg>

            </SidebarIcon>
            General
          </SidebarItem>
          <SidebarItem active={activeTab === "model"} onClick={() => setActiveTab("model")}>
            <SidebarIcon>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
</svg>

            </SidebarIcon>
            Model Settings
          </SidebarItem>
          <SidebarItem active={activeTab === "prompts"} onClick={() => setActiveTab("prompts")}>
            <SidebarIcon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="currentColor"/>
              </svg>
            </SidebarIcon>
            Prompt Templates
          </SidebarItem>
          <SidebarItem active={activeTab === "customization"} onClick={() => setActiveTab("customization")}>
            <SidebarIcon>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
</svg>
            </SidebarIcon>
            Appearance
          </SidebarItem>
          <SidebarItem active={activeTab === "about"} onClick={() => setActiveTab("about")}>
            <SidebarIcon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="currentColor"/>
              </svg>
            </SidebarIcon>
            About
          </SidebarItem>
        </Sidebar>
        <ContentArea>
          {activeTab === "general" && (
            <div key="general">
               <SettingsCard title="General Settings" icon={null}>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '24px' }}>
                   <SectionContainer>
                     {/* <SectionHeader>Display Options</SectionHeader> */}
                     
                     <FormRow>
                       <div>
                         <Label>Show Selected Text</Label>
                         <Description>Display the selected text in the popup for context</Description>
                       </div>
                       <ToggleContainer>
                         <ToggleInput 
                           type="checkbox" 
                           checked={settings.customization?.showSelectedText}
                           onChange={(e) => handleImmediateSettingUpdate('showSelectedText', e.target.checked)}
                         />
                         <ToggleSlider />
                       </ToggleContainer>
                     </FormRow>
                     
                     <SectionDivider />
                     
                     <FormRow>
                       <div>
                         <Label>Persist Highlight</Label>
                         <Description>Keep the highlight on the selected text after the popup closes</Description>
                       </div>
                       <ToggleContainer>
                         <ToggleInput 
                           type="checkbox" 
                           checked={settings.customization?.persistHighlight}
                           onChange={(e) => handleImmediateSettingUpdate('persistHighlight', e.target.checked)}
                         />
                         <ToggleSlider />
                       </ToggleContainer>
                     </FormRow>
                     
                     <SectionDivider />
                     
                     <FormRow>
                       <div>
                         <Label>Automatic Activation</Label>
                         <Description>Automatically activate LightUp when text is selected</Description>
                       </div>
                       <ToggleContainer>
                         <ToggleInput 
                            type="checkbox" 
                            checked={settings.customization?.automaticActivation}
                            onChange={(e) => {
                              // Update both settings to ensure consistency in a single operation
                              const newValue = e.target.checked;
                              handleMultipleSettingsUpdate({
                                'automaticActivation': newValue,
                                'activationMode': newValue ? 'automatic' : 'manual'
                              });
                            }}
                         />
                         <ToggleSlider />
                       </ToggleContainer>
                     </FormRow>
                     
                     <SectionDivider />
                     
                     <FormRow>
                       <div>
                         <Label>Quick View</Label>
                         <Description>Show floating button to instantly process page content</Description>
                       </div>
                       <ToggleContainer>
                         <ToggleInput 
                           type="checkbox" 
                           checked={settings.customization?.quickView}
                           onChange={(e) => handleImmediateSettingUpdate('quickView', e.target.checked)}
                         />
                         <ToggleSlider />
                       </ToggleContainer>
                     </FormRow>
                     
                     <SectionDivider />
                     
                     <FormRow>
                       <div>
                         <Label>Radically Focus Mode</Label>
                         <Description>Blur background when viewing results</Description>
                       </div>
                       <ToggleContainer>
                         <ToggleInput 
                           type="checkbox" 
                           checked={settings.customization?.radicallyFocus}
                           onChange={(e) => handleImmediateSettingUpdate('radicallyFocus', e.target.checked)}
                         />
                         <ToggleSlider />
                       </ToggleContainer>
                     </FormRow>

                     <SectionDivider />
                   </SectionContainer>
            
                   <SectionContainer>
                     {/* <SectionHeader>Activation & Layout</SectionHeader> */}
                  
                     
                      
                      
                      
                      <div style={{ marginTop: '0', marginBottom: '16px' }}>
                        <Label>Layout Mode</Label>
                        <Description>Choose how LightUp appears on the page</Description>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                          <LayoutButton 
                            selected={settings.customization?.layoutMode === 'floating'}
                            onClick={() => handleImmediateSettingUpdate('layoutMode', 'floating')}
                          >
                            <div className="layout-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="4" y="4" width="16" height="16" rx="2" stroke="white" strokeWidth="2" />
                                <circle cx="12" cy="12" r="1" stroke="white" strokeWidth="2" />
                                <circle cx="12" cy="8" r="1" stroke="white" strokeWidth="2" />
                                <circle cx="12" cy="16" r="1" stroke="white" strokeWidth="2" />
                              </svg>
                            </div>
                            <div className="layout-label">Floating</div>
                          </LayoutButton>
                          
                          <LayoutButton 
                            selected={settings.customization?.layoutMode === 'sidebar'}
                            onClick={() => handleImmediateSettingUpdate('layoutMode', 'sidebar')}
                          >
                            <div className="layout-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2" />
                                <line x1="15" y1="3" x2="15" y2="21" stroke="white" strokeWidth="2" />
                              </svg>
                            </div>
                            <div className="layout-label">Sidebar</div>
                          </LayoutButton>
                          
                          <LayoutButton 
                            selected={settings.customization?.layoutMode === 'centered'}
                            onClick={() => handleImmediateSettingUpdate('layoutMode', 'centered')}
                          >
                            <div className="layout-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" strokeWidth="2" />
                                <rect x="6" y="8" width="12" height="8" rx="1" stroke="white" strokeWidth="2" />
                              </svg>
                            </div>
                            <div className="layout-label">Centered</div>
                          </LayoutButton>
                        </div>
                      </div>
                      
                    
                      
                    
                   </SectionContainer>
                 </div>

               </SettingsCard>
           </div>
          )}

          {activeTab === "model" && (
            <div key="model">
              <SettingsCard title="Model Settings" icon={null}>
                <SectionContainer>
                  <SectionHeader>AI Engine Selection</SectionHeader>
                  <SubContainer>
                    <FormGroup>
                      <FormLabel htmlFor="modelType">Choose Model Type</FormLabel>
                      <FormDescription>Select which AI provider to use for generating responses.</FormDescription>
                      <FormSelect
                        id="modelType"
                        value={settings.modelType}
                        onChange={(e) => {
                          const newModelType = e.target.value as ModelType;
                          setSettings(prev => ({ ...prev, modelType: newModelType }));
                          // Auto-save when model type changes
                          setTimeout(() => handleSave(), 100);
                        }}
                      >
                        <option value="basic">Basic (Gemini Flash)</option>
                        <option value="gemini">Gemini (Google)</option>
                        <option value="grok">Grok (xAI)</option>
                        <option value="local">Local (Ollama)</option>
                      </FormSelect>
                    </FormGroup>
                  </SubContainer>
                </SectionContainer>

                {settings.modelType === "gemini" && (
                  <SectionContainer>
                    <SectionHeader>Gemini Configuration</SectionHeader>
                    <SubContainer>
                      <FormGroup>
                        <FormLabel htmlFor="geminiApiKey">Gemini API Key</FormLabel>
                        <FormInput
                          type="password"
                          id="geminiApiKey"
                          value={settings.geminiApiKey}
                          onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                          onBlur={handleSave}
                          placeholder="Enter your Gemini API key"
                        />
                        <FormDescription>
                          Get your API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" style={{ color: '#93C5FD', textDecoration: 'none', ':hover': { textDecoration: 'underline' } }}>Google AI Studio</a>.
                        </FormDescription>
                      </FormGroup>
                    </SubContainer>
                    
                    <SubContainer>
                      <FormGroup>
                        <FormLabel>Gemini Model</FormLabel>
                        <FormDescription>Select which Gemini model version to use.</FormDescription>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '12px' }}>
                          {GEMINI_MODELS.map((model) => (
                            <ModelOption
                              key={model.value}
                              model={model}
                              selected={settings.geminiModel === model.value}
                              onChange={() => {
                                setSettings(prev => ({ ...prev, geminiModel: model.value }));
                                // Auto-save when model changes
                                setTimeout(() => handleSave(), 100);
                              }}
                            />
                          ))}
                        </div>
                      </FormGroup>
                    </SubContainer>
                  </SectionContainer>
                )}

                {settings.modelType === "grok" && (
                  <SectionContainer>
                    <SectionHeader>Grok Configuration</SectionHeader>
                    <SubContainer>
                      <FormGroup>
                        <FormLabel htmlFor="xaiApiKey">xAI API Key</FormLabel>
                        <FormInput
                          type="password"
                          id="xaiApiKey"
                          value={settings.xaiApiKey}
                          onChange={(e) => setSettings(prev => ({ ...prev, xaiApiKey: e.target.value }))}
                          onBlur={handleSave}
                          placeholder="Enter your xAI API key"
                        />
                        <FormDescription>
                          Get your API key from <a href="https://x.ai/api" target="_blank" rel="noopener noreferrer" style={{ color: '#93C5FD', textDecoration: 'none', ':hover': { textDecoration: 'underline' } }}>x.ai</a>.
                        </FormDescription>
                      </FormGroup>
                    </SubContainer>
                    
                    <SubContainer>
                      <FormGroup>
                        <FormLabel>Grok Model</FormLabel>
                        <FormDescription>Select which Grok model version to use.</FormDescription>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '12px' }}>
                          {GROK_MODELS.map((model) => (
                            <ModelOption
                              key={model.value}
                              model={model}
                              selected={settings.grokModel === model.value}
                              onChange={() => {
                                setSettings(prev => ({ ...prev, grokModel: model.value }));
                                // Auto-save when model changes
                                setTimeout(() => handleSave(), 100);
                              }}
                              showPrice={true}
                            />
                          ))}
                        </div>
                      </FormGroup>
                    </SubContainer>
                  </SectionContainer>
                )}

                {settings.modelType === "local" && (
                  <SectionContainer>
                    <SectionHeader>Ollama Configuration</SectionHeader>
                    <SubContainer>
                      <FormGroup>
                        <FormLabel htmlFor="serverUrl">Ollama Server URL</FormLabel>
                        <FormInput
                          type="text"
                          id="serverUrl"
                          value={settings.serverUrl || ""}
                          onChange={handleServerUrlChange}
                          onBlur={handleSave}
                          placeholder="http://localhost:11434"
                        />
                        <FormDescription>
                          The URL of your Ollama server. Default is <code style={{ backgroundColor: '#444444', padding: '2px 4px', borderRadius: '4px' }}>http://localhost:11434</code>.
                        </FormDescription>
                      </FormGroup>
                    </SubContainer>
                    
                    <SubContainer>
                      <FormGroup>
                        <FormLabel>Local Model</FormLabel>
                        <FormDescription>Select which local model to use with Ollama.</FormDescription>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '12px' }}>
                          {LOCAL_MODELS.map((model) => (
                            <ModelOption
                              key={model.value}
                              model={model}
                              selected={settings.localModel === model.value}
                              onChange={() => {
                                setSettings(prev => ({ ...prev, localModel: model.value }));
                                // Auto-save when model changes
                                setTimeout(() => handleSave(), 100);
                              }}
                              showSize={true}
                            />
                          ))}
                        </div>
                      </FormGroup>
                    </SubContainer>
                  </SectionContainer>
                )}

                <SectionDivider  style={{marginBottom:"30px"}}/>

                <SectionContainer>
                  
                  <SectionHeader>Response Settings</SectionHeader>
                  <SubContainer>
                    <FormGroup>
                      <FormLabel htmlFor="maxTokens">Max Tokens (Response Length)</FormLabel>
                      <FormDescription>Maximum number of tokens (words/characters) in the AI's response.</FormDescription>
                      <FormInput
                        type="number"
                        id="maxTokens"
                        value={settings.maxTokens}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                        onBlur={handleSave}
                        min="1"
                        max="4096"
                      />
                    </FormGroup>
                  </SubContainer>
                </SectionContainer>


                {/* Auto-saves when settings change - main save button at the bottom of the options page */}
              </SettingsCard>
            </div>
          )}

          {activeTab === "prompts" && (
            <div key="prompts">
              <SettingsCard title="Prompt Templates" icon={null}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <FormDescription>Customize the prompts used for different AI actions. Use {'`{{selectedText}}`'} as a placeholder for the text you select on a page.</FormDescription>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {saveSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 500, color: '#2DCA6E' }}>
                        <svg style={{ height: '20px', width: '20px', color: '#2DCA6E', marginRight: '6px' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Reset complete!
                      </div>
                    )}
                    <Button
                      variant="default"
                      onClick={() => {
                        const updatedSettings = {
                          ...settings,
                          customPrompts: {
                            ...settings.customPrompts,
                            systemPrompts: {
                              ...settings.customPrompts?.systemPrompts,
                              [activePromptMode]: undefined
                            },
                            userPrompts: {
                              ...settings.customPrompts?.userPrompts,
                              [activePromptMode]: undefined
                            }
                          }
                        };
                        
                        setSettings(updatedSettings);
                        storage.set("settings", updatedSettings);
                        
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 2000);
                      }}
                    >
                      Reset Current Template
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '24px' }}>
                  <SectionContainer>
                    <SectionHeader>Prompt Mode</SectionHeader>
                    <FormDescription>Choose how LightUp will process your selected text</FormDescription>
                    
                    <SectionDivider />
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                      <ActionButton 
                        selected={activePromptMode === 'explain'}
                        onClick={() => setActivePromptMode('explain')}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div style={{ fontWeight: '500' }}>Explain</div>
                        {activePromptMode === 'explain' && (
                          <div style={{ position: 'absolute', top: '5px', right: '5px', color: '#2DCA6E' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </ActionButton>
                      
                      <ActionButton 
                        selected={activePromptMode === 'summarize'}
                        onClick={() => setActivePromptMode('summarize')}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6H20M4 12H12M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div style={{ fontWeight: '500' }}>Summarize</div>
                        {activePromptMode === 'summarize' && (
                          <div style={{ position: 'absolute', top: '5px', right: '5px', color: '#2DCA6E' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </ActionButton>
                      
                      <ActionButton 
                        selected={activePromptMode === 'analyze'}
                        onClick={() => setActivePromptMode('analyze')}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 22H15M9 7H15M9 4H15M5.5 12H7.5M11.5 12H13.5M17.5 12H19.5M1 12H3M21 12H23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 15H19C20.1046 15 21 14.1046 21 13V11C21 9.89543 20.1046 9 19 9H5C3.89543 9 3 9.89543 3 11V13C3 14.1046 3.89543 15 5 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div style={{ fontWeight: '500' }}>Analyze</div>
                        {activePromptMode === 'analyze' && (
                          <div style={{ position: 'absolute', top: '5px', right: '5px', color: '#2DCA6E' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </ActionButton>
                      
                      <ActionButton 
                        selected={activePromptMode === 'translate'}
                        onClick={() => setActivePromptMode('translate')}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 8L10 13M10 8L5 13M19 8L14 13M14 8L19 13M2 5H12M22 5H12M2 19H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div style={{ fontWeight: '500' }}>Translate</div>
                        {activePromptMode === 'translate' && (
                          <div style={{ position: 'absolute', top: '5px', right: '5px', color: '#2DCA6E' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </ActionButton>
                      
                      <ActionButton 
                        selected={activePromptMode === 'free'}
                        onClick={() => setActivePromptMode('free')}
                      >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div style={{ fontWeight: '500' }}>Free</div>
                        {activePromptMode === 'free' && (
                          <div style={{ position: 'absolute', top: '5px', right: '5px', color: '#2DCA6E' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </ActionButton>
                    </div>
                  </SectionContainer>
                  
                  <SectionContainer>
                    <SectionHeader>Prompt Details</SectionHeader>
                    <FormDescription>View and customize the selected prompt</FormDescription>
                    
                    <SectionDivider />
                    
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Label>System Prompt</Label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {saveSuccess && (
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 500, color: '#2DCA6E' }}>
                              <svg style={{ height: '20px', width: '20px', color: '#2DCA6E', marginRight: '6px' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Saved!
                            </div>
                          )}
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (isEditingSystemPrompt) {
                                // Save the edited prompt if it's not a function-based prompt
                                if (typeof SYSTEM_PROMPTS[activePromptMode] !== 'function') {
                                  // Update the system prompts in settings
                                  const updatedSettings = {
                                    ...settings,
                                    customPrompts: {
                                      ...settings.customPrompts,
                                      systemPrompts: {
                                        ...settings.customPrompts?.systemPrompts,
                                        [activePromptMode]: editedSystemPrompt
                                      }
                                    }
                                  };
                                  
                                  // Update state and storage
                                  setSettings(updatedSettings);
                                  storage.set("settings", updatedSettings);
                                  
                                  // Show success feedback
                                  setSaveSuccess(true);
                                  setTimeout(() => setSaveSuccess(false), 2000);
                                }
                                setIsEditingSystemPrompt(false);
                              } else {
                                // Get the current prompt - use custom if available, otherwise default
                                const currentPrompt = settings.customPrompts?.systemPrompts?.[activePromptMode] || 
                                  (typeof SYSTEM_PROMPTS[activePromptMode] !== 'function' ? 
                                   SYSTEM_PROMPTS[activePromptMode] as string : 
                                   'Cannot edit function-based prompts');
                                
                                setEditedSystemPrompt(currentPrompt);
                                setIsEditingSystemPrompt(true);
                              }
                            }}
                          >
                            {isEditingSystemPrompt ? 'Save' : 'Edit'}
                          </Button>
                        </div>
                      </div>
                      <Description style={{ marginBottom: '12px' }}>Instructions that guide the AI's behavior</Description>
                      
                      {isEditingSystemPrompt ? (
                        <FormTextarea
                          value={editedSystemPrompt}
                          onChange={(e) => setEditedSystemPrompt(e.target.value)}
                          rows={6}
                          style={{ 
                            backgroundColor: '#333', 
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: '8px',
                            padding: '12px',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            width: '100%',
                            resize: 'vertical'
                          }}
                        />
                      ) : (
                        <div style={{ 
                          backgroundColor: '#444', 
                          padding: '12px', 
                          borderRadius: '8px',
                          border: '1px solid #555',
                          color: '#eee',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '120px',
                          overflowY: 'auto'
                        }}>
                          {typeof SYSTEM_PROMPTS[activePromptMode] === 'function' 
                            ? '(Function not displayed)' 
                            : settings.customPrompts?.systemPrompts?.[activePromptMode] || SYSTEM_PROMPTS[activePromptMode]}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ marginTop: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Label>User Prompt</Label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {saveSuccess && (
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 500, color: '#2DCA6E' }}>
                              <svg style={{ height: '20px', width: '20px', color: '#2DCA6E', marginRight: '6px' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Saved!
                            </div>
                          )}
                          <Button
                            variant="primary"
                            onClick={() => {
                              if (isEditingUserPrompt) {
                                // Save the edited prompt if it's not a function-based prompt
                                if (typeof USER_PROMPTS[activePromptMode] !== 'function') {
                                  // Update the user prompts in settings
                                  const updatedSettings = {
                                    ...settings,
                                    customPrompts: {
                                      ...settings.customPrompts,
                                      userPrompts: {
                                        ...settings.customPrompts?.userPrompts,
                                        [activePromptMode]: editedUserPrompt
                                      }
                                    }
                                  };
                                  
                                  // Update state and storage
                                  setSettings(updatedSettings);
                                  storage.set("settings", updatedSettings);
                                  
                                  // Show success feedback
                                  setSaveSuccess(true);
                                  setTimeout(() => setSaveSuccess(false), 2000);
                                }
                                setIsEditingUserPrompt(false);
                              } else {
                                // Get the current prompt - use custom if available, otherwise default
                                const currentPrompt = settings.customPrompts?.userPrompts?.[activePromptMode] || 
                                  (typeof USER_PROMPTS[activePromptMode] !== 'function' ? 
                                   USER_PROMPTS[activePromptMode] as string : 
                                   'Cannot edit function-based prompts');
                                
                                setEditedUserPrompt(currentPrompt);
                                setIsEditingUserPrompt(true);
                              }
                            }}
                          >
                            {isEditingUserPrompt ? 'Save' : 'Edit'}
                          </Button>
                        </div>
                      </div>
                      <Description style={{ marginBottom: '12px' }}>Template for how your selection is sent to the AI</Description>
                      
                      {isEditingUserPrompt ? (
                        <FormTextarea
                          value={editedUserPrompt}
                          onChange={(e) => setEditedUserPrompt(e.target.value)}
                          rows={6}
                          style={{ 
                            backgroundColor: '#333', 
                            color: '#fff',
                            border: '1px solid #555',
                            borderRadius: '8px',
                            padding: '12px',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            width: '100%',
                            resize: 'vertical'
                          }}
                        />
                      ) : (
                        <div style={{ 
                          backgroundColor: '#444', 
                          padding: '12px', 
                          borderRadius: '8px',
                          border: '1px solid #555',
                          color: '#eee',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '120px',
                          overflowY: 'auto'
                        }}>
                          {typeof USER_PROMPTS[activePromptMode] === 'function' 
                            ? `(Dynamic template - varies based on your selected text)` 
                            : settings.customPrompts?.userPrompts?.[activePromptMode] || USER_PROMPTS[activePromptMode]}
                        </div>
                      )}
                    </div>
                  </SectionContainer>
                </div>
              </SettingsCard>
              
              {/* No popup notification - we use inline notifications instead */}
              
              {/* Instructions for applying templates */}
              <div style={{
                marginTop: '24px',
                padding: '12px 16px',
                backgroundColor: '#444',
                borderRadius: '8px',
                border: '1px solid #555'
              }}>
                <p style={{ fontSize: '14px', color: '#CCC', margin: '0 0 8px 0' }}>
                  <strong>How to apply your custom templates:</strong>
                </p>
                <ul style={{ fontSize: '14px', color: '#CCC', margin: '0', paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}>Custom templates apply to all new conversations</li>
                  <li style={{ marginBottom: '4px' }}>To apply changes to an existing conversation, close and reopen the popup</li>
                  <li>For global action button, changes are applied immediately</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "customization" && (
            <div key="customization">
              <SettingsCard title="Customization" icon={null}>
                <SectionContainer>
                  <SectionHeader>Appearance</SectionHeader>
                  
                  <div>
                    <Label>Theme</Label>
                    <Description>Choose your preferred color theme</Description>
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <ThemeButton 
                        selected={settings.customization?.theme === 'dark'}
                        onClick={() => handleImmediateSettingUpdate('theme', 'dark')}
                      >
                        <ThemeIcon>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                        </ThemeIcon>
                        <div>Dark Theme</div>
                      </ThemeButton>
                      
                      <ThemeButton 
                        selected={settings.customization?.theme === 'light'}
                        onClick={() => handleImmediateSettingUpdate('theme', 'light')}
                      >
                        <ThemeIcon>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" fill="white"/>
                            <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </ThemeIcon>
                        <div>Light Theme</div>
                      </ThemeButton>
                      
                      <ThemeButton 
                        selected={settings.customization?.theme === 'system'}
                        onClick={() => handleImmediateSettingUpdate('theme', 'system')}
                      >
                        <ThemeIcon>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="4" width="20" height="15" rx="2" stroke="white" strokeWidth="2"/>
                            <path d="M8 19V21" stroke="white" strokeWidth="2"/>
                            <path d="M16 19V21" stroke="white" strokeWidth="2"/>
                            <path d="M8 21H16" stroke="white" strokeWidth="2"/>
                          </svg>
                        </ThemeIcon>
                        <div>System Default</div>
                      </ThemeButton>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '32px' }}>
                    <Label>Font Size</Label>
                    <Description>Adjust the text size of the LightUp popup content</Description>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                      <FontSizeButton 
                        selected={settings.customization?.fontSize === 'xx-small'}
                        onClick={() => handleImmediateSettingUpdate('fontSize', 'xx-small')}
                      >
                        <div className="size-preview" style={{ fontSize: '0.7rem' }}>Aa</div>
                        <div className="size-label">XX-Small</div>
                      </FontSizeButton>

                      <FontSizeButton 
                        selected={settings.customization?.fontSize === 'x-small'}
                        onClick={() => handleImmediateSettingUpdate('fontSize', 'x-small')}
                      >
                        <div className="size-preview" style={{ fontSize: '0.8rem' }}>Aa</div>
                        <div className="size-label">X-Small</div>
                      </FontSizeButton>
                       
                      <FontSizeButton 
                        selected={settings.customization?.fontSize === 'small'}
                        onClick={() => handleImmediateSettingUpdate('fontSize', 'small')}
                      >
                        <div className="size-preview" style={{ fontSize: '0.875rem' }}>Aa</div>
                        <div className="size-label">Small</div>
                      </FontSizeButton>
                       
                      <FontSizeButton 
                        selected={settings.customization?.fontSize === 'medium'}
                        onClick={() => handleImmediateSettingUpdate('fontSize', 'medium')}
                      >
                        <div className="size-preview" style={{ fontSize: '1rem' }}>Aa</div>
                        <div className="size-label">Medium</div>
                      </FontSizeButton>
                       
                      <FontSizeButton 
                        selected={settings.customization?.fontSize === 'large'}
                        onClick={() => handleImmediateSettingUpdate('fontSize', 'large')}
                      >
                        <div className="size-preview" style={{ fontSize: '1.125rem' }}>Aa</div>
                        <div className="size-label">Large</div>
                      </FontSizeButton>
                       
                      <FontSizeButton 
                        selected={settings.customization?.fontSize === 'x-large'}
                        onClick={() => handleImmediateSettingUpdate('fontSize', 'x-large')}
                      >
                        <div className="size-preview" style={{ fontSize: '1.25rem' }}>Aa</div>
                        <div className="size-label">X-Large</div>
                      </FontSizeButton>

                      <FontSizeButton 
                        selected={settings.customization?.fontSize === 'xx-large'}
                        onClick={() => handleImmediateSettingUpdate('fontSize', 'xx-large')}
                      >
                        <div className="size-preview" style={{ fontSize: '1.4rem' }}>Aa</div>
                        <div className="size-label">XX-Large</div>
                      </FontSizeButton>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '32px' }}>
                    <Label>Highlight Color</Label>
                    <Description>Choose the color for text highlighting</Description>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                      {[
                        { value: 'default', label: 'Default', color: '#fff8bc' },
                        { value: 'orange', label: 'Orange', color: '#FFBF5A' },
                        { value: 'blue', label: 'Blue', color: '#93C5FD' },
                        { value: 'green', label: 'Green', color: '#86EFAC' },
                        { value: 'purple', label: 'Purple', color: '#C4B5FD' },
                        { value: 'pink', label: 'Pink', color: '#FDA4AF' }
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
                            onClick={() => handleImmediateSettingUpdate('highlightColor', colorOption.value)}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: colorOption.color,
                              border: colorOption.value === (settings.customization?.highlightColor || 'default') ? `2px solid #2DCA6E` : '2px solid transparent',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease-in-out'
                            }}
                          >
                            {colorOption.value === (settings.customization?.highlightColor || 'default') && (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4 4L19 7" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>{colorOption.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionContainer>
                <SectionContainer>
                  <SectionHeader>Animation Settings</SectionHeader>
                  <FormGroup>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <FormLabel htmlFor="popupAnimation">Popup Animation</FormLabel>
                      <FormSelect
                        id="popupAnimation"
                        value={settings.customization?.popupAnimation}
                        onChange={(e) => handleImmediateSettingUpdate('popupAnimation', e.target.value)}
                        style={{ minWidth: '140px' }}
                      >
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                        <option value="scale">Scale</option>
                        <option value="none">None</option>
                      </FormSelect>
                    </div>
                    <FormDescription>
                      Choose how the popup appears when activated
                    </FormDescription>
                  </FormGroup>
                </SectionContainer>
              </SettingsCard>
            </div>
          )}

          {activeTab === "about" && (
            <div key="about">
              <SettingsCard title="About LightUp" icon={null}>
                <SectionContainer>
                  {/* <SectionHeader>About</SectionHeader> */}
                  <FormDescription style={{ marginBottom: '16px' }}>LightUp is an open-source browser extension designed to enhance your reading experience by providing instant AI-powered explanations and insights on selected text.</FormDescription>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>Version:</span>
                      <Badge variant="info">v1.1.12</Badge>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>Developed by:</span>
                      <span style={{ color: '#FFFFFF', fontSize: '14px' }}>Your Name/Organization</span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>Source Code:</span>
                      <a 
                        href="https://github.com/your-repo/lightup" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ color: '#93C5FD', textDecoration: 'none', fontSize: '14px' }}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        GitHub
                      </a>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 500 }}>License:</span>
                      <span style={{ color: '#FFFFFF', fontSize: '14px' }}>MIT License</span>
                    </div>
                  </div>
                </SectionContainer>

                <SectionDivider />

                <SectionContainer>
                  <SectionHeader>Feedback</SectionHeader>
                  <FormDescription style={{ marginBottom: '16px' }}>Help us improve the extension by sharing your experience</FormDescription>
                  
                  <Button
                    variant="primary"
                    onClick={() => window.open('https://boi.featurebase.app/', '_blank')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                    Provide Feedback
                  </Button>
                </SectionContainer>

                <SectionDivider />

                <SectionContainer>
                  <SectionHeader>Privacy Policy</SectionHeader>
                  <FormDescription style={{ marginBottom: '16px' }}>Information about how we handle your data</FormDescription>
                  
                  <div style={{ background: '#333333', borderRadius: '8px', padding: '20px', marginTop: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px', color: '#FFFFFF' }}>Privacy Commitment</h3>
                    
                    <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6' }}>
                      <p style={{ marginBottom: '16px' }}>
                        We take your privacy seriously. LightUp processes text locally by default and only sends data to our servers when explicitly requested.
                      </p>
                      
                      <p style={{ marginBottom: '16px' }}>
                        The extension does not collect any personal information without your consent. We do not sell or share your data with third parties.
                      </p>
                      
                      <p style={{ marginBottom: '16px' }}>
                        By using this extension, you agree to our privacy policy and terms of service.
                      </p>
                    </div>
                    
                    <Button
                      variant="primary"
                      onClick={() => window.open('https://www.boimaginations.com/privacy', '_blank')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 2h6v6M11 13L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Full Privacy Policy
                    </Button>
                  </div>
                </SectionContainer>

                <SectionDivider />

                <SectionContainer>
                  <SectionHeader>Links</SectionHeader>
                  <FormDescription style={{ marginBottom: '16px' }}>Useful resources and external links</FormDescription>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button
                      variant="default"
                      onClick={() => window.open('https://www.boimaginations.com/lightup', '_blank')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
                      </svg>
                      Visit Website
                    </Button>
                    
                    <Button
                      variant="default"
                      onClick={() => window.open('https://chromewebstore.google.com/detail/lightup-ai-powered-web-an/pncapgeoeedlfppkohlbelelkkihikel/reviews', '_blank')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                      Rate Us on Chrome Web Store
                    </Button>
                  </div>
                </SectionContainer>
              </SettingsCard>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          {activeTab !== "about" && (
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {saveSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 500, color: '#2DCA6E' }}>
                  <svg style={{ height: '20px', width: '20px', color: '#2DCA6E', marginRight: '6px' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Settings saved!
                </div>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                style={{ opacity: isSaving ? 0.5 : 1 }}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          )}
        </ContentArea>
      </ContentWrapper>
    </OptionsContainer>
  );
}

export default IndexOptions;
