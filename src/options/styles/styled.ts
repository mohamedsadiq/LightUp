import { css } from "@emotion/react"
import styled from "@emotion/styled"

import { theme } from "./theme"

export const FormRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  min-height: 40px;
  gap: 16px;

  > div:first-child {
    flex: 1;
    min-width: 0;
  }

  > div:last-child {
    flex-shrink: 0;
  }
`

export const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${theme.foreground};
  display: block;
  letter-spacing: -0.01em;
  line-height: 1.3;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const Description = styled.p`
  font-size: 12px;
  color: ${theme.secondaryText};
  margin: 3px 0 0 0;
  line-height: 1.5;
  letter-spacing: -0.01em;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const ProviderCard = styled.button<{ selected: boolean }>`
  background: transparent;
  color: ${theme.foreground};
  border: 1px solid
    ${(props) => (props.selected ? theme.accent : theme.border)};
  border-radius: 8px;
  padding: 18px 20px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;

  &:hover {
    border-color: ${theme.accent};
  }

  &:focus-visible {
    outline: 2px solid ${theme.primary};
    outline-offset: 2px;
  }
`

export const ProviderIconWrapper = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
`

export const ProviderCheckBadge = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  color: ${theme.accent};
`

export const ProviderContent = styled.div`
  flex: 1;
  min-width: 0;
`

export const ProviderTitle = styled.div<{ selected: boolean }>`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: ${theme.foreground};
  line-height: 1.3;
  letter-spacing: -0.01em;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const ProviderSubtitle = styled.div`
  font-size: 14px;
  color: ${theme.secondaryText};
  margin-bottom: 6px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.01em;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const ProviderBody = styled.div`
  font-size: 14px;
  color: ${theme.secondaryText};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.01em;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const ProviderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 8px;
  margin-top: 8px;
`

export const CardContainer = styled.div`
  border-radius: 8px;
  padding: 0 20px;
  margin-bottom: 16px;
  background-color: ${theme.background};
`

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`

export const CardIcon = styled.div`
  margin-right: 12px;
  color: ${theme.foreground};
  svg {
    color: ${theme.foreground};
  }
`

export const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${theme.foreground};
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
  line-height: 1.3;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const BadgeContainer = styled.span<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${theme.card};
  color: ${theme.foreground};

  ${(props) => {
    switch (props.variant) {
      case "success":
        return css`
          background-color: rgba(45, 202, 110, 0.14);
          color: ${theme.validation.success};
        `
      case "warning":
        return css`
          background-color: rgba(255, 165, 0, 0.14);
          color: ${theme.validation.warning};
        `
      case "danger":
        return css`
          background-color: rgba(239, 68, 68, 0.14);
          color: ${theme.validation.error};
        `
      case "info":
        return css`
          background-color: rgba(0, 120, 212, 0.14);
          color: ${theme.primary};
        `
      default:
        return css``
    }
  }}
`

export const ModelOptionCard = styled.button<{ selected: boolean }>`
  display: flex;
  align-items: flex-start;
  padding: 18px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: transparent;
  border: 1px solid
    ${(props) => (props.selected ? theme.accent : theme.border)};
  color: ${theme.foreground};
  text-align: left;
  width: 100%;
  position: relative;

  &:hover {
    border-color: ${theme.accent};
  }

  &:focus-visible {
    outline: 2px solid ${theme.primary};
    outline-offset: 2px;
  }
`

export const ModelContentContainer = styled.div`
  flex: 1;
`

export const ModelTitle = styled.p<{ selected: boolean }>`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: ${theme.foreground};
  letter-spacing: -0.01em;
  line-height: 1.3;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const ModelDescription = styled.p`
  font-size: 13px;
  margin: 0 0 6px 0;
  line-height: 1.5;
  color: ${theme.secondaryText};
  letter-spacing: -0.01em;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const ModelMetadata = styled.p`
  font-size: 12px;
  font-weight: 500;
  margin: 0;
  color: ${theme.secondaryText};
  letter-spacing: -0.01em;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const ModelCheckBadge = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  color: ${theme.accent};
`

export const FormGroup = styled.div`
  margin-bottom: 14px;
`

export const FormLabel = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${theme.foreground};
  margin-bottom: 6px;
  letter-spacing: -0.01em;
  line-height: 1.3;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const FormDescription = styled.p`
  font-size: 12px;
  color: ${theme.secondaryText};
  margin: 3px 0 0 0;
  line-height: 1.5;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const SearchInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  background-color: ${theme.input.background};
  color: ${theme.foreground};
  border: 1px solid ${theme.input.border};
  border-radius: 8px;
  font-size: 14px;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.2s ease;
  margin-bottom: 12px;

  &:focus {
    outline: none;
    border-color: ${theme.primary};
    box-shadow: 0 0 0 2px ${theme.primary}22;
  }

  &::placeholder {
    color: ${theme.secondaryText};
  }
`

