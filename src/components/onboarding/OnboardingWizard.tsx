/**
 * OnboardingWizard - First-run setup experience for LightUp
 * 
 * Steps:
 * 1. Language & Theme selection
 * 2. AI Provider selection
 * 3. Essential controls (toggles)
 * 4. Review & finish
 */

import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { motion, AnimatePresence } from "framer-motion";
import type { Settings, ModelType } from "~types/settings";
import {
  FAMILY_SPRINGS,
  prefersReducedMotion,
  getSafeTransition,
  fadeSlideVariants,
  staggerContainer,
  staggerItem
} from "~animations/familyWalletConfig";

// Import the actual LightUp logo
import logoUrl from "../../../assets/icon.png";

// ============================================================================
// Types
// ============================================================================

interface OnboardingWizardProps {
  step: number;
  totalSteps: number;
  settings: Settings;
  locale: string;
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onUpdateCustomization: (key: string, value: any) => void;
  onUpdateLocale: (locale: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
  isLoading?: boolean;
  isCompleting?: boolean;
  supportedLanguages: Array<{ code: string; name: string; nativeName: string }>;
  providerOptions: Array<{
    id: ModelType;
    title: string;
    subtitle: string;
    body: string;
    badge?: string;
  }>;
  toggleOptions: Array<{
    key: keyof Settings["customization"];
    label: string;
    description: string;
  }>;
  stepCopy: Array<{
    title: string;
    description: string;
  }>;
}

// ============================================================================
// Styled Components - Matching LightUp Brand
// ============================================================================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--popup-overlay-bg, rgba(0, 0, 0, 0.5));
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const WizardContainer = styled.div`
  background: var(--popup-bg);
  border-radius: 16px;
  border: 1px solid var(--popup-border);
  max-width: 540px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.div`
  padding: 24px 24px 16px;
  background: var(--popup-header);
  border-bottom: 1px solid var(--popup-border);
  text-align: center;
`;

const LogoImage = styled.img`
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 14px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: var(--popup-fg);
  margin: 0 0 6px;
  letter-spacing: -0.2px;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: var(--popup-secondary-text);
  margin: 0;
  line-height: 1.5;
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 18px;
`;

const ProgressDot = styled.div<{ active: boolean; completed: boolean }>`
  width: ${props => props.active ? '20px' : '8px'};
  height: 8px;
  border-radius: 4px;
  background: ${props =>
    props.completed
      ? '#fba928'
      : props.active
      ? '#fba928'
      : 'var(--popup-border)'};
  transition: all 0.25s ease;
`;

const StepIndicator = styled.div`
  font-size: 12px;
  color: var(--popup-secondary-text);
  margin-top: 10px;
  font-weight: 500;
`;

const Content = styled.div`
  padding: 20px 24px 24px;
  overflow-y: auto;
  flex: 1;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--popup-scrollbar-thumb);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const StepTitle = styled.h2`
  font-size: 17px;
  font-weight: 600;
  color: var(--popup-fg);
  margin: 0 0 6px;
`;

const StepDescription = styled.p`
  font-size: 13px;
  color: var(--popup-secondary-text);
  margin: 0 0 16px;
  line-height: 1.5;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  width: 100%;
`;

const OptionCard = styled.button<{ selected: boolean }>`
  background: ${props => props.selected ? 'var(--popup-subcontainer-bg)' : 'transparent'};
  color: ${props => props.selected ? 'var(--popup-fg)' : 'var(--popup-secondary-text)'};
  border: 1px solid ${props => props.selected ? 'var(--popup-toggle-active)' : 'var(--popup-border)'};
  border-radius: 8px;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:focus-visible {
    outline: 2px solid var(--popup-toggle-active);
    outline-offset: 2px;
  }
`;

const OptionTitle = styled.div`
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 2px;
`;

const OptionSubtitle = styled.div<{ selected: boolean }>`
  font-size: 9px;
  opacity: ${props => props.selected ? 0.8 : 0.6};
  line-height: 1.2;
`;

