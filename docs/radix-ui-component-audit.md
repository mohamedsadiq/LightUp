# Radix UI Component Audit

## Overview
This document identifies all custom components in the Options and Popup pages that will be migrated to Radix UI primitives.

---

## Popup Page Components (`/src/popup/index.tsx`)

### Layout Components
- **PopupContainer** - Main container (750px x 600px)
- **Header** - Header section with logo and title
- **HeaderTitle** - H1 title element
- **HeaderLogoWrapper** - Logo wrapper
- **HeaderTitleGroup** - Title grouping
- **VersionBadgeRow** - Version badge container
- **ToggleStatusGroup** - Toggle status display
- **ToggleStatusLabel** - Status label
- **VersionBadgeContainer** - Version badge wrapper
- **BetaBadge** - Beta badge with gradient border
- **VersionNumber** - Version number display
- **LogoImage** - Logo image
- **CloseButton** - Close button
- **ContentWrapper** - Content wrapper
- **DisabledOverlay** - Overlay when extension disabled
- **Sidebar** - Navigation sidebar (192px)
- **SidebarItem** - Sidebar navigation item (button)
- **SidebarIcon** - Icon wrapper in sidebar
- **SidebarDivider** - Divider in sidebar
- **SidebarSectionTitle** - Section title in sidebar
- **ContentArea** - Main content area with scroll

### Section Components
- **Section** - Section container
- **SectionTitle** - H2 section title
- **SectionDivider** - Divider between sections

### Form Components
- **FormGroup** - Form group container
- **FormRow** - Row with label and control
- **Label** - Form label
- **Description** - Form description

### Toggle Components
- **ToggleContainer** - Toggle switch container
- **ToggleInput** - Hidden checkbox input
- **ToggleSlider** - Visible toggle slider

### Button Components
- **Button** - Button with variants (primary, destructive, default)

### Input Components
- **Select** - Native select dropdown
- **Input** - Text input field

### Radio Components
- **RadioGroup** - Radio button group
- **RadioLabel** - Radio button label
- **RadioInput** - Radio button input
- **RadioText** - Radio button text

### Icon Components
- **Logo** - SVG logo component

---

## Options Page Components (`/src/options/index.tsx`)

### Layout Components
- **OptionsContainer** - Full viewport container
- **Header** - Header section
- **HeaderTitle** - H1 title
- **HeaderLogoWrapper** - Logo wrapper
- **VersionBadgeContainer** - Version badge wrapper
- **BetaBadge** - Beta badge with gradient border
- **VersionNumber** - Version number display
- **LogoImage** - Logo image
- **CloseButton** - Close button

### Form Components
- **FormRow** - Row with label and control
- **Label** - Form label
- **Description** - Form description

### Toggle Components
- **ToggleContainer** - Toggle switch container
- **ToggleInput** - Hidden checkbox input
- **ToggleSlider** - Visible toggle slider
- **Switch** - Complete toggle component with label

### Provider Selection Components
- **ProviderCard** - Provider selection card (button)
- **ProviderIconWrapper** - Icon wrapper
- **ProviderCheckBadge** - Check badge for selected
- **ProviderContent** - Content area
- **ProviderTitle** - Provider title
- **ProviderSubtitle** - Provider subtitle
- **ProviderBody** - Provider description
- **ProviderGrid** - Grid layout for providers

### Card Components
- **CardContainer** - Card container
- **CardHeader** - Card header
- **CardIcon** - Card icon
- **CardTitle** - Card title
- **SettingsCard** - Complete settings card component

### Badge Components
- **BadgeContainer** - Badge container with variants
- **Badge** - Complete badge component

### Model Selection Components
- **ModelOptionCard** - Model option card (button)
- **ModelContentContainer** - Content area
- **ModelTitle** - Model title
- **ModelDescription** - Model description
- **ModelMetadata** - Model metadata (price/size)
- **ModelCheckBadge** - Check badge for selected
- **ModelOption** - Complete model option component

### Form Input Components
- **FormGroup** - Form group container
- **FormLabel** - Form label
- **FormDescription** - Form description
- **SearchInput** - Search input field
- **FormSelect** - Native select dropdown
- **FormInput** - Text input field
- **FormTextarea** - Textarea field

