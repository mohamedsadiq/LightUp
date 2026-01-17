# Family Wallet Animation Principles Guide

> **🤖 Agent Quick Start:** Use this guide to implement Family Wallet-style animations. Start with the [Quick Reference](#quick-reference) section for immediate implementation, then dive into [Core Principles](#core-philosophy-the-three-pillars) for deeper understanding.

## Overview

This guide provides a comprehensive mental model for understanding the animation philosophy and principles that drive the Family Wallet team. Family Wallet is renowned for its exceptional UI/UX and fluid animations that make complex crypto interactions feel intuitive and delightful.

## 🎯 Agent Action Items

### Before You Start
- [ ] Read the [Core Philosophy](#core-philosophy-the-three-pillars) section
- [ ] Review the [Quick Reference](#quick-reference) for implementation patterns
- [ ] Check your project's animation library (Framer Motion, React Spring, etc.)

### Implementation Checklist
- [ ] Apply the [Three Pillars](#core-philosophy-the-three-pillars) to your current project
- [ ] Use the [Animation Decision Framework](#animation-decision-framework) for each animation
- [ ] Test with [Performance Best Practices](#performance-best-practices)
- [ ] Ensure [Accessibility](#accessibility-considerations) compliance

## Core Philosophy: The Three Pillars

Family Wallet's animation approach is built on three foundational principles:

### 1. Simplicity through Gradual Revelation

**Mental Model:** Think of animation as revealing information like walking through a series of interconnected rooms. You don't see everything at once—you discover each space as you approach it.

**Key Concept - The Dynamic Tray System:**
- Components are housed within expandable/contractable trays
- Trays appear on-demand based on user actions (tapping buttons, icons, notifications)
- Each tray has a unique height to make progression unmistakably clear
- Trays maintain context by overlaying content rather than replacing it
- Single focus per tray: one piece of content or one primary action

**Implementation Guidelines:**
- Use trays for transient actions that don't need permanent display
- Perfect for confirmation steps, warnings, and tutorials
- Each tray has a title and icon for navigation/dismissal
- Visual theme adapts to current context (dark/light)
- Preserve context—don't displace users from where they were

**Example Pattern:**
```
User initiates swap approval
    ↓
Tray unfolds from swap interface (not full screen)
    ↓
User completes action
    ↓
Tray closes, returning to original context
```

### 2. Fluidity through Seamless Transitions

**Mental Model:** Imagine moving through water—you float rather than walk. Every element should feel like it's part of a coherent, evolving space where any component can transform into another.

**Core Philosophy:** "We fly instead of teleport."

**Key Techniques:**

#### a. Directional Motion
- Tab switching includes directional flash (left tab → left motion, right tab → right motion)
- Creates subtle sense of space and movement
- Reinforces navigation direction

#### b. Text Morphing
- Transform button labels (e.g., "Continue" → "Confirm")
- Leverage shared letters between words ("Con" in both)
- Visually morph text to highlight transition significance
- Makes users aware of important actions

#### c. Component Continuity
- Avoid redundant animations
- If a component persists, it should remain consistent
- Components "travel" between screens without duplication
- Example: wallet cards move seamlessly between views

#### d. Empty State Continuity
- Keep most text unchanged when updating
- Only update the portion that needs change
- Avoid jarring full-sentence replacements

**Implementation Guidelines:**
- Treat the app as having unbreakable physical rules
- Every animation serves an architectural purpose
- Helps users understand their path from A → B
- Create visible links between screens, components, and features
- Avoid static transitions—use thoughtful motion to enhance clarity

### 3. Delight through Selective Emphasis

**Mental Model:** Delight is like seasoning—you don't put it everywhere, just where it enhances the experience. The goal is to create emotional connection, not just add fun interactions.

**The Delight-Impact Curve:**
```
Delight Potential ↑
                  |
                  |      • Infrequently used features
                  |     (surprise, novelty, lasting impression)
                  |
                  |
                  |   • Moderately used features
                  |  (balanced delight)
                  |
                  |
                  | • Frequently used features
                  | (subtle touches, avoid overbearing)
                  |
                  +--------------------------------→ Feature Usage Frequency
```

**Key Principles:**

#### a. Equal Value Everywhere
- Every part of the app receives the same holistic design approach
- Neglected less-used features make the entire product feel unpolished
- "Like going to a fancy restaurant but finding a dirty bathroom"

#### b. Selective Emphasis
- Carefully sprinkle magical moments throughout the app
- Mastering delight = mastering selective emphasis
- Know where, when, and how to apply intentional moments

#### c. Surprise as a Tool
- Easter eggs for features used just enough to be enjoyable
- Example: QR code screen ripple effect
- Discovery process creates the moment of delight
- Hidden in plain sight, revealed through interaction

#### d. Varying Intensity
- Infrequently used features: higher intensity delight
- Frequently used features: subtle, efficient touches
- Example: Sending tokens (daily use) → comma shifting, balance check easter egg

**Implementation Guidelines:**
- Focus especially on elevating less-used features
- For frequently used features: focus on efficiency without being overbearing
- Insert delight with varying degrees of "intensity"
- Never treat any feature as an afterthought

---

## Disney's 12 Principles of Animation Applied to UI

Family Wallet expertly applies Disney's foundational animation principles to create lifelike, engaging interfaces.

### 1. Squash and Stretch

**Concept:** Convey weight and personality through deformation.

**UI Application:**
- Wallet icon subtly squashes and stretches on change
- Almost like morphing into a different shape
- Small, unconscious detail that adds to overall experience
- **Critical Balance:** Too much = cartoon; goal = believability

**Implementation:**
```javascript
// Subtle squash/stretch on interaction
<motion.div
  whileTap={{ scale: 0.95 }}
  whileHover={{ scale: 1.05 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
```

### 2. Anticipation

**Concept:** Prepare users for what comes next.

**UI Application:**
- Pull-to-refresh: reveal hint appears as you drag
- Elastic pulling sensation indicates something will happen on release
- Notification badge wiggle hints at updates
- Submit button compresses slightly before sending

**Implementation Guidelines:**
- Reserve for moments that matter
- If every micro-interaction has a wind-up, app feels sluggish
- Save the drama for the dramatic

### 3. Staging

**Concept:** Guide attention to what matters most.

**UI Application:**
- When complex panel opens, animate in sequence
- Don't animate everything simultaneously (attention scatters)
- Dim background while bringing card into focus
- Animation guides eye to important parts

**Implementation:**
```javascript
// Staged entrance
<motion.div
  initial={{ opacity: 0, scale: 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3, delay: 0.1 }}
>
```

### 4. Straight Ahead Action & Pose to Pose

**Concept:** Define key moments first, then fill gaps.

**UI Application:**
- Define keyframes, let browser interpolate
- Focus on important frames: start state, end state, maybe midpoint
- Prioritize what matters
- Keep animations efficient and purposeful

**Critical Rule:**
- If something doesn't need to be animated, don't animate it
- Example: Context menus animate on exit only, not entry (used constantly)

### 5. Follow Through & Overlapping Action

**Concept:** Nothing moves as a single rigid unit.

**UI Application:**
- Use springs for organic overshoot-and-settle
- Hair keeps moving after you stop walking
- Arms take a moment to catch up when you start running
- Adds that "alive" feeling

**Implementation:**
```javascript
// Spring physics for organic feel
<motion.div
  animate={{ x: 100 }}
  transition={{ 
    type: "spring", 
    stiffness: 300, 
    damping: 20 
  }}
>
```

**Warning:** Too much stagger = feels slow/slow-thinking. Save for non-critical elements.

### 6. Slow In & Slow Out

**Concept:** Nothing starts or stops instantly.

**UI Application:**
- Cornerstone of smooth, comfortable transitions
- All about easing curves
- Ease-out: snappy entrances (arrive fast, settle gently)
- Ease-in: building momentum before departure
- Ease-in-out: deliberate panel slides

**Implementation:**
```javascript
// Easing curves
transition={{ 
  ease: [0.25, 0.1, 0.25, 1], // ease-out
  duration: 0.3 
}}
```

**Rule of Thumb:** Keep interactions under 300ms. Anything longer needs a good reason.

### 7. Arcs

**Concept:** Curved paths feel more organic than straight lines.

**UI Application:**
- Elements flow along curved paths like water finding its level
- Apple's Dynamic Island uses this beautifully
- Useful for hero moments, playful effects
- For utilitarian interfaces, straight lines are fine

**When to Use:**
- Landing page hero moments
- Playful interactions
- When you need "magic"

### 8. Secondary Action

**Concept:** Little flourishes that support the main action.

**UI Application:**
- Checkmark icon pops and sparkles after successful form submission
- Sparkle reinforces feeling of success
- Sound effects (subtle click, whoosh) reinforce interaction
- Adds depth and feedback without stealing spotlight

**Implementation:**
```javascript
// Secondary action after main action
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ 
    type: "spring", 
    delay: 0.2 // After main action
  }}
>
```

### 9. Timing

**Concept:** Speed determines feel.

**UI Application:**
- Tooltip at 150ms = responsive
- Tooltip at 400ms = broken
- Consistent timing across all similar elements
- Define timing scale early, reuse everywhere

**Timing Scale:**
```javascript
const TIMING = {
  instant: 100,    // Hover states
  fast: 200,       // Button clicks
  normal: 300,     // Panel transitions
  slow: 500,       // Complex flows
};
```

### 10. Exaggeration

**Concept:** Amplify motion to make points land harder.

**UI Application:**
- Theatrical, intentional
- Use sparingly for strong emotional moments
- Perfect for:
  - Onboarding sequences
  - Empty states
  - Confirmations
  - Error notifications

**When to Use:**
- Want user to feel something strongly
- Need them to notice something important

### 11. Solid Drawing

**Concept:** Consistent volume creates believable objects.

**UI Application:**
- Shadows suggest depth
- Layering implies hierarchy
- Perspective hints at space beyond viewport
- CSS perspective for 3D transforms with actual depth

**Implementation:**
```javascript
// 3D depth
<motion.div
  style={{ perspective: 1000 }}
  animate={{ rotateX: 180 }}
  transition={{ duration: 0.6 }}
>
```

### 12. Appeal

**Concept:** The sum of all techniques applied with care and taste.

**UI Application:**
- Difference between software you tolerate and software you love
- Products you keep coming back to and recommend
- Not the most feature-rich, but the ones that feel "right"
- Someone clearly gave a damn

---

## Technical Implementation Patterns

### Text Morphing with Shared Letters

**Concept:** Animate text changes by morphing shared letters between words.

**Example:** "Continue" → "Confirm"
- Shared letters: "Con"
- "Con" stays in place
- "tinue" morphs into "firm"
- Creates fluid, noticeable transition

**Implementation:**
```javascript
// Using motion-primitives text-morph
import { TextMorph } from "motion-primitives";

<TextMorph>
  {isConfirming ? "Confirm" : "Continue"}
</TextMorph>
```

**Benefits:**
- Highlights transition significance
- Makes users aware of important actions
- Smooth, professional feel
- Reinforces user's action

### Spring Physics

**Concept:** Use spring animations for natural, organic motion.

**Why Springs:**
- Mimic real-world physics
- Provide organic overshoot-and-settle
- Feel more responsive than easing curves
- Add "alive" quality

**Implementation:**
```javascript
// Spring configuration
const springConfig = {
  type: "spring",
  stiffness: 300,  // How stiff the spring is
  damping: 20,     // How quickly it settles
  mass: 1,         // Weight of the object
};

<motion.div
  animate={{ scale: 1 }}
  transition={springConfig}
>
```

**Spring Tuning:**
- Higher stiffness = snappier
- Higher damping = less bounce
- Adjust based on context and feel

### Layout Animations

**Concept:** Animate layout changes smoothly.

**Implementation:**
```javascript
// Using Framer Motion layout prop
<motion.div layout>
  {content}
</motion.div>
```

**Use Cases:**
- Reordering lists
- Expanding/collapsing panels
- Dynamic content changes
- Tray system transitions

### Gesture Animations

**Concept:** Respond to user gestures with fluid motion.

**Implementation:**
```javascript
// Drag gesture
<motion.div
  drag="x"
  dragConstraints={{ left: -100, right: 100 }}
  dragElastic={0.2}
  whileDrag={{ scale: 1.05 }}
>
```

**Use Cases:**
- Swipe actions
- Pull-to-refresh
- Card stacking
- Gesture-based navigation

---

## Animation Decision Framework

### When to Animate

**✅ Animate When:**
- Transitioning between states
- Providing feedback on user action
- Guiding attention
- Creating emotional connection
- Reducing cognitive load
- Making complex flows understandable

**❌ Don't Animate When:**
- It would slow down frequently used actions
- No clear purpose or benefit
- Would distract from primary task
- User has reduced motion preference
- Performance would suffer

### Animation Duration Guidelines

```javascript
const DURATION = {
  micro: 100,      // Micro-interactions, hover states
  fast: 200,       // Button clicks, simple toggles
  normal: 300,     // Panel transitions, moderate flows
  slow: 500,       // Complex flows, onboarding
  verySlow: 800,   // Special moments, deliberate actions
};
```

**Rule:** Keep most interactions under 300ms for responsiveness.

### Easing Curve Selection

```javascript
const EASING = {
  // Snappy entrance
  easeOut: [0.25, 0.1, 0.25, 1],
  
  // Building momentum
  easeIn: [0.42, 0, 1, 1],
  
  // Deliberate movement
  easeInOut: [0.42, 0, 0.58, 1],
  
  // Natural spring-like
  spring: { type: "spring", stiffness: 300, damping: 20 },
};
```

---

## Practical Patterns for Common Scenarios

### 1. Button State Changes

```javascript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  <TextMorph>
    {isConfirming ? "Confirm" : "Continue"}
  </TextMorph>
</motion.button>
```

### 2. Panel/Tray Transitions

```javascript
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: "auto", opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ 
    height: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  }}
>
  {content}
</motion.div>
```

### 3. List Item Entrance

```javascript
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      delay: index * 0.05, // Stagger
      type: "spring",
      stiffness: 300
    }}
  >
    {item.content}
  </motion.div>
))}
```

### 4. Card Stack Animation

```javascript
{cards.map((card, index) => (
  <motion.div
    key={card.id}
    style={{ 
      position: "absolute",
      zIndex: cards.length - index,
      scale: 1 - index * 0.05,
      y: index * 10
    }}
    animate={{ 
      scale: isExpanded ? 1 - index * 0.02 : 1 - index * 0.05,
      y: isExpanded ? index * 5 : index * 10
    }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
  >
    {card.content}
  </motion.div>
))}
```

### 5. Loading States

```javascript
<motion.div
  animate={{ opacity: [0.5, 1, 0.5] }}
  transition={{ 
    duration: 1.5, 
    repeat: Infinity,
    ease: "easeInOut"
  }}
>
  <LoadingSkeleton />
</motion.div>
```

---

## Performance Best Practices

### 1. Use Transform and Opacity

```javascript
// ✅ Good - GPU accelerated
<motion.div
  animate={{ 
    x: 100, 
    scale: 1.2, 
    opacity: 0.5 
  }}
>

// ❌ Bad - Triggers layout
<motion.div
  animate={{ 
    width: 200, 
    height: 100,
    margin: 20 
  }}
>
```

### 2. Use will-change Sparingly

```javascript
// Only for critical animations
<motion.div
  style={{ willChange: "transform" }}
  animate={{ x: 100 }}
>
```

### 3. Reduce Motion Preference

```javascript
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? { opacity: 1 } : { x: 100, opacity: 1 }}
  transition={prefersReducedMotion ? { duration: 0 } : undefined}
>
```

### 4. Lazy Load Animations

```javascript
// Only animate when in viewport
const isInView = useInView(ref);

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 20 }}
  animate={isInView ? { opacity: 1, y: 0 } : {}}
>
```

---

## Accessibility Considerations

### 1. Respect Reduced Motion

```javascript
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Disable animations for users who prefer reduced motion
if (!prefersReducedMotion) {
  // Apply animations
}
```

### 2. Provide Alternatives

- Don't rely solely on animation for feedback
- Provide visual indicators that persist
- Ensure keyboard users get equivalent feedback

### 3. Timing Considerations

- Keep animations under 5 seconds to avoid vestibular issues
- Avoid rapid flashing (3+ flashes per second)
- Provide controls for auto-playing animations

---

## Testing and Iteration

### 1. User Testing

- Observe real users interacting with animations
- Note confusion, frustration, or delight
- Test on various devices and performance levels
- Test with accessibility tools

### 2. Performance Testing

- Monitor frame rates (aim for 60fps)
- Test on low-end devices
- Check for layout thrashing
- Profile animation performance

### 3. A/B Testing

- Test different animation durations
- Compare easing curves
- Measure impact on conversion/engagement
- Gather qualitative feedback

---

## Common Pitfalls to Avoid

### 1. Over-Animating

**Problem:** Too many animations feel chaotic and slow.

**Solution:** Apply selective emphasis. Not everything needs to move.

### 2. Inconsistent Timing

**Problem:** Different elements animate at different speeds, feels wrong.

**Solution:** Define a timing scale and stick to it consistently.

### 3. Ignoring Performance

**Problem:** Animations cause jank on low-end devices.

**Solution:** Use GPU-accelerated properties, test on various devices.

### 4. Forgetting Accessibility

**Problem:** Animations cause motion sickness or confusion.

**Solution:** Respect reduced motion preferences, provide alternatives.

### 5. Animating Without Purpose

**Problem:** Animations exist just because they can.

**Solution:** Every animation should serve a purpose (feedback, guidance, delight).

---

## Mental Model Summary

### The Animation Mindset

**Think Like a Director:**
- You're not just showing information, you're manipulating attention
- Every frame matters
- Guide the user's eye through the experience
- Create emotional connection through motion

**Think Like a Physicist:**
- Objects have mass and momentum
- Nothing starts or stops instantly
- Springs and curves feel natural
- Physics-based motion feels "alive"

**Think Like a Storyteller:**
- Each interaction is a scene in a story
- Build anticipation, deliver payoff
- Create moments of surprise and delight
- Make the user feel something

### The Decision Process

When deciding whether and how to animate:

1. **Purpose:** What does this animation achieve?
   - Feedback?
   - Guidance?
   - Delight?
   - Clarity?

2. **Context:** Where does this fit in the user journey?
   - Frequent action? Keep it subtle
   - Rare action? Make it memorable
   - Critical flow? Keep it efficient

3. **Intensity:** How much animation is appropriate?
   - Apply the Delight-Impact Curve
   - Consider feature usage frequency
   - Match the emotional weight

4. **Implementation:** How do we execute it?
   - Choose appropriate duration
   - Select right easing curve
   - Use proper technique
   - Ensure performance

5. **Testing:** Does it work as intended?
   - Test with real users
   - Check performance
   - Verify accessibility
   - Iterate based on feedback

---

## Recommended Tools and Libraries

### Animation Libraries

1. **Framer Motion / Motion.dev**
   - Most popular React animation library
   - Excellent spring physics
   - Layout animations
   - Gesture support

2. **React Spring**
   - Physics-based animations
   - Great for complex choreography
   - Excellent performance

3. **Motion Primitives**
   - Pre-built animation components
   - Text morph component (inspired by Family)
   - Ready-to-use patterns

### Development Tools

1. **easing.dev**
   - Interactive easing curve playground
   - Experiment with different curves
   - See how they affect feel

2. **React DevTools**
   - Inspect animation states
   - Debug animation performance

3. **Lighthouse**
   - Performance auditing
   - Identify animation bottlenecks

### Inspiration Resources

1. **Family Values** (benji.org/family-values)
   - Primary source for these principles
   - Deep dive into Family's philosophy

2. **Apple Human Interface Guidelines**
   - Motion section
   - iOS animation patterns

3. **Material Design Motion**
   - Google's motion system
   - Well-documented patterns

---

## 🚀 Quick Reference

### Core Principles
- **Simplicity:** Gradual revelation through dynamic trays
- **Fluidity:** Seamless transitions, never teleport
- **Delight:** Selective emphasis, Delight-Impact Curve

### Key Techniques
- Text morphing with shared letters
- Spring physics for organic feel
- Directional motion for spatial awareness
- Component continuity (no duplication)
- Microinteractions for surprise

### Timing Rules
- Keep interactions under 300ms
- Be consistent across similar elements
- Define timing scale early

### When to Animate
- State transitions
- User feedback
- Attention guidance
- Emotional connection
- Cognitive load reduction

### When NOT to Animate
- Would slow frequent actions
- No clear purpose
- Would distract
- User prefers reduced motion
- Performance impact

---

## 🛠️ Agent Implementation Templates

### Copy-Paste Ready Components

#### 1. Family-Style Button with Text Morph
```javascript
// Install: npm install framer-motion motion-primitives
import { motion } from 'framer-motion';
import { TextMorph } from 'motion-primitives';

const FamilyButton = ({ isConfirming, onClick, children }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: "spring", stiffness: 400, damping: 17 }}
    onClick={onClick}
    className="family-button"
  >
    <TextMorph>
      {isConfirming ? "Confirm" : "Continue"}
    </TextMorph>
  </motion.button>
);
```

#### 2. Dynamic Tray Component
```javascript
const DynamicTray = ({ isOpen, title, icon, children, onClose }) => (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ 
      height: isOpen ? "auto" : 0, 
      opacity: isOpen ? 1 : 0 
    }}
    transition={{ 
      height: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    }}
    className="tray-container"
  >
    <div className="tray-header">
      <span className="tray-icon">{icon}</span>
      <h3 className="tray-title">{title}</h3>
      {onClose && (
        <button onClick={onClose} className="tray-close">
          ×
        </button>
      )}
    </div>
    <div className="tray-content">
      {children}
    </div>
  </motion.div>
);
```

#### 3. Directional Tab Navigation
```javascript
const DirectionalTabs = ({ tabs, activeTab, onTabChange }) => (
  <div className="tab-container">
    {tabs.map((tab, index) => (
      <motion.button
        key={tab.id}
        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => onTabChange(tab.id)}
        whileTap={{ scale: 0.95 }}
        animate={{
          x: activeTab === tab.id ? 
            (index < tabs.findIndex(t => t.id === activeTab) ? -5 : 5) : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {tab.label}
      </motion.button>
    ))}
  </div>
);
```

#### 4. Card Stack Animation
```javascript
const CardStack = ({ cards, isExpanded }) => (
  <div className="card-stack">
    {cards.map((card, index) => (
      <motion.div
        key={card.id}
        className="card"
        style={{ 
          position: "absolute",
          zIndex: cards.length - index,
        }}
        animate={{ 
          scale: isExpanded ? 1 - index * 0.02 : 1 - index * 0.05,
          y: isExpanded ? index * 5 : index * 10,
          rotate: isExpanded ? index * 1 : index * 2
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {card.content}
      </motion.div>
    ))}
  </div>
);
```

---

## 📋 Agent Decision Framework

### Step 1: Purpose Assessment
```javascript
// Ask yourself these questions before animating:
const animationPurpose = {
  feedback: "Does this provide user feedback?",
  guidance: "Does this guide user attention?",
  delight: "Does this create emotional connection?",
  clarity: "Does this improve understanding?",
  efficiency: "Does this speed up the task?"
};
```

### Step 2: Context Analysis
```javascript
// Determine animation intensity based on usage:
const delightImpactCurve = {
  frequent: "subtle",     // Daily use - keep it light
  occasional: "moderate", // Weekly use - balanced approach
  rare: "high"           // Monthly/yearly use - make it memorable
};
```

### Step 3: Implementation Pattern
```javascript
// Choose the right pattern:
const implementationPatterns = {
  stateChange: "Use spring physics for natural feel",
  entrance: "Use ease-out for snappy arrival",
  exit: "Use ease-in for smooth departure",
  transition: "Use ease-in-out for deliberate movement",
  microinteraction: "Use quick springs for responsive feel"
};
```

---

## ⚡ Performance Checklist

### Before Deploying
- [ ] All animations use `transform` and `opacity` (GPU accelerated)
- [ ] No layout thrashing (avoid animating width/height when possible)
- [ ] Spring configurations are optimized (stiffness 200-400, damping 15-30)
- [ ] Reduced motion preference is respected
- [ ] Animation durations are under 300ms for frequent interactions
- [ ] No memory leaks in animation cleanup
- [ ] Tested on low-end devices

### Testing Commands
```bash
# Performance audit
npm run lighthouse

# Animation performance profiling
npm run test:animation-performance

# Accessibility testing
npm run test:a11y
```

---

## 🎨 Animation Library Setup

### Framer Motion (Recommended)
```bash
npm install framer-motion
```

```javascript
// utils/animation.js
export const ANIMATION_CONFIG = {
  // Family Wallet inspired spring configs
  snappy: { type: "spring", stiffness: 400, damping: 17 },
  smooth: { type: "spring", stiffness: 300, damping: 25 },
  gentle: { type: "spring", stiffness: 200, damping: 30 },
  
  // Easing curves
  easeOut: [0.25, 0.1, 0.25, 1],
  easeIn: [0.42, 0, 1, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  
  // Durations
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500
};

export const useReducedMotion = () => {
  // Hook for accessibility
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};
```

### Motion Primitives (for Text Morph)
```bash
npm install motion-primitives
```

---

## 🔍 Debugging Guide

### Common Issues & Solutions

#### Animation Feels Slow
```javascript
// ❌ Bad - triggers layout
animate={{ width: 200 }}

// ✅ Good - GPU accelerated
animate={{ scale: 1.2, x: 100 }}
```

#### Animation Not Smooth
```javascript
// ❌ Bad - too much stagger
transition={{ delay: index * 0.2 }}

// ✅ Good - subtle stagger
transition={{ delay: index * 0.05 }}
```

#### Animation Jank on Mobile
```javascript
// Add will-change sparingly
style={{ willChange: "transform" }}

// Or use transform3d for hardware acceleration
animate={{ transform3d: "translateX(100px)" }}
```

---

## 🎯 Agent Quick Start Checklist

### Immediate Actions
1. **Read the Quick Reference** section (5 min)
2. **Copy the Animation Config** from the Library Setup section
3. **Implement one component** from the Implementation Templates
4. **Test with the Performance Checklist**

### For Current Project
- [ ] Review existing animations against Family Wallet principles
- [ ] Identify opportunities for the Three Pillars (Simplicity, Fluidity, Delight)
- [ ] Apply the Delight-Impact Curve to feature prioritization
- [ ] Test accessibility compliance

### Common Use Cases
- **Button interactions** → Use FamilyButton template
- **Modal/panel transitions** → Use DynamicTray template  
- **Navigation** → Use DirectionalTabs template
- **Card interfaces** → Use CardStack template

---

## 📚 Further Reading & Resources

### Essential Reading
- [Family Values](https://benji.org/family-values) - Primary source
- [12 Principles of Animation](https://www.userinterface.wiki/12-principles-of-animation)
- [Motion.dev Documentation](https://motion.dev/)

### Tools & Playgrounds
- [easing.dev](https://easing.dev/) - Easing curve playground
- [Motion Examples](https://examples.motion.dev/) - Live examples
- [Motion Primitives](https://motion-primitives.com/) - Pre-built components

### Inspiration
- [Apple HIG - Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- [Material Design Motion](https://m3.material.io/styles/motion/overview)

---

## 🎓 Agent Certification

### Level 1: Animation Apprentice
- Understand the Three Pillars
- Implement basic spring animations
- Follow performance guidelines

### Level 2: Animation Practitioner  
- Apply Delight-Impact Curve
- Implement complex tray systems
- Debug animation performance

### Level 3: Animation Master
- Create custom animation systems
- Design animation libraries
- Mentor others on animation philosophy

---

*This guide is designed for agents to quickly implement Family Wallet-style animations with confidence and consistency.*

---

*This guide is based on research into Family Wallet's animation philosophy and design principles, as documented in their "Family Values" article and related resources.*