export const FormInput = styled.input`
  background-color: ${theme.input.background};
  color: ${theme.foreground};
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${theme.input.border};
  font-size: 14px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${theme.input.focusBorder};
  }

  &::placeholder {
    color: ${theme.input.placeholder};
  }
`

export const ValidationStatus = styled.div<{
  isValid?: boolean
  isValidating?: boolean
}>`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;

  ${(props) =>
    props.isValidating &&
    `
    color: ${theme.validation.warning};
  `}

  ${(props) =>
    props.isValid === true &&
    `
    color: ${theme.validation.success};
  `}
  
  ${(props) =>
    props.isValid === false &&
    `
    color: ${theme.validation.error};
  `}
`

export const ValidationIcon = styled.div<{
  isValid?: boolean
  isValidating?: boolean
}>`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const ApiKeyInput = styled(FormInput)<{
  hasValidation?: boolean
  isValid?: boolean
}>`
  ${(props) =>
    props.hasValidation &&
    props.isValid === true &&
    `
    border-color: ${theme.validation.success};
  `}

  ${(props) =>
    props.hasValidation &&
    props.isValid === false &&
    `
    border-color: ${theme.validation.error};
  `}
`

export const FormTextarea = styled.textarea`
  background-color: ${theme.background};
  color: ${theme.foreground};
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid ${theme.border};
  font-size: 16px;
  width: 100%;
  resize: vertical;
  min-height: 120px;
  font-family: "Roboto", sans-serif;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: ${theme.primary};
  }
`

export const SectionHeader = styled.h4`
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  margin-top: 18px;
  color: ${theme.foreground};
  letter-spacing: -0.01em;
  line-height: 1.3;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const SectionContainer = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const SubContainer = styled.div`
  background-color: transparent;
  border-radius: 6px;
  padding: 14px;
  margin-bottom: 12px;
`

export const StyledPromptDisplay = styled.div`
  margin-top: 8px;
  padding: 12px;
  background-color: ${theme.subcontainer.background};
  border: 1px solid ${theme.subcontainer.border};
  border-radius: 6px;
  font-family: "Roboto Mono", monospace;
  font-size: 13px;
  color: ${theme.foreground};
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 180px;
  overflow-y: auto;
  line-height: 1.4;
`

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

export const OptionsContainer = styled.div`
  width: 100vw;
  height: 100vh; // Use 100vh to fill the viewport height
  max-height: unset; // Remove max-height constraint
  background: ${theme.background}; // Match popup background
  color: ${theme.foreground};
  overflow: hidden; // Prevents the whole container from scrolling
  position: fixed; // Force fixed positioning to ignore any parent margins
  top: 0;
  left: 0;
  margin: 0 !important;
  padding: 0 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
`

export const Header = styled.header`
  ${flexBetween};
  padding: 12px 18px;
  background: ${theme.headerBackground};
  border-bottom: 1px solid ${theme.border};
  height: 70px;
`

export const HeaderTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: ${theme.foreground};
  letter-spacing: -0.01em;
  line-height: 1.3;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  display: flex;
  align-items: center;
`

export const HeaderLogoWrapper = styled.div`
  display: flex;
  align-items: center;
`

export const VersionBadgeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 12px;
`

export const BetaBadge = styled.span`
  position: relative;
  background: ${theme.badge.background};
  color: ${theme.foreground};
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.7px;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    padding: 1px;
    background: ${theme.badge.border};
    -webkit-mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
`

export const VersionNumber = styled.span`
  color: ${theme.version.color};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.5px;
  background: ${theme.version.background};
  padding: 3px 8px;
  border-radius: 7px;
  border: 1px solid ${theme.version.border};
`

export const LogoImage = styled.img`
  height: 3rem;
  width: 3rem;
  margin-right: 0.4rem;
  border-radius: 8px;
`

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${theme.foreground};
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;

  &:hover {
    background: ${theme.sidebarActive};
  }
`

export const Button = styled.button<{
  variant?: "primary" | "secondary" | "destructive"
  disabled?: boolean
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};

  ${(props) => {
    switch (props.variant) {
      case "destructive":
        return `
          background-color: ${theme.destructive};
          color: ${theme.foreground};
          &:hover {
            background-color: ${props.disabled ? theme.destructive : theme.destructiveHover};
          }
        `
      case "secondary":
        return `
          background-color: ${theme.button.default};
          color: ${theme.button.text};
          border: 1px solid ${theme.border};
          &:hover {
            background-color: ${props.disabled ? theme.button.default : theme.button.defaultHover};
          }
        `
      case "primary":
      default:
        return `
          background-color: ${theme.primary};
          color: ${theme.button.text};
          &:hover {
            background-color: ${props.disabled ? theme.primary : theme.primaryHover};
          }
        `
    }
  }}

  svg {
    width: 16px;
    height: 16px;
  }
`

