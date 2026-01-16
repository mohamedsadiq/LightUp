import * as Select from "@radix-ui/react-select"
import styled from "@emotion/styled"

const theme = {
  select: {
    background: "var(--popup-select-bg)",
    border: "var(--popup-select-border)",
    arrow: "var(--popup-select-arrow)"
  },
  foreground: "var(--popup-fg)",
  primary: "var(--popup-primary)",
  card: "var(--popup-card)",
  cardHover: "var(--popup-card-hover)",
  sidebarActive: "var(--popup-sidebar-active)"
}

export const StyledSelectTrigger = styled(Select.Trigger)`
  background-color: ${theme.select.background};
  color: ${theme.foreground};
  padding: 6px 30px 6px 8px;
  border-radius: 4px;
  border: 1px solid ${theme.select.border};
  font-size: 15px;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${theme.primary};
  }
  
  &[data-state="open"] {
    border-color: ${theme.primary};
  }
`

export const StyledSelectContent = styled(Select.Content)`
  background-color: ${theme.card};
  border: 1px solid ${theme.select.border};
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  z-index: 1000;
`

export const StyledSelectViewport = styled(Select.Viewport)`
  padding: 4px;
`

export const StyledSelectItem = styled(Select.Item)`
  padding: 8px 12px;
  font-size: 14px;
  color: ${theme.foreground};
  cursor: pointer;
  transition: background-color 0.15s;
  border-radius: 4px;
  display: flex;
  align-items: center;
  
  &[data-highlighted] {
    background-color: ${theme.cardHover};
  }
  
  &[data-state="checked"] {
    background-color: ${theme.sidebarActive};
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.primary};
    outline-offset: 2px;
  }
`

export const StyledSelectArrow = styled(Select.Icon)`
  color: ${theme.foreground};
  margin-left: 8px;
`

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
  style?: React.CSSProperties
}

export const SelectDropdown = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  ariaLabel = "Select option",
  style
}: SelectProps) => (
  <Select.Root value={value} onValueChange={onChange}>
    <StyledSelectTrigger aria-label={ariaLabel} style={style}>
      <Select.Value placeholder={placeholder} />
      <StyledSelectArrow>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </StyledSelectArrow>
    </StyledSelectTrigger>
    <Select.Portal>
      <StyledSelectContent position="popper">
        <StyledSelectViewport>
          <Select.Group>
            {options.map((option) => (
              <StyledSelectItem key={option.value} value={option.value}>
                <Select.ItemText>{option.label}</Select.ItemText>
              </StyledSelectItem>
            ))}
          </Select.Group>
        </StyledSelectViewport>
      </StyledSelectContent>
    </Select.Portal>
  </Select.Root>
)
