---
description: Implement Family Wallet-style animations with the Three Pillars approach
---

# Family Wallet Animation Implementation Workflow

> **📚 Reference**: See the complete [Family Wallet Animation Guide](../../../docs/animation-guide-family-wallet.md) for detailed principles, examples, and best practices.

This workflow guides you through implementing Family Wallet-style animations using the Three Pillars: Simplicity, Fluidity, and Delight.

## When to Use This Workflow

Use this workflow when you need to:
- Add new animations to components
- Improve existing animations
- Create animated user interfaces
- Implement microinteractions
- Design transition effects

## Implementation Steps

### Step 1: Analyze the Animation Need
// turbo
1. Identify the component or interaction that needs animation
2. Determine the purpose (feedback, guidance, delight, clarity)
3. Assess usage frequency (frequent, occasional, rare)
4. Check accessibility requirements

### Step 2: Apply the Three Pillars

#### Simplicity through Gradual Revelation
- Ask: "Can this be revealed gradually instead of all at once?"
- Consider using dynamic trays for complex flows
- Implement single-focus animations (one thing at a time)
- Preserve user context throughout transitions

#### Fluidity through Seamless Transitions  
- Ask: "Are we flying or teleporting?"
- Implement directional motion for spatial awareness
- Use spring physics for natural movement
- Ensure component continuity (no duplication)

#### Delight through Selective Emphasis
- Apply the Delight-Impact Curve based on usage frequency
- Add microinteractions for surprise and discovery
- Focus on less-used features for higher impact
- Keep frequently used features subtle and efficient

### Step 3: Choose Implementation Pattern

#### For Button Interactions
```javascript
// Use FamilyButton pattern with text morphing
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  <TextMorph>{isConfirming ? "Confirm" : "Continue"}</TextMorph>
</motion.button>
```

#### For Panel/Tray Transitions
```javascript
// Use DynamicTray pattern
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
  transition={{ 
    height: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  }}
>
```

#### For Navigation
```javascript
// Use DirectionalTabs pattern
animate={{
  x: activeTab === tab.id ? 
    (index < activeTabIndex ? -5 : 5) : 0
}}
```

#### For Card Interfaces
```javascript
// Use CardStack pattern
animate={{ 
  scale: isExpanded ? 1 - index * 0.02 : 1 - index * 0.05,
  y: isExpanded ? index * 5 : index * 10
}}
```

### Step 4: Configure Animation Settings

```javascript
// Use these Family Wallet inspired configs
const ANIMATION_CONFIG = {
  snappy: { type: "spring", stiffness: 400, damping: 17 },
  smooth: { type: "spring", stiffness: 300, damping: 25 },
  gentle: { type: "spring", stiffness: 200, damping: 30 },
  
  // Keep under 300ms for responsiveness
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500
};
```

### Step 5: Implement Accessibility
// turbo
1. Check for reduced motion preference
2. Provide alternative visual feedback
3. Ensure animations don't exceed 5 seconds
4. Test with screen readers

```javascript
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Disable or simplify animations for users who prefer reduced motion
if (!prefersReducedMotion) {
  // Apply animations
}
```

### Step 6: Performance Testing
// turbo
1. Verify animations use GPU-accelerated properties (transform, opacity)
2. Test on low-end devices
3. Check for layout thrashing
4. Monitor frame rates (aim for 60fps)

### Step 7: User Testing
// turbo
1. Test with real users
2. Observe emotional reactions
3. Check for confusion or frustration
4. Validate that animations enhance rather than hinder

## Validation Checklist

Before completing the workflow, ensure:

- [ ] Animation serves a clear purpose (feedback, guidance, delight, clarity)
- [ ] Follows the Three Pillars principles
- [ ] Uses appropriate spring configurations
- [ ] Respects accessibility preferences
- [ ] Performs well on target devices
- [ ] Enhances rather than distracts from user experience
- [ ] Is consistent with existing animations in the project

## Common Patterns Reference

### Text Morphing
Use for button state changes where text transforms between related words (e.g., "Continue" → "Confirm")

### Dynamic Trays
Use for transient actions, confirmations, warnings, and tutorials

### Directional Motion
Use for tab switching, navigation, and spatial transitions

### Component Continuity
Ensure elements that persist between states don't duplicate or teleport

### Delight-Impact Curve
- **Frequent features**: Subtle animations (comma shifting, gentle springs)
- **Occasional features**: Moderate animations (card reveals, panel transitions)
- **Rare features**: High-impact animations (onboarding, special moments)

## Troubleshooting

### Animation Feels Slow
- Switch to GPU-accelerated properties
- Reduce animation complexity
- Optimize spring configurations

### Animation Not Smooth
- Check for layout thrashing
- Reduce stagger delays
- Ensure consistent timing

### Animation Causes Motion Sickness
- Respect reduced motion preferences
- Reduce animation intensity
- Provide static alternatives

## Next Steps

After completing this workflow:
1. Document the animation decisions
2. Add to component library if reusable
3. Update design system documentation
4. Share learnings with team

---

*This workflow implements the Family Wallet animation philosophy documented in the comprehensive guide.*
