# GhanaDeals — Branding & Design Guide

> The definitive reference for design consistency across web, mobile, and admin surfaces.

## Table of Contents

- [Brand Identity](#brand-identity)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Border Radius](#border-radius)
- [Shadows & Elevation](#shadows--elevation)
- [Motion & Animation](#motion--animation)
- [Component Patterns](#component-patterns)
- [Responsive Breakpoints](#responsive-breakpoints)
- [Iconography](#iconography)
- [Platform-Specific Notes](#platform-specific-notes)

---

## Brand Identity

### Name
**GhanaDeals** — Ghana's Premier Property Marketplace

### Logo Treatment
- "Ghana" in brand primary color (`#E63946`)
- "Deals" in dark text (`#1A1A1A` light / `#F0F0F0` dark)
- Accompanied by a house/property icon when space allows
- Minimum clear space: half the logo height on all sides

### Voice & Tone
- Professional but approachable
- Confident, not aggressive
- Local context (Ghana Cedis, Ghanaian regions, local terminology)
- Currency always displayed as **GHS** prefix: `GHS 450,000`

---

## Color System

### Primary (Brand)

| Token | Value | Usage |
|-------|-------|-------|
| `brand` | `#E63946` | Primary buttons, links, logo accent, focus rings |
| `brand-hover` | `#CF2F3C` | Hover state for primary elements |
| `brand-light` | `rgba(230,57,70,0.08)` | Subtle backgrounds, badges |
| `brand-glow` | `rgba(230,57,70,0.35)` | Button hover shadow |

### App-Specific Accents

| App | Accent | Accent Hover | Usage |
|-----|--------|-------------|-------|
| **Web (Public)** | `#E63946` | `#CF2F3C` | CTA buttons, active states |
| **Admin** | `#DC2626` | `#B91C1C` | Action buttons, status indicators |
| **Agents** | `#16A34A` | `#15803D` | Success state, agent-specific CTAs |
| **Mobile** | `#E63946` | `#CF2F3C` | Match web for buyer consistency |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#10B981` | Approved, verified, success states |
| `warning` | `#F59E0B` | Pending, caution, premium badges |
| `danger` | `#DC2626` | Errors, flagged, destructive actions |
| `info` | `#3B82F6` | Informational, links, secondary CTAs |

### Neutrals — Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#FFFFFF` | Page background |
| `bg-secondary` | `#F5F5F5` | Section backgrounds, inputs |
| `bg-tertiary` | `#EAEAEA` | Dividers, disabled backgrounds |
| `card-bg` | `#FFFFFF` | Cards, modals |
| `card-bg-hover` | `#FAFAFA` | Card hover state |
| `text-primary` | `#1A1A1A` | Headings, body text |
| `text-secondary` | `#6B7280` | Descriptions, labels |
| `text-tertiary` | `#9CA3AF` | Placeholders, hints |
| `text-inverse` | `#FFFFFF` | Text on brand color |
| `border-primary` | `#E5E7EB` | Cards, containers |
| `border-secondary` | `#D1D5DB` | Inputs, dividers |
| `border-focus` | `#E63946` | Focused inputs |

### Neutrals — Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#0D0D0D` | Page background |
| `bg-secondary` | `#111111` | Section backgrounds |
| `bg-tertiary` | `#1A1A1A` | Dividers, disabled backgrounds |
| `card-bg` | `#161616` | Cards, modals |
| `card-bg-hover` | `#1C1C1C` | Card hover state |
| `text-primary` | `#F0F0F0` | Headings, body text |
| `text-secondary` | `#9CA3AF` | Descriptions, labels |
| `text-tertiary` | `#6B7280` | Placeholders, hints |
| `border-primary` | `#2A2A2A` | Cards, containers |
| `border-secondary` | `#333333` | Inputs, dividers |

### Agent Branding Colors

Each agent has a personal `color` field (hex string). This is used as their accent color on:
- Agent profile card backgrounds (as a subtle tint)
- Avatar background fallback (first letter of name)
- Agent detail page header accent

Common defaults: `#3B82F6` (blue), `#E63946` (red), `#16A34A` (green)

---

## Typography

### Font Families

| Role | Font | Fallback | Weight Range |
|------|------|----------|-------------|
| **Headings** | DM Sans | -apple-system, BlinkMacSystemFont, sans-serif | 500–700 |
| **Body** | Inter | -apple-system, BlinkMacSystemFont, sans-serif | 300–700 |
| **Code/Mono** | Geist Mono | monospace | 400 |

**Google Fonts import:**
```
DM Sans: 400, 500, 600, 700, 700i
Inter: 300, 400, 500, 600, 700
```

### Type Scale

| Name | Size | Weight | Line Height | Font | Usage |
|------|------|--------|-------------|------|-------|
| `display` | 48px | 700 | 1.1 | DM Sans | Hero headline only |
| `h1` | 32px | 700 | 1.2 | DM Sans | Page titles |
| `h2` | 28px | 700 | 1.25 | DM Sans | Section titles |
| `h3` | 24px | 600 | 1.3 | DM Sans | Card titles, detail page titles |
| `h4` | 20px | 600 | 1.35 | DM Sans | Sub-section titles |
| `h5` | 18px | 600 | 1.4 | DM Sans | Widget titles |
| `h6` | 16px | 600 | 1.4 | DM Sans | Label titles |
| `body` | 15px | 400 | 1.6 | Inter | Default body text |
| `body-sm` | 14px | 400 | 1.5 | Inter | Secondary text, descriptions |
| `caption` | 13px | 500 | 1.4 | Inter | Labels, badges, metadata |
| `small` | 12px | 400 | 1.4 | Inter | Timestamps, fine print |
| `tiny` | 11px | 500 | 1.3 | Inter | Badge text, counters |

### Text Colors by Context

| Context | Light | Dark |
|---------|-------|------|
| Page/card title | `#1A1A1A` | `#F0F0F0` |
| Body paragraph | `#1A1A1A` | `#F0F0F0` |
| Description/subtitle | `#6B7280` | `#9CA3AF` |
| Placeholder/hint | `#9CA3AF` | `#6B7280` |
| Price | `#E63946` | `#E63946` |
| Link | `#E63946` | `#E63946` |
| On brand background | `#FFFFFF` | `#FFFFFF` |

---

## Spacing & Layout

### Spacing Scale

Use a **4px base grid**. Common spacing values:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon-to-text gap, tight padding |
| `sm` | 8px | Inline element gaps |
| `md` | 12px | Card internal padding (small) |
| `base` | 16px | Standard padding, list gaps |
| `lg` | 20px | Section padding, card padding |
| `xl` | 24px | Section gaps |
| `2xl` | 32px | Major section dividers |
| `3xl` | 40px | Page-level padding |
| `4xl` | 48px | Hero/section vertical spacing |
| `5xl` | 64px | Large section breaks |

### Layout Constants

| Token | Value | Usage |
|-------|-------|-------|
| `header-height` | 70px | Top navigation bar |
| `max-width` | 1320px | Content container max width |
| `sidebar-width` | 280px | Desktop sidebar (listings, agent dash) |
| `detail-sidebar` | 360px | Property detail page sidebar |

### Container

```
Max width: 1320px
Horizontal padding: 20px (mobile) → 40px (desktop)
Centered with margin: 0 auto
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 6px | Buttons, badges, small inputs |
| `radius-md` | 10px | Inputs, dropdowns, small cards |
| `radius-lg` | 14px | Property cards, containers |
| `radius-xl` | 20px | Modals, large panels |
| `radius-full` | 9999px | Pills, circular avatars, tags |

---

## Shadows & Elevation

### Light Mode

| Level | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth (buttons, inputs) |
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` | Default card rest state |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Dropdowns, popovers |
| `shadow-card-hover` | `0 10px 30px rgba(0,0,0,0.1)` | Card hover (with translateY) |
| `shadow-lg` | `0 8px 30px rgba(0,0,0,0.1)` | Modals |
| `shadow-xl` | `0 20px 50px rgba(0,0,0,0.12)` | Full-page overlays |
| `shadow-sticky` | `0 2px 8px rgba(0,0,0,0.08)` | Sticky headers |

### Dark Mode

Shadows use increased opacity: multiply light mode alpha by roughly 4–6×.

| Level | Value |
|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` |
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` |
| `shadow-lg` | `0 8px 30px rgba(0,0,0,0.5)` |
| `shadow-xl` | `0 20px 50px rgba(0,0,0,0.6)` |

---

## Motion & Animation

### Transition Durations

| Token | Value | Usage |
|-------|-------|-------|
| `fast` | 150ms ease | Hover states, toggles |
| `base` | 250ms ease | General transitions |
| `slow` | 400ms ease | Page transitions, large elements |
| `theme` | 300ms ease | Theme switching (dark/light) |

### Standard Animations

| Animation | Specification | Usage |
|-----------|--------------|-------|
| **Card Hover** | `translateY(-4px)` + `shadow-card-hover` | Property cards |
| **Button Hover** | `translateY(-1px)` + brand glow shadow | Primary buttons |
| **Scroll Reveal** | `opacity: 0 → 1`, `translateY(30px → 0)`, 600ms ease | Sections on scroll |
| **Modal Enter** | `scale(0.95) → 1`, `translateY(20px → 0)`, 250ms ease | Modal open |
| **Skeleton Shimmer** | Gradient `translateX(-100% → 100%)`, 1.5s infinite | Loading placeholders |
| **Toast** | Slide from right 300ms, auto-dismiss at 2.7s | Notifications |

### Mobile-Specific

- Use platform-native transitions (iOS spring, Android material motion)
- Property card press: `scale(0.98)` with 100ms duration
- Pull-to-refresh: native platform behavior
- Page transitions: horizontal slide (push/pop navigation)

---

## Component Patterns

### Buttons

#### Primary
```
Background:    #E63946
Text:          #FFFFFF
Padding:       10px 22px
Border Radius: 6px
Font:          14px / 600 weight / Inter
Hover:         translateY(-1px), shadow: 0 4px 16px rgba(230,57,70,0.35)
Active:        translateY(0), background: #CF2F3C
Disabled:      opacity: 0.5, no hover effects
```

#### Secondary / Outline
```
Background:    transparent
Border:        1.5px solid #E5E7EB
Text:          #1A1A1A (light) / #F0F0F0 (dark)
Hover:         background: #F5F5F5 (light) / #1A1A1A (dark)
```

#### Ghost
```
Background:    transparent
Text:          #6B7280
Hover:         background: rgba(0,0,0,0.04)
```

#### Sizes

| Size | Padding | Font Size |
|------|---------|-----------|
| `sm` | 7px 14px | 13px |
| `md` (default) | 10px 22px | 14px |
| `lg` | 14px 32px | 16px |

---

### Input Fields

```
Padding:        11px 14px
Border:         1.5px solid #D1D5DB
Border Radius:  10px
Font:           15px / 400 weight
Background:     #FFFFFF (light) / #161616 (dark)
Focus:          Border #E63946, shadow: 0 0 0 3px rgba(230,57,70,0.1)
Placeholder:    #9CA3AF
```

---

### Property Cards

#### Vertical Card (Grid View)
```
Border Radius:  14px
Background:     card-bg
Shadow:         shadow-card → shadow-card-hover on hover
Image:          aspect-ratio 16/10, overflow hidden, scale(1.05) on hover
Content:        16px padding
Price:          body-sm, 700 weight, brand color
Title:          body, 600 weight, max 2 lines (line-clamp)
Location:       caption, text-secondary
Meta row:       caption, text-secondary (beds · baths · area)
Agent badge:    avatar circle + name, bottom of card
```

#### Horizontal Card (List View)
```
Layout:         Image (340px width) + Content (flex: 1)
Min Height:     240px
Image:          cover, left side, 14px radius on left corners only
Content:        20px padding, vertical stack
Badges:         absolute top-left of image
```

---

### Property Detail Page

```
Gallery:        Grid 7fr | 3fr (main large image + side thumbnails)
Content:        2-column: Main (flex: 1) + Sidebar (360px, sticky)
Price:          h3, brand color, 700 weight
Details table:  2-column grid, alternating subtle bg
Amenities:      3-column grid of icon + label pairs
Description:    body text, line-height 1.7
Agent card:     In sidebar — avatar, name, company, phone, contact CTA
```

---

### Badges & Tags

#### Listing Badge (e.g. "Premium", "New")
```
Background:    #F59E0B (premium) / #10B981 (new)
Text:          #FFFFFF
Font:          11px / 600 weight
Padding:       3px 10px
Border Radius: 9999px
```

#### Status Badge
| Status | Background | Text |
|--------|-----------|------|
| Approved | `#D1FAE5` | `#065F46` |
| Pending | `#FEF3C7` | `#92400E` |
| Flagged | `#FEE2E2` | `#991B1B` |
| Archived | `#F3F4F6` | `#6B7280` |

#### Listing Type Pill
| Type | Background | Text |
|------|-----------|------|
| For Sale | `rgba(230,57,70,0.1)` | `#E63946` |
| For Rent | `rgba(59,130,246,0.1)` | `#3B82F6` |
| New Dev | `rgba(245,158,11,0.1)` | `#F59E0B` |

#### Verification Badge
```
Verified:    ✓ checkmark icon, #10B981 green
Unverified:  No badge shown
```

---

### Modals

```
Max Width:      440px
Padding:        36px
Border Radius:  20px
Background:     card-bg
Shadow:         shadow-xl
Backdrop:       rgba(0,0,0,0.5) with optional blur
Enter:          scale(0.95) translateY(20px) → scale(1) translateY(0), 250ms
```

---

### Navigation

#### Top Nav (Web)
```
Height:         70px
Background:     bg-primary with shadow-sticky on scroll
Logo:           Left-aligned
Links:          Center, 14px/500 weight, text-primary
CTA:            "List Property" primary button, right side
Auth:           Login/Signup buttons or avatar dropdown
Fixed:          position: sticky, top: 0, z-index: 100
```

#### Bottom Tab Bar (Mobile)
```
Height:         56px + safe area inset
Background:     bg-primary
Border Top:     1px solid border-primary
Icons:          24px, text-tertiary (inactive) / brand (active)
Labels:         11px, below icon
Items:          Home, Search, Saved, Profile (buyer) / Dashboard (agent)
```

---

### Loading States

#### Skeleton
```
Background:     #F3F4F6 (light) / #2A2A2A (dark)
Shimmer:        Linear gradient animation, 1.5s infinite
Border Radius:  Match the element being loaded
Height:         Match approximate content height
```

#### Empty State
```
Icon:           64px, text-tertiary
Title:          h5, text-primary
Description:    body-sm, text-secondary, max-width 320px
CTA:            Primary button (optional)
Centered:       Both axes within the container
```

---

### Toast / Snackbar

```
Position:       Top-right (web) / Top (mobile, below status bar)
Width:          Auto, max 380px
Padding:        14px 18px
Border Radius:  10px
Shadow:         shadow-md
Duration:       3 seconds, dismiss on swipe
```

| Type | Left Border/Icon Color |
|------|----------------------|
| Success | `#10B981` |
| Error | `#DC2626` |
| Warning | `#F59E0B` |
| Info | `#3B82F6` |

---

## Responsive Breakpoints

| Name | Width | Columns | Side Panel |
|------|-------|---------|------------|
| **Desktop** | ≥ 1200px | 4 | Visible |
| **Tablet** | 1025–1199px | 3 | Hidden |
| **Mobile L** | 769–1024px | 2 | Hidden |
| **Mobile** | 481–768px | 1–2 | Hidden |
| **Mobile S** | ≤ 480px | 1 | Hidden |

### Property Grid Columns

| Breakpoint | Featured Grid | Listings Grid |
|-----------|--------------|---------------|
| ≥ 1200px | 4 columns | 3 columns |
| 769–1199px | 3 columns | 2 columns |
| 481–768px | 2 columns | 2 columns |
| ≤ 480px | 1 column | 1 column |

### Detail Page

| Breakpoint | Layout |
|-----------|--------|
| ≥ 1025px | Two-column: content + 360px sticky sidebar |
| < 1025px | Single column, sidebar below |

---

## Iconography

### Icon Library
- **Web/Admin/Agents:** [Lucide Icons](https://lucide.dev/) (React components)
- **Mobile:** Lucide React Native, or map to SF Symbols (iOS) / Material Icons (Android)

### Icon Sizing

| Context | Size |
|---------|------|
| Inline text | 16px |
| Button icon | 18px |
| Card/list icon | 20px |
| Feature icon | 24px |
| Empty state | 48–64px |
| Tab bar | 24px |

### Common Icons

| Concept | Lucide Icon |
|---------|------------|
| Bedrooms | `Bed` |
| Bathrooms | `Bath` |
| Area/Size | `Maximize2` or `SquareIcon` |
| Location | `MapPin` |
| Phone | `Phone` |
| Email | `Mail` |
| Heart/Save | `Heart` (outline) / `HeartFilled` (saved) |
| Search | `Search` |
| Filter | `SlidersHorizontal` |
| Share | `Share2` |
| Back | `ChevronLeft` |
| Close | `X` |
| Verified | `ShieldCheck` |
| Price | `DollarSign` or `Tag` |
| Home | `Home` |
| Settings | `Settings` |
| Listings | `Building2` |
| Inquiries | `MessageSquare` |
| Profile | `User` |
| Camera/Upload | `Camera` or `Upload` |
| Delete | `Trash2` |
| Edit | `Pencil` |
| Plus/Add | `Plus` |
| Calendar | `Calendar` |

---

## Platform-Specific Notes

### iOS (React Native)

- Use `DM Sans` and `Inter` via `expo-font` or asset linking
- Safe area insets for notch and home indicator
- Haptic feedback on button press (`expo-haptics`)
- Use `react-native-fast-image` for image caching
- Bottom sheet: `@gorhom/bottom-sheet` for filters
- Native `ActivityIndicator` for inline loading
- Status bar: light content on brand-colored headers

### Android (React Native)

- Material You dynamic color: opt-out, use brand colors consistently
- Ripple effect on cards and buttons (native pressable feedback)
- `elevation` property maps to shadow levels:
  - Card: elevation 2
  - Card hover/pressed: elevation 8
  - Modal: elevation 24
  - FAB: elevation 6
- Navigation bar color should match `bg-primary`

### Shared Mobile Patterns

- Bottom tab navigation (not drawer) for primary nav
- Pull-to-refresh on all list screens
- Infinite scroll with loading indicators at bottom
- Property images: use `FlatList` horizontal scroll for gallery
- Map integration: Google Maps (Android) / Apple Maps (iOS), optional toggle
- Agent color as accent on contact and profile cards
- Dark mode: respect system preference, with manual override toggle

---

## Quick Reference — Token Summary

```
BRAND:       #E63946
BRAND_HOVER: #CF2F3C
SUCCESS:     #10B981
WARNING:     #F59E0B
DANGER:      #DC2626
INFO:        #3B82F6

BG_LIGHT:    #FFFFFF     BG_DARK:     #0D0D0D
BG2_LIGHT:   #F5F5F5     BG2_DARK:    #111111
TEXT_LIGHT:  #1A1A1A     TEXT_DARK:    #F0F0F0
TEXT2_LIGHT: #6B7280     TEXT2_DARK:   #9CA3AF
BORDER_LIGHT:#E5E7EB     BORDER_DARK:  #2A2A2A

FONT_HEAD:   "DM Sans", sans-serif
FONT_BODY:   "Inter", sans-serif

RADIUS_SM:   6px    RADIUS_MD:  10px
RADIUS_LG:   14px   RADIUS_XL:  20px
RADIUS_FULL: 9999px

HEADER_H:    70px
MAX_W:       1320px
SIDEBAR_W:   280px
```