const Badge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--popup-toggle-active);
  color: white;
  font-size: 9px;
  font-weight: 600;
  padding: 3px 7px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const ProviderCard = styled.button<{ selected: boolean }>`
  background: ${props => props.selected ? 'var(--popup-subcontainer-bg)' : 'transparent'};
  color: ${props => props.selected ? 'var(--popup-fg)' : 'var(--popup-secondary-text)'};
  border: 1px solid ${props => props.selected ? '#22c55e' : 'var(--popup-border)'};
  border-radius: 12px;
  padding: 20px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  width: 100%;

  &:focus-visible {
    outline: 2px solid #22c55e;
    outline-offset: 2px;
  }
`;

const ProviderTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  line-height: 1.3;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ProviderSubtitle = styled.div<{ selected: boolean }>`
  font-size: 13px;
  opacity: ${props => props.selected ? 0.9 : 0.7};
  margin-bottom: 8px;
  line-height: 1.4;
  font-weight: 500;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ProviderBody = styled.div<{ selected: boolean }>`
  font-size: 13px;
  opacity: ${props => props.selected ? 0.8 : 0.6};
  line-height: 1.5;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const ProviderDetailsCard = styled.div`
  margin-top: 14px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--popup-subcontainer-border);
  background: var(--popup-subcontainer-bg);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: var(--popup-fg);
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--popup-border);
  background: var(--popup-input-bg);
  color: var(--popup-fg);
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: #22c55e;
  }
`;

const FieldHelper = styled.div`
  font-size: 12px;
  color: var(--popup-secondary-text);
  line-height: 1.4;
`;

const MotionOptionsGrid = motion(OptionsGrid);

const ToggleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ToggleRow = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--popup-subcontainer-bg);
  border-radius: 10px;
  transition: all 0.2s ease;
`;

const ToggleInfo = styled.div`
  flex: 1;
  margin-right: 14px;
`;

const ToggleLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--popup-fg);
  margin-bottom: 2px;
`;

const ToggleDescription = styled.div`
  font-size: 12px;
  color: var(--popup-secondary-text);
  line-height: 1.4;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: var(--popup-toggle-active);
  }

  &:checked + span:before {
    transform: translateX(20px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--popup-toggle-track);
  transition: 0.3s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

const ReviewSection = styled.div`
  background: var(--popup-subcontainer-bg);
  border: 1px solid var(--popup-subcontainer-border);
  border-radius: 10px;
  padding: 16px;
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ReviewLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--popup-secondary-text);
  margin-bottom: 6px;
  font-weight: 500;
`;

const ReviewValue = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: var(--popup-fg);
`;

const Footer = styled.div`
  padding: 16px 24px 20px;
  border-top: 1px solid var(--popup-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--popup-header);
`;

const SkipButton = styled.button`
  background: none;
  border: none;
  color: var(--popup-secondary-text);
  font-size: 13px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: inherit;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ButtonColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? '#fba928' : 'var(--popup-btn-default)'};
  color: ${props => props.variant === 'primary' ? '#000000' : 'var(--popup-btn-text)'};
  border: none;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const MotionWizardContainer = motion(WizardContainer);

const MotionButton = motion(Button);

const CompleteButton = styled(Button)`
  background: #fba928;
  color: #000000;
  border: 1px solid #fba928;

  &:focus-visible {
    outline: 2px solid #fba928;
    outline-offset: 2px;
  }
