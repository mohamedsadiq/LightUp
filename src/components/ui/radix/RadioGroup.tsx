import * as RadioGroup from "@radix-ui/react-radio-group"
import styled from "@emotion/styled"

const theme = {
  foreground: "var(--popup-fg)",
  primary: "var(--popup-primary)",
  toggle: {
    active: "var(--popup-toggle-active)"
  },
  sidebarActive: "var(--popup-sidebar-active)"
}

export const StyledRadioGroup = styled(RadioGroup.Root)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const StyledRadioItem = styled(RadioGroup.Item)`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: ${theme.foreground};
  font-size: 16px;
  
  &:hover {
    background: ${theme.sidebarActive};
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.primary};
    outline-offset: 2px;
  }
`

export const StyledRadioIndicator = styled(RadioGroup.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${theme.toggle.active};
  
  &::after {
    content: "";
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: white;
  }
`

export const StyledRadioText = styled.span`
  font-size: 16px;
  margin-left: 10px;
`

interface RadioOption {
  value: string
  label: string
}

interface RadioGroupProps {
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  ariaLabel?: string
}

export const RadioGroupComponent = ({
  value,
  onChange,
  options,
  ariaLabel = "Select option"
}: RadioGroupProps) => (
  <StyledRadioGroup value={value} onValueChange={onChange} aria-label={ariaLabel}>
    {options.map((option) => (
      <StyledRadioItem key={option.value} value={option.value}>
        <RadioGroup.Indicator asChild>
          <StyledRadioIndicator />
        </RadioGroup.Indicator>
        <StyledRadioText>{option.label}</StyledRadioText>
      </StyledRadioItem>
    ))}
  </StyledRadioGroup>
)
