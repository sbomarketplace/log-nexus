# Settings Dropdown/Accordion Menu Specifications

## Overview
The Settings screen uses Radix UI Accordion components with three main sections: "Remove Ads Subscription", "Data & Storage", and "Support & Legal". All dropdowns allow multiple sections to be open simultaneously (`type="multiple"`).

## Component List

### 1. Remove Ads Subscription Accordion
- **Type**: AccordionItem with expanding content panel
- **Icon**: Shield (lucide-react)
- **Content**: Subscription status card + purchase buttons (when not subscribed)

### 2. Data & Storage Accordion  
- **Type**: AccordionItem with expanding content panel
- **Icon**: Database (lucide-react)
- **Content**: DataStorageCard component with export options

### 3. Support & Legal Accordion
- **Type**: AccordionItem with clickable row inside (special case)
- **Icon**: HelpCircle (lucide-react)
- **Content**: Single clickable row that opens SupportLegalModal

## Dimensions & Spacing (px)

### Accordion Trigger (Header Row)
- **Min Height**: ~48px (calculated from 16px vertical padding)
- **Padding**: 16px all sides (`padding: 16px` from settings-section-header)
- **Icon Size**: 16px × 16px (`h-4 w-4`)
- **Gap between Icon and Label**: 12px (`gap-3` = 0.75rem = 12px)
- **Label Font**: 16px font size, 500 weight (default browser behavior)
- **Right Chevron**: 16px × 16px (`h-4 w-4` ChevronDown)
- **Hit Target**: Full header row is clickable (minimum 48px height meets accessibility)
- **Border**: 1px solid border on section container
- **Corner Radius**: 8px (`border-radius: 8px` from settings-section)

### Accordion Content Panel
- **Content Padding**: 16px base + 12px top = 28px top, 16px sides/bottom
- **Inner Card Padding**: 16px (`p-4` on status cards)
- **Section Spacing**: 16px between cards (`space-y-4`)
- **Max Width**: Inherits from page container (max-w-4xl)
- **Border**: 1px top divider added via ::before pseudo-element with 40% opacity

### Content Row Specifics (Support & Legal)
- **Row Height**: Auto (based on padding)
- **Row Padding**: 12px vertical, 0px horizontal (`padding: 12px 0` from settings-row)
- **Right Arrow**: ChevronRight 16px × 16px
- **Hover State**: Semi-transparent muted background (`hover:bg-muted/20`)

## Animation
- **Expand Duration**: 200ms
- **Collapse Duration**: 200ms  
- **Expand Easing**: ease-out
- **Collapse Easing**: ease-in
- **Chevron Rotation**: 180 degrees when expanded
- **Keyframes**: 
  - `accordion-down`: height 0 → var(--radix-accordion-content-height)
  - `accordion-up`: height var(--radix-accordion-content-height) → 0

## States & Classes

### Default State
- **Section**: `settings-section` - 1px border, 8px radius, card background
- **Header**: `settings-section-header` - 16px padding, border-bottom, cursor pointer
- **Content**: `settings-section-content cc-acc-content` - 16px padding + 12px top override

### Hover State  
- **Header**: `background: hsl(var(--muted) / 0.5)` (50% muted background)
- **Support Row**: `hover:bg-muted/20` (20% muted background)

### Focus State
- Uses Radix UI default focus management
- Focus ring follows CSS custom property `--ring` (primary color)

### Expanded State
- **Chevron**: Rotated 180 degrees via CSS transform
- **Content**: Visible with accordion-down animation
- **Aria**: `aria-expanded="true"` on trigger

### Disabled State
- Not implemented/used in current Settings page

## Behavior

### Multiple Sections
- **Allow Multiple Open**: Yes (`type="multiple"`)
- **Default State**: All sections closed on initial load

### Click/Keyboard Controls
- **Header Click**: Toggles section open/closed
- **Keyboard**: 
  - Enter/Space: Toggle section
  - Arrow keys: Move focus between section headers
  - Home/End: Jump to first/last section
- **Full Header Clickable**: Yes, entire header row is interactive

### Pointer Interaction
- **Cursor**: `cursor: pointer` on header
- **Hit Area**: Full header height (minimum 44×44px for accessibility)
- **Touch Friendly**: 16px padding provides adequate touch targets

## Accessibility (A11y)

### ARIA Attributes
- **Trigger**: 
  - `role="button"` (via Radix AccordionTrigger)
  - `aria-expanded="true|false"`
  - `aria-controls="[content-id]"`
- **Content Region**:
  - `role="region"` (via Radix AccordionContent)  
  - `aria-labelledby="[trigger-id]"`
  - Unique `id` for content panel

### Focus Management
- Focus moves between accordion triggers with arrow keys
- Focus remains on trigger when toggling open/closed
- Content is properly associated with trigger for screen readers

## Visual Tokens & Classes

### Tailwind/Semantic Classes Used
- **Container**: `settings-section` → 1px border, 8px radius, card background
- **Header**: `settings-section-header` → 16px padding, hover effects
- **Content**: `settings-section-content cc-acc-content` → padding + animation
- **Icons**: `h-4 w-4 text-muted-foreground` → 16px, muted color
- **Spacing**: `gap-3` (12px), `space-y-4` (16px)

### Computed Pixel Values
- Border width: 1px solid hsl(var(--border))
- Border radius: 8px (settings-section)
- Header padding: 16px all sides
- Content padding: 12px top + 16px sides/bottom
- Icon size: 16px × 16px
- Font sizes: 16px labels, 14px settings row titles, 12px descriptions

## Special Cases

### Support & Legal Modal Row  
Unlike the other accordions, the Support & Legal section contains a clickable row that opens a modal rather than displaying static content:

- **Row Type**: Clickable div with cursor pointer
- **Action**: Opens `SupportLegalModal` component
- **Icon**: ChevronRight (indicating navigation, not expansion)
- **Hover**: `hover:bg-muted/20` background tint
- **Content**: Title "Support & Legal" + description "Terms, Privacy, Contact Support, Rate App"

## Notes
- No true select dropdowns exist on the Settings page
- All accordions use semantic HTML structure via Radix UI primitives
- Consistent 16px spacing theme throughout
- Primary orange color (HSL 25 95% 53%) used for focus states
- Dark mode supported via CSS custom properties
- iOS safe area handling via padding-bottom utilities