`;

const MotionCompleteButton = motion(CompleteButton);

const ThemePreview = styled.div<{ themeType: string; selected: boolean }>`
  width: 100%;
  height: 24px;
  border-radius: 4px;
  margin-bottom: 4px;
  background: transparent;
  
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--popup-fg);
`;

const CTAHelper = styled.div`
  font-size: 12px;
  color: var(--popup-secondary-text);
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: right;
`;

// ============================================================================
// Minimal Theme Icon Components
// ============================================================================

const DarkThemeIcon = () => (
  <svg
    width="16"
    height="16"
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
);

const LightThemeIcon = () => (
  <svg
    width="16"
    height="16"
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
);

const SystemThemeIcon = () => (
  <svg
    width="16"
    height="16"
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
);

// ============================================================================
// Component
// ============================================================================

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  step,
  totalSteps,
  settings,
  locale,
  onUpdateSettings,
  onUpdateCustomization,
  onUpdateLocale,
  onNext,
  onBack,
  onSkip,
  onComplete,
  isLoading,
  isCompleting,
  supportedLanguages,
  providerOptions,
  toggleOptions,
  stepCopy,
}) => {
  const [direction, setDirection] = useState(0);
  const [previousStep, setPreviousStep] = useState(step);

  useEffect(() => {
    if (step !== previousStep) {
      setDirection(step > previousStep ? 1 : -1);
      setPreviousStep(step);
    }
  }, [step, previousStep]);

  const currentStepCopy = stepCopy[step - 1] || { title: '', description: '' };

  const renderStep1 = () => (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div variants={staggerItem}>
        <StepTitle>{currentStepCopy.title}</StepTitle>
        <StepDescription>{currentStepCopy.description}</StepDescription>
      </motion.div>

      <motion.div style={{ marginBottom: '24px' }} variants={staggerItem}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: 'var(--popup-fg)' }}>
          Language
        </div>
        <OptionsGrid>
          {supportedLanguages.slice(0, 8).map((lang) => (
            <OptionCard
              key={lang.code}
              selected={locale === lang.code}
              onClick={() => onUpdateLocale(lang.code)}
            >
              <OptionTitle>{lang.nativeName}</OptionTitle>
              <OptionSubtitle selected={locale === lang.code}>{lang.name}</OptionSubtitle>
            </OptionCard>
          ))}
        </OptionsGrid>
      </motion.div>

      <motion.div variants={staggerItem}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: 'var(--popup-fg)' }}>
          Theme
        </div>
        <OptionsGrid>
          {[
            { value: 'system', label: 'System', icon: <SystemThemeIcon />, subtitle: 'Match your device' },
            { value: 'light', label: 'Light', icon: <LightThemeIcon />, subtitle: 'Bright UI' },
            { value: 'dark', label: 'Dark', icon: <DarkThemeIcon />, subtitle: 'Dim UI' },
          ].map((theme) => (
            <OptionCard
              key={theme.value}
              selected={settings.customization?.theme === theme.value}
              onClick={() => onUpdateCustomization('theme', theme.value)}
            >
              <ThemePreview themeType={theme.value} selected={settings.customization?.theme === theme.value}>
                {theme.icon}
              </ThemePreview>
              <OptionTitle>{theme.label}</OptionTitle>
              <OptionSubtitle selected={settings.customization?.theme === theme.value}>
                {theme.subtitle}
              </OptionSubtitle>
            </OptionCard>
          ))}
        </OptionsGrid>
      </motion.div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div variants={staggerItem}>
        <StepTitle>{currentStepCopy.title}</StepTitle>
        <StepDescription>{currentStepCopy.description}</StepDescription>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        {providerOptions.map((provider) => (
          <motion.div key={provider.id} variants={staggerItem}>
            <div style={{ marginBottom: '20px' }}>
              <ProviderCard
                selected={settings.modelType === provider.id}
                onClick={() => onUpdateSettings({ modelType: provider.id })}
              >
              <ProviderTitle>{provider.title}</ProviderTitle>
              <ProviderSubtitle selected={settings.modelType === provider.id}>
                {provider.subtitle}
              </ProviderSubtitle>
              <ProviderBody selected={settings.modelType === provider.id}>
                {provider.body}
              </ProviderBody>

              {settings.modelType === provider.id && ["openai", "gemini", "grok", "local"].includes(provider.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={FAMILY_SPRINGS.smooth}
                >
                  <ProviderDetailsCard>
                {provider.id === "openai" && (
                  <FieldGroup>
                    <FieldLabel htmlFor="onboarding-openai-key">OpenAI API key</FieldLabel>
                    <FieldInput
                      id="onboarding-openai-key"
                      type="password"
                      placeholder="sk-..."
                      value={settings.apiKey || ""}
                      onChange={(e) => onUpdateSettings({ apiKey: e.target.value })}
                    />
                    <FieldHelper>
                      Required to use OpenAI models. Get your key from
                      {" "}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--popup-primary)", textDecoration: "none" }}
                      >
                        OpenAI Platform
                      </a>
                      .
                    </FieldHelper>
                  </FieldGroup>
                )}

                {provider.id === "gemini" && (
                  <FieldGroup>
                    <FieldLabel htmlFor="onboarding-gemini-key">Gemini API key</FieldLabel>
                    <FieldInput
                      id="onboarding-gemini-key"
                      type="password"
                      placeholder="AIz..."
                      value={settings.geminiApiKey || ""}
                      onChange={(e) => onUpdateSettings({ geminiApiKey: e.target.value })}
                    />
                    <FieldHelper>
                      Provide your Google AI Studio key. Create one at
                      {" "}
                      <a
                        href="https://ai.google.dev/gemini-api/docs/api-key"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--popup-primary)", textDecoration: "none" }}
                      >
                        Google AI Studio
                      </a>
                      .
                    </FieldHelper>
                  </FieldGroup>
                )}

                {provider.id === "grok" && (
                  <FieldGroup>
                    <FieldLabel htmlFor="onboarding-xai-key">xAI API key</FieldLabel>
                    <FieldInput
                      id="onboarding-xai-key"
                      type="password"
                      placeholder="xai-..."
                      value={settings.xaiApiKey || ""}
                      onChange={(e) => onUpdateSettings({ xaiApiKey: e.target.value })}
                    />
                    <FieldHelper>
                      Use your personal xAI key. Request access via
                      {" "}
                      <a
                        href="https://x.ai/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--popup-primary)", textDecoration: "none" }}
                      >
                        xAI API portal
                      </a>
                      .
                    </FieldHelper>
                  </FieldGroup>
                )}

                {provider.id === "local" && (
                  <>
                    <FieldGroup>
                      <FieldLabel htmlFor="onboarding-local-url">Local server URL</FieldLabel>
                      <FieldInput
                        id="onboarding-local-url"
                        type="text"
                        placeholder="http://localhost:11434"
                        value={settings.serverUrl || ""}
                        onChange={(e) => onUpdateSettings({ serverUrl: e.target.value })}
                      />
                      <FieldHelper>
                        Point to your self-hosted endpoint. Follow the
                        {" "}
                        <a
                          href="https://docs.ollama.ai/getting-started/installation"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--popup-primary)", textDecoration: "none" }}
                        >
                          Ollama setup guide
                        </a>
                        {" "}
                        or your provider’s instructions.
                      </FieldHelper>
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel htmlFor="onboarding-local-model">Model name</FieldLabel>
                      <FieldInput
                        id="onboarding-local-model"
                        type="text"
                        placeholder="llama-3.2-3b-instruct"
                        value={settings.localModel || ""}
                        onChange={(e) => onUpdateSettings({ localModel: e.target.value })}
                      />
                      <FieldHelper>
                        Use the exact model identifier. Browse available models on
                        {" "}
                        <a
                          href="https://docs.ollama.ai/models"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--popup-primary)", textDecoration: "none" }}
                        >
                          Ollama’s model catalog
                        </a>
                        .
                      </FieldHelper>
                    </FieldGroup>
                  </>
                )}
              </ProviderDetailsCard>
                </motion.div>
              )}
            </ProviderCard>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div variants={staggerItem}>
        <StepTitle>{currentStepCopy.title}</StepTitle>
        <StepDescription>{currentStepCopy.description}</StepDescription>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <ToggleList>
          {toggleOptions.map((toggle) => (
            <motion.div key={toggle.key} variants={staggerItem}>
              <ToggleRow active={!!settings.customization?.[toggle.key]}>
                <ToggleInfo>
                  <ToggleLabel>{toggle.label}</ToggleLabel>
                  <ToggleDescription>{toggle.description}</ToggleDescription>
                </ToggleInfo>
                <Toggle>
                  <ToggleInput
                    type="checkbox"
                    checked={!!settings.customization?.[toggle.key]}
                    onChange={(e) => onUpdateCustomization(toggle.key, e.target.checked)}
                  />
                  <ToggleSlider />
                </Toggle>
              </ToggleRow>
            </motion.div>
          ))}

          <motion.div variants={staggerItem}>
            <ToggleRow active={!!settings.customization?.quickView}>
              <ToggleInfo>
                <ToggleLabel>Instant AI tray</ToggleLabel>
                <ToggleDescription>
                  Pin inline answers right on the page.
                </ToggleDescription>
              </ToggleInfo>
              <Toggle>
                <ToggleInput
                  type="checkbox"
                  checked={!!settings.customization?.quickView}
                  onChange={(e) => onUpdateCustomization("quickView", e.target.checked)}
                />
                <ToggleSlider />
              </Toggle>
            </ToggleRow>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ToggleRow active={settings.customization?.showTextSelectionButton !== false}>
              <ToggleInfo>
                <ToggleLabel>Keep selection bubble</ToggleLabel>
                <ToggleDescription>Keep the floating action bubble near highlights.</ToggleDescription>
              </ToggleInfo>
              <Toggle>
                <ToggleInput
                  type="checkbox"
                  checked={settings.customization?.showTextSelectionButton !== false}
                  onChange={(e) => onUpdateCustomization("showTextSelectionButton", e.target.checked)}
                />
                <ToggleSlider />
              </Toggle>
            </ToggleRow>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ToggleRow active={!!settings.customization?.persistHighlight}>
              <ToggleInfo>
                <ToggleLabel>Keep highlighted text</ToggleLabel>
                <ToggleDescription>
                  Leave highlights until you clear them.
                </ToggleDescription>
              </ToggleInfo>
              <Toggle>
                <ToggleInput
                  type="checkbox"
                  checked={!!settings.customization?.persistHighlight}
                  onChange={(e) => onUpdateCustomization("persistHighlight", e.target.checked)}
                />
                <ToggleSlider />
              </Toggle>
            </ToggleRow>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ToggleRow active={settings.customization?.showWebsiteInfo !== false}>
              <ToggleInfo>
                <ToggleLabel>Show website info</ToggleLabel>
                <ToggleDescription>
                  Display website favicon and title in popup.
                </ToggleDescription>
              </ToggleInfo>
              <Toggle>
                <ToggleInput
                  type="checkbox"
                  checked={settings.customization?.showWebsiteInfo !== false}
                  onChange={(e) => onUpdateCustomization("showWebsiteInfo", e.target.checked)}
                />
                <ToggleSlider />
              </Toggle>
            </ToggleRow>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ToggleRow active={!!settings.customization?.radicallyFocus}>
              <ToggleInfo>
                <ToggleLabel>Distraction-Free Mode</ToggleLabel>
                <ToggleDescription>
                  Blur background when viewing results for better focus.
                </ToggleDescription>
              </ToggleInfo>
              <Toggle>
                <ToggleInput
                  type="checkbox"
                  checked={!!settings.customization?.radicallyFocus}
                  onChange={(e) => onUpdateCustomization("radicallyFocus", e.target.checked)}
                />
                <ToggleSlider />
              </Toggle>
            </ToggleRow>
          </motion.div>
        </ToggleList>

        <motion.div variants={staggerItem} style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <ToggleLabel style={{ fontSize: "14px" }}>Layout mode</ToggleLabel>
          <div style={{ display: "flex", gap: "12px" }}>
            {["floating", "sidebar", "centered"].map((mode) => (
              <ProviderCard
                key={mode}
                selected={settings.customization?.layoutMode === mode}
                onClick={() => onUpdateCustomization("layoutMode", mode)}
              >
                <ProviderTitle style={{ fontSize: "13px" }}>
                  {mode === "floating" ? "Floating" : mode === "sidebar" ? "Sidebar" : "Centered"}
                </ProviderTitle>
                <ProviderBody selected={settings.customization?.layoutMode === mode}>
                  {mode === "floating" && "Popover near your selection."}
                  {mode === "sidebar" && "Pinned to the page edge."}
                  {mode === "centered" && "Modal focus in the center."}
                </ProviderBody>
              </ProviderCard>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  const renderStep4 = () => {
    const selectedProvider = providerOptions.find(p => p.id === settings.modelType);
    const selectedLang = supportedLanguages.find(l => l.code === locale);
    const enabledToggles = toggleOptions.filter(t => settings.customization?.[t.key]);

    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <ReviewList>
          <motion.div variants={staggerItem}>
            <ReviewSection>
              <ReviewLabel>Language & Theme</ReviewLabel>
              <ReviewValue>
                {selectedLang?.nativeName || 'English'} • {settings.customization?.theme || 'System'} theme
              </ReviewValue>
            </ReviewSection>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ReviewSection>
              <ReviewLabel>AI Provider</ReviewLabel>
              <ReviewValue>{selectedProvider?.title || 'LightUp Basic'}</ReviewValue>
            </ReviewSection>
          </motion.div>

          <motion.div variants={staggerItem}>
            <ReviewSection>
              <ReviewLabel>Enabled Features</ReviewLabel>
              <ReviewValue>
                {enabledToggles.length > 0 
                  ? enabledToggles.map(t => t.label).join(', ')
                  : 'None selected'}
              </ReviewValue>
            </ReviewSection>
            <div style={{ fontSize: '13px', color: 'var(--popup-secondary-text)', marginTop: '8px' }}>
              You can always change these settings later in the options page.
            </div>
          </motion.div>
        </ReviewList>
      </motion.div>
    );
  };

  const renderStepContent = () => {
    const transition = {
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      transition: getSafeTransition(FAMILY_SPRINGS.smooth)
    };
    
    const enter = {
      x: 0,
      opacity: 1,
      transition: getSafeTransition(FAMILY_SPRINGS.smooth)
    };

    const exit = {
      x: direction > 0 ? -20 : 20,
      opacity: 0,
      transition: getSafeTransition(FAMILY_SPRINGS.instant)
    };

    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <Overlay data-theme={settings.customization?.theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.customization?.theme || 'dark'}>
        <MotionWizardContainer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={getSafeTransition(FAMILY_SPRINGS.smooth)}
        >
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <div style={{ color: 'var(--popup-secondary-text)' }}>Loading...</div>
          </div>
        </MotionWizardContainer>
      </Overlay>
    );
  }

  const currentTheme = settings.customization?.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.customization?.theme || 'dark';

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
      transition: getSafeTransition(FAMILY_SPRINGS.smooth)
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: getSafeTransition(FAMILY_SPRINGS.smooth)
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -20 : 20,
      opacity: 0,
      transition: getSafeTransition(FAMILY_SPRINGS.instant)
    })
  };

  return (
    <Overlay data-theme={currentTheme}>
      <MotionWizardContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getSafeTransition(FAMILY_SPRINGS.smooth)}
        layout
      >
        <Header>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={getSafeTransition(FAMILY_SPRINGS.smooth)}
          >
            <LogoImage src={logoUrl} alt="LightUp" />
            <Title>Welcome to LightUp</Title>
            <Subtitle>Let's get you set up in just a few steps</Subtitle>
          </motion.div>
          
          <ProgressContainer>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ width: '8px' }}
                animate={{ width: i + 1 === step ? '20px' : '8px' }}
                transition={getSafeTransition(FAMILY_SPRINGS.smooth)}
              >
                <ProgressDot 
                  active={i + 1 === step} 
                  completed={i + 1 < step} 
                />
              </motion.div>
            ))}
          </ProgressContainer>
          <StepIndicator>Step {step} of {totalSteps}</StepIndicator>
        </Header>

        <Content>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </Content>

        <Footer>
          <MotionButton
            onClick={onSkip}
          >
            Skip setup
          </MotionButton>
          
          <ButtonColumn>
            <ButtonGroup>
              {step > 1 && (
                <MotionButton
                  variant="secondary"
                  onClick={onBack}
                >
                  ← Back
                </MotionButton>
              )}
              
              {step < totalSteps ? (
                <MotionButton
                  variant="primary"
                  onClick={onNext}
                >
                  Next →
                </MotionButton>
              ) : (
                <MotionCompleteButton
                  onClick={onComplete}
                  disabled={isCompleting}
                >
                  {isCompleting ? 'Finishing...' : 'Finish setup'}
                </MotionCompleteButton>
              )}
            </ButtonGroup>
          </ButtonColumn>
        </Footer>
      </MotionWizardContainer>
    </Overlay>
  );
};

export default OnboardingWizard;