export const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  padding: 22px 14px 0 14px;
  column-gap: 20px;
  overflow: hidden; // Prevents the wrapper itself from scrolling
`

export const Sidebar = styled.nav`
  width: 180px;
  background: ${theme.sidebar};
  padding: 0;
  flex-shrink: 0;
  border-right: 1px solid ${theme.border};
  padding-right: 14px;
`

export const SidebarItem = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 14px;
  background: ${(props) =>
    props.active ? theme.sidebarActive : "transparent"};
  border: none;
  color: ${(props) =>
    props.active ? theme.sidebarTextActive : theme.sidebarText};
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 3px;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.active ? theme.sidebarActive : theme.sidebarActive};
    color: ${theme.sidebarTextActive};
  }
`

export const SidebarIcon = styled.div`
  width: 16px;
  height: 16px;
  margin-right: 8px;
  opacity: 0.9;
  color: ${theme.foreground};
  ${flexCenter};

  svg {
    color: ${theme.foreground};
    stroke: currentColor;
  }
`

export const SidebarDivider = styled.div`
  height: 1px;
  background: ${theme.border};
  margin: 12px 10px;
  opacity: 0.3;
`

export const ContentArea = styled.div`
  flex: 1;
  padding: 8px 32px;
  background: ${theme.content};
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 48px;
`

export const Section = styled.section`
  margin-bottom: 16px;
`

export const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: ${theme.foreground};
  letter-spacing: -0.01em;
  line-height: 1.3;
  font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`

export const SectionDivider = styled.div`
  height: 1px;
  background: ${theme.border};
  margin: 0;
  width: 100%;
`

export const ThemeButton = styled.button<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 2px solid ${(props) => (props.selected ? theme.accent : theme.border)};
  color: ${theme.foreground};
  border-radius: 8px;
  padding: 12px;
  min-width: 100px;
  cursor: pointer;
  transition: all 0.15s ease;

  ${props => props.selected && `
    background: ${theme.subcontainer.background};
  `}

  &:hover {
    background-color: ${theme.subcontainer.background};
    border-color: ${(props) => (props.selected ? theme.accent : theme.primary)};
  }

  div {
    margin-top: 6px;
    font-size: 13px;
    font-weight: 500;
  }
`

export const ThemeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
`

export const ColorButton = styled.button<{ color: string; selected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.selected ? theme.accent : theme.border)};
  background-color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  outline: none;

  &:hover {
    border-color: ${theme.primary};
  }

  svg {
    opacity: ${(props) => (props.selected ? 1 : 0)};
    width: 14px;
    height: 14px;
    position: absolute;
    top: 3px;
    right: 3px;
    color: ${theme.accent};
  }
`

export const SaveButton = styled.button<{ success?: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  color: ${theme.button.text};
  background-color: ${(props) =>
    props.success
      ? theme.accent
      : props.disabled
        ? theme.button.default
        : theme.primary};
  border: none;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};

  &:hover {
    background-color: ${(props) =>
      props.success
        ? theme.accent
        : props.disabled
          ? theme.button.default
          : theme.primaryHover};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

export const FontSizeButton = styled.button<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: 2px solid ${(props) => (props.selected ? theme.accent : theme.border)};
  color: ${theme.foreground};
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 90px;
  cursor: pointer;
  transition: all 0.15s ease;

  ${props => props.selected && `
    background: ${theme.subcontainer.background};
  `}

  &:hover {
    background-color: ${theme.subcontainer.background};
    border-color: ${(props) => (props.selected ? theme.accent : theme.primary)};
  }

  .size-preview {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .size-label {
    font-size: 12px;
  }
`

export const LayoutButton = styled.button<{ selected?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid ${(props) => (props.selected ? theme.accent : theme.border)};
  color: ${theme.foreground};
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 130px;

  ${props => props.selected && `
    background: ${theme.subcontainer.background};
  `}

  .layout-icon {
    margin-bottom: 6px;
  }

  .layout-label {
    font-size: 13px;
    font-weight: 500;
  }

  &:hover {
    background: ${theme.subcontainer.background};
    border-color: ${(props) => (props.selected ? theme.accent : theme.border)};
  }
`

export const ActionButton = styled.button<{ selected?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid ${(props) => (props.selected ? theme.accent : theme.border)};
  color: ${theme.foreground};
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 85px;
  min-height: 85px;

  ${props => props.selected && `
    background: ${theme.subcontainer.background};
  `}

  &:hover {
    background: ${theme.subcontainer.background};
    border-color: ${(props) => (props.selected ? theme.accent : theme.border)};
  }
`
