import * as Switch from "@radix-ui/react-switch"
import styled from "@emotion/styled"

const theme = {
  toggle: {
    active: "var(--popup-toggle-active)",
    track: "var(--popup-toggle-track)"
  },
  primary: "var(--popup-primary)"
}

export const StyledSwitch = styled(Switch.Root)`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: 46px;
  height: 26px;
  padding: 3px;
  box-sizing: border-box;
  cursor: pointer;
  background-color: ${theme.toggle.track};
  border-radius: 34px;
  transition: 0.3s;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
  border: 0;
  &[data-state="checked"] {
    background-color: ${theme.toggle.active};
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.primary};
    outline-offset: 2px;
  }
`

export const StyledSwitchThumb = styled(Switch.Thumb)`
  position: relative;
  display: block;
  width: 16px;
  height: 16px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  
  &[data-state="checked"] {
    transform: translateX(24px);
  }
`

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  "aria-label"?: string
  id?: string
}

export const Toggle = ({ checked, onCheckedChange, "aria-label": ariaLabel, id }: SwitchProps) => (
  <StyledSwitch
    checked={checked}
    onCheckedChange={onCheckedChange}
    aria-label={ariaLabel}
    id={id}
  >
    <StyledSwitchThumb />
  </StyledSwitch>
)
