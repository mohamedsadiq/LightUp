# Radix UI Component Mapping

## Overview
This document maps current custom components to Radix UI primitives and provides implementation examples.

---

## Component Mapping Table

### Toggle/Switch Components

| Current Component | Radix UI Primitive | Status | Priority |
|-------------------|-------------------|--------|----------|
| ToggleContainer | @radix-ui/react-switch.Root | Pending | High |
| ToggleInput | @radix-ui/react-switch.Root | Pending | High |
| ToggleSlider | @radix-ui/react-switch.Thumb | Pending | High |
| Switch | @radix-ui/react-switch | Pending | High |

### Separator Components

| Current Component | Radix UI Primitive | Status | Priority |
|-------------------|-------------------|--------|----------|
| SidebarDivider | @radix-ui/react-separator | Pending | High |
| SectionDivider | @radix-ui/react-separator | Pending | High |

### Select Components

| Current Component | Radix UI Primitive | Status | Priority |
|-------------------|-------------------|--------|----------|
| Select | @radix-ui/react-select | Pending | High |
| FormSelect | @radix-ui/react-select | Pending | High |

### Radio Group Components

| Current Component | Radix UI Primitive | Status | Priority |
|-------------------|-------------------|--------|----------|
| RadioGroup | @radix-ui/react-radio-group | Pending | High |
| RadioLabel | @radix-ui/react-radio-group.Item | Pending | High |
| RadioInput | @radix-ui/react-radio-group.Item | Pending | High |
| RadioText | @radix-ui/react-radio-group.Item | Pending | High |
| ProviderCard | @radix-ui/react-radio-group.Item | Pending | Medium |
| ModelOptionCard | @radix-ui/react-radio-group.Item | Pending | Medium |

### Badge Components

| Current Component | Radix UI Primitive | Status | Priority |
|-------------------|-------------------|--------|----------|
| BadgeContainer | Custom (no Radix equivalent) | Keep | - |
| Badge | Custom (no Radix equivalent) | Keep | - |

### Dialog Components

| Current Component | Radix UI Primitive | Status | Priority |
|-------------------|-------------------|--------|----------|
| DisabledOverlay | @radix-ui/react-dialog.Overlay | Pending | Low |

### Dropdown Components

| Current Component | Radix UI Primitive | Status | Priority |
|-------------------|-------------------|--------|----------|
| (Future use) | @radix-ui/react-dropdown-menu | Available | - |

---

## Implementation Examples

### 1. Switch/Toggle Component

**Before (Popup):**
```tsx
const ToggleContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 22px;
  cursor: pointer;
`;

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
`;

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
`;
```

**After (with Radix UI):**
```tsx
import * as Switch from "@radix-ui/react-switch";

const StyledSwitch = styled(Switch.Root)`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 22px;
  cursor: pointer;
  background-color: ${theme.toggle.track};
  border-radius: 34px;
  transition: 0.3s;
  
  &[data-state="checked"] {
    background-color: ${theme.toggle.active};
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.primary};
    outline-offset: 2px;
  }
`;

const StyledSwitchThumb = styled(Switch.Thumb)`
  position: absolute;
  display: block;
  width: 16px;
  height: 16px;
  top: 3px;
  left: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  
  &[data-state="checked"] {
    transform: translateX(24px);
  }
`;

// Usage:
<StyledSwitch
  checked={isEnabled}
  onCheckedChange={handleEnabledChange}
  aria-label="Toggle extension"
>
  <StyledSwitchThumb />
</StyledSwitch>
```

---

### 2. Separator Component

**Before:**
```tsx
const SidebarDivider = styled.div`
  height: 1px;
  background: ${theme.divider};
  margin: 16px 12px;
  opacity: 0.3;
`;
```

**After (with Radix UI):**
```tsx
import * as Separator from "@radix-ui/react-separator";

const StyledSeparator = styled(Separator.Root)`
  height: 1px;
  background: ${theme.divider};
  margin: 16px 12px;
  opacity: 0.3;
`;

// Usage:
<StyledSeparator orientation="horizontal" />
```

---

### 3. Select Component

**Before:**
```tsx
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
`;
```

**After (with Radix UI):**
```tsx
import * as Select from "@radix-ui/react-select";

const StyledSelectTrigger = styled(Select.Trigger)`
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
  
  &:focus {
    outline: none;
    border-color: ${theme.primary};
  }
  
  &[data-state="open"] {
    border-color: ${theme.primary};
  }
`;

const StyledSelectContent = styled(Select.Content)`
  background-color: ${theme.card};
  border: 1px solid ${theme.border};
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const StyledSelectItem = styled(Select.Item)`
  padding: 8px 12px;
  font-size: 14px;
  color: ${theme.foreground};
  cursor: pointer;
  transition: background-color 0.15s;
  
  &[data-highlighted] {
    background-color: ${theme.cardHover};
  }
  
  &[data-state="checked"] {
    background-color: ${theme.sidebarActive};
  }
`;