### Validation Components
- **ValidationStatus** - Validation status display
- **ValidationIcon** - Validation icon
- **ApiKeyInput** - API key input with validation

### Section Components
- **SectionHeader** - Section header
- **SectionContainer** - Section container
- **SubContainer** - Sub-container
- **StyledPromptDisplay** - Prompt display area

### Utility Components
- **RequiredLabel** - Required field label indicator
- **RateLimitDisplay** - Rate limit information display

---

## Radix UI Mapping

### Simple Components (Direct Replacement)
| Current Component | Radix UI Primitive | Notes |
|-------------------|-------------------|-------|
| ToggleContainer/Slider | @radix-ui/react-switch | Direct replacement |
| Switch | @radix-ui/react-switch | Direct replacement |
| FormSelect | @radix-ui/react-select | Needs trigger/content/item |
| Badge | @radix-ui/react-badge | Direct replacement |
| SidebarDivider | @radix-ui/react-separator | Direct replacement |
| SectionDivider | @radix-ui/react-separator | Direct replacement |

### Complex Components (Composition Required)
| Current Component | Radix UI Primitive | Notes |
|-------------------|-------------------|-------|
| Select | @radix-ui/react-select | Needs Trigger, Content, Item, Value |
| ProviderCard | @radix-ui/react-radio-group | Use RadioGroup + RadioItem |
| ModelOptionCard | @radix-ui/react-radio-group | Use RadioGroup + RadioItem |
| SettingsCard | No direct equivalent | Keep as styled component |
| ProviderGrid | No direct equivalent | Keep as styled component |

### No Radix Equivalent (Keep as Styled Components)
| Component | Reason |
|-----------|--------|
| PopupContainer | Layout component |
| Header | Layout component |
| Sidebar | Layout component |
| ContentArea | Layout component |
| Section | Layout component |
| FormRow | Layout component |
| FormGroup | Layout component |
| CardContainer | Layout component |
| CardHeader | Layout component |
| Logo | Icon component |
| BetaBadge | Custom gradient border |
| VersionNumber | Custom styling |
| RateLimitDisplay | Custom logic |

---

## Migration Priority

### Phase 1: Simple Components (Low Risk)
1. Toggle/Switch - Most straightforward
2. Separator - Simple divider
3. Badge - Simple badge display

### Phase 2: Form Components (Medium Risk)
1. Select - Complex but well-defined
2. Radio Group - For provider/model selection

### Phase 3: Complex Components (Higher Risk)
1. Provider selection cards
2. Model selection cards
3. Form validation components

### Phase 4: Layout Components (Low Risk)
1. Layout components don't need Radix
2. Keep as styled-components
3. Focus on accessibility attributes

---

## Styling Strategy

### Preserving Existing Styles
1. **Keep theme object** - No changes to theme definitions
2. **Wrap Radix primitives** - Apply existing styled-components
3. **Use CSS variables** - Map to existing theme values
4. **Maintain visual parity** - No visual changes

### Example Pattern
```tsx
// Before
const ToggleContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 22px;
  cursor: pointer;
`;

// After
const StyledSwitch = styled(RadixSwitch.Root)`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 22px;
  cursor: pointer;
  
  &[data-state="checked"] {
    background-color: ${theme.toggle.active};
  }
`;
```

---

## Testing Checklist

### Visual Testing
- [ ] No visual regressions
- [ ] Hover states match
- [ ] Focus states match
- [ ] Active states match
- [ ] Disabled states match

### Functional Testing
- [ ] Toggle switches work
- [ ] Select dropdowns work
- [ ] Keyboard navigation works
- [ ] Focus management works
- [ ] Screen reader announcements work

### Accessibility Testing
- [ ] ARIA attributes present
- [ ] Keyboard navigation complete
- [ ] Focus indicators visible
- [ ] Screen reader announcements correct
- [ ] Color contrast sufficient

---

## Next Steps

1. ✅ Complete component audit
2. ⏳ Install Radix UI dependencies
3. ⏳ Create component mapping document
4. ⏳ Migrate simple components (Toggle, Separator, Badge)
5. ⏳ Migrate complex components (Select, Radio Group)
6. ⏳ Test each migration
7. ⏳ Document patterns
8. ⏳ Final testing and optimization