const StyledSelectArrow = styled(Select.Icon)`
  color: ${theme.foreground};
`;

// Usage:
<Select.Root value={value} onValueChange={onChange}>
  <StyledSelectTrigger aria-label="Select option">
    <Select.Value />
    <StyledSelectArrow>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </StyledSelectArrow>
  </StyledSelectTrigger>
  <Select.Portal>
    <StyledSelectContent>
      <Select.Viewport>
        <Select.Group>
          {options.map(option => (
            <StyledSelectItem key={option.value} value={option.value}>
              {option.label}
            </StyledSelectItem>
          ))}
        </Select.Group>
      </Select.Viewport>
    </StyledSelectContent>
  </Select.Portal>
</Select.Root>
```

---

### 4. Radio Group Component

**Before:**
```tsx
const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background: var(--popup-sidebar-active);
  }
`;

const RadioInput = styled.input`
  margin-right: 10px;
`;

const RadioText = styled.span`
  font-size: 16px;
`;
```

**After (with Radix UI):**
```tsx
import * as RadioGroup from "@radix-ui/react-radio-group";

const StyledRadioGroup = styled(RadioGroup.Root)`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StyledRadioItem = styled(RadioGroup.Item)`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  background: transparent;
  border: none;
  color: ${theme.foreground};
  
  &:hover {
    background: var(--popup-sidebar-active);
  }
  
  &:focus-visible {
    outline: 2px solid ${theme.primary};
    outline-offset: 2px;
  }
`;

const StyledRadioIndicator = styled(RadioGroup.Indicator)`
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
`;

const StyledRadioText = styled.span`
  font-size: 16px;
  margin-left: 10px;
`;

// Usage:
<StyledRadioGroup value={value} onValueChange={onChange} aria-label="Select option">
  {options.map(option => (
    <StyledRadioItem key={option.value} value={option.value}>
      <RadioGroup.Indicator asChild>
        <StyledRadioIndicator />
      </RadioGroup.Indicator>
      <StyledRadioText>{option.label}</StyledRadioText>
    </StyledRadioItem>
  ))}
</StyledRadioGroup>
```

---

### 5. Provider Card with Radio Group

**Before:**
```tsx
const ProviderCard = styled.button<{ selected: boolean }>`
  background: transparent;
  color: ${theme.foreground};
  border: 1px solid ${props => (props.selected ? theme.accent : theme.border)};
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
`;
```

**After (with Radix UI):**
```tsx
import * as RadioGroup from "@radix-ui/react-radio-group";

const StyledProviderItem = styled(RadioGroup.Item)`
  background: transparent;
  color: ${theme.foreground};
  border: 1px solid ${props => props.selected ? theme.accent : theme.border};
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

  &[data-state="checked"] {
    border-color: ${theme.accent};
  }

  &:hover {
    border-color: ${theme.accent};
  }

  &:focus-visible {
    outline: 2px solid ${theme.primary};
    outline-offset: 2px;
  }
`;

const ProviderCheckBadge = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  color: ${theme.accent};
`;

// Usage:
<RadioGroup.Root value={selectedProvider} onValueChange={setSelectedProvider}>
  <StyledProviderItem value="basic">
    {selectedProvider === "basic" && (
      <ProviderCheckBadge>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17L4 12"/>
        </svg>
      </ProviderCheckBadge>
    )}
    {/* Provider content */}
  </StyledProviderItem>
</RadioGroup.Root>
```

---

## Migration Checklist

### Phase 1: Simple Components
- [ ] Switch/Toggle (Popup)
- [ ] Switch/Toggle (Options)
- [ ] Separator (Popup)
- [ ] Separator (Options)

### Phase 2: Form Components
- [ ] Select (Popup)
- [ ] Select (Options)
- [ ] Radio Group (Popup)
- [ ] Radio Group (Options)

### Phase 3: Complex Components
- [ ] Provider selection cards
- [ ] Model selection cards
- [ ] Form validation components

### Phase 4: Testing
- [ ] Visual regression testing
- [ ] Keyboard navigation testing
- [ ] Screen reader testing
- [ ] Cross-browser testing

---

## Notes

### Theme Integration
- All Radix components will use the existing `theme` object
- CSS variables will be preserved
- No changes to existing theme definitions

### Accessibility Improvements
- Radix provides ARIA attributes automatically
- Keyboard navigation built-in
- Focus management handled
- Screen reader announcements included

### Bundle Size
- Radix components are tree-shakeable
- Only used components will be included
- Estimated additional size: ~15-25KB gzipped

### Browser Support
- Radix UI supports modern browsers
- No polyfills needed for current browser support
- Graceful degradation for older browsers

---

## Next Steps

1. ✅ Install Radix UI dependencies
2. ✅ Create component mapping document
3. ⏳ Migrate Switch/Toggle components
4. ⏳ Migrate Separator components
5. ⏳ Migrate Select components
6. ⏳ Migrate Radio Group components
7. ⏳ Test each migration
8. ⏳ Document patterns
9. ⏳ Final optimization
