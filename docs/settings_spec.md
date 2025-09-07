# Settings Screen Specification

## Screen Overview

The Settings screen serves as the main hub for user preferences management and access to legal/support resources. It combines settings configuration, subscription management, data storage controls, and external resources in a unified interface. Users navigate to `/settings` from the bottom navigation bar or through redirected routes like `/resources`.

## Component Tree

- **AppHeader** (fixed 56px height with subtle border)
  - **Layout** (page container with max-width and responsive padding)
    - **PageHero** (centered title and subtitle)
    - **h2** "Settings" (section header)
    - **Accordion** (multiple expandable sections)
      - **AccordionItem**: "Remove Ads Subscription" (Shield icon)
        - **AccordionContent**: Subscription status row, pricing buttons, debug info
      - **AccordionItem**: "Data & Storage" (Database icon)  
        - **AccordionContent**: DataStorageCard component
      - **AccordionItem**: "Support & Legal" (HelpCircle icon)
        - **AccordionContent**: Support & Legal link row
    - **InlineAd** (banner advertisement slot)
    - **Separator** (divider line)
    - **h2** "Resources" (section header with anchor)
    - **ResourcesSection** (collapsible resource categories)
    - **FloatingModal** (subscription management overlay)
    - **SupportLegalModal** (terms, privacy, and contact overlay)

## Layout Design

### Header & Navigation
- **Top spacing**: `pt-3 pb-2` relative to fixed 56px AppHeader
- **AppHeader border**: Thin 1px bottom border `border-bottom: 1px solid rgba(0,0,0,0.06)`
- **Container**: `max-w-4xl mx-auto` with responsive padding
- **Safe areas**: `pb-safe-bottom` for iPhone notch compatibility

### Card & Section Styling  
- **Card radius**: `rounded-lg` (8px border radius)
- **Section radius**: `rounded-2xl` (16px for floating modals)
- **Card shadow**: `shadow-sm` subtle elevation
- **Accordion spacing**: `space-y-4` between sections

### Typography & Spacing
- **Page title**: `text-3xl font-bold tracking-tight`
- **Page subtitle**: `mt-2 text-muted-foreground`
- **Section headers**: `text-lg font-medium text-foreground mb-2`
- **Row spacing**: `py-4` for accordion triggers, `p-4` for content areas

## Sections & Items

### Remove Ads Subscription
**Component Type**: AccordionItem
**Icon**: Shield (lucide-react, h-4 w-4)
**Label**: "Remove Ads Subscription"
**State**: Expandable/collapsible accordion

#### Subscription Status Row
- **Type**: Status display row
- **Title**: "Subscription Status"  
- **Description**: 
  - Free users: "Current plan and billing"
  - Paid users: "Your ad-free subscription is active."
- **Badge**: 
  - Free: `bg-muted text-muted-foreground` "FREE"
  - Paid: `bg-green-100 text-green-700` "PAID"
- **Layout**: `flex items-center justify-between p-4 border rounded-lg`

#### Purchase Buttons (Free users only)
- **Remove Ads Button**:
  - **Price**: "Remove Ads — $4.99/mo"
  - **Caption**: "Hide banner ads permanently"
  - **Style**: `w-full min-h-[64px]` full-width pricing button
  - **Loading state**: Loader2 spinner when purchasing
- **Restore Button**:
  - **Price**: "Restore Purchases"  
  - **Caption**: "Restore previous purchases"
  - **Style**: Same as remove ads button

#### Debug Info (Development only)
- **Visibility**: `import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_IAP === "true"`
- **Content**: IAP Product ID display in monospace font
- **Style**: `p-3 bg-muted/30 rounded-lg border`

### Data & Storage
**Component Type**: AccordionItem  
**Icon**: Database (lucide-react, h-4 w-4)
**Label**: "Data & Storage"
**State**: Expandable/collapsible accordion

#### Content: DataStorageCard
- **Card wrapper**: `rounded-xl border bg-white p-4`
- **Header**: Database icon + "Data & Storage" title
- **Inner section**: `rounded-xl border p-4`
- **Description**: "Manage your incident data"
- **Delete Button**:
  - **Label**: "Delete all incident reports"
  - **Icon**: Trash2 (h-4 w-4)  
  - **Style**: `border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`
  - **Action**: Opens ConfirmModal with "DELETE" text requirement

### Support & Legal  
**Component Type**: AccordionItem
**Icon**: HelpCircle (lucide-react, h-4 w-4)
**Label**: "Support & Legal"
**State**: Expandable/collapsible accordion

#### Support & Legal Link Row
- **Type**: Clickable link row
- **Title**: "Support & Legal"
- **Description**: "Terms, Privacy, Contact Support, Rate App"  
- **Icon**: ChevronRight (h-4 w-4, right-aligned)
- **Action**: Opens SupportLegalModal
- **Style**: `settings-row cursor-pointer hover:bg-muted/20`

## Modal Components

### SupportLegalModal
**Overlay**: Fixed full-screen with backdrop click to close
**Container**: `max-w-2xl rounded-2xl bg-white shadow-xl`
**Header**: 
- **Title**: "ClearCase Terms, Privacy, and Cookie Policy"
- **Close button**: X icon in rounded hover area

**Content sections**:
- **Effective date**: "Aug 23, 2025"
- **Terms and Conditions** (full legal text)
- **Privacy Policy** (full legal text) 
- **Cookie Policy** (full legal text)

**Footer actions**:
- **App version**: "Version 1.0.0" (left-aligned)
- **Contact Support**: Opens mailto link to SBOMarketplaceapp@gmail.com
- **Rate the App**: Calls openStoreReview() function
- **Close**: Closes modal

### FloatingModal (Subscription Management)
**Overlay**: `cc-float-modal-overlay` with blur backdrop
**Container**: `cc-float-modal` max-width 640px
**Title**: "Manage Subscription"
**Content**: Restore purchases button with loading state

## Legal Copy

### Terms & Conditions (Full Text)

**Effective:** Aug 23, 2025

Welcome to **ClearCase**. By using our app and services ("Services"), you agree to these Terms.

#### 1. What ClearCase Is (and Isn't)
ClearCase helps you document workplace incidents and generate structured **AI reports** from your notes. We do **not** provide legal, medical, or HR advice. For advice, consult a qualified professional.

#### 2. Eligibility & Your Account  
You are responsible for your device, credentials, and all activity under your account. Keep passwords private and accurate information on file.

#### 3. License
We grant you a personal, non-transferable license to use the app for your own documentation. Don't copy, resell, reverse-engineer, or misuse the Services.

#### 4. Your Content
You retain ownership of the content you input or upload. You grant us the rights needed to operate the Services (e.g., store and process your content and generate AI reports for you). Do not upload content you lack rights to share.

#### 5. Acceptable Use
No unlawful, harassing, discriminatory, or infringing use. No malware or attempts to interfere with the app. Respect others' privacy and local recording laws.

#### 6. AI Features  
AI output may be inaccurate or incomplete. Review and edit before relying on it. You are responsible for verifying facts, complying with policy/law, and deciding how to use any output.

#### 7. Purchases & Subscriptions
Free tier includes **3 AI reports**. Manual logging is free. Paid options: **5 AI reports ($1.99)**, **60 AI reports ($19.99)**, **Unlimited ($99/month)**. Prices may change by store/region. Subscriptions renew until canceled in the App Store. Consumables are non-refundable once delivered except where required by law.

#### 8. Privacy
Our **Privacy Policy** explains how we collect, use, and protect data.

#### 9. Security
We use reasonable safeguards, but no system is 100% secure. Maintain backups and avoid sharing sensitive credentials.

#### 10. Termination
We may suspend or terminate access for breach, fraud, or misuse. You may stop using the Services at any time.

#### 11. Disclaimers & Liability
The Services are provided **"as is"** without warranties. To the extent allowed by law, we are not liable for indirect or consequential damages.

#### 12. Changes
We may update these Terms and will post the new effective date. Continued use means you accept changes.

#### 13. Contact
**Support:** SBOMarkteplace@gmail.com

### Privacy Policy (Full Text)

**Effective:** Aug 23, 2025

This notice describes how **ClearCase** ("we", "us") handles personal information.

#### Information We Collect
- **Account & contact**: name, email (if accounts are used).
- **Incident data** you enter (notes, categories, attachments).
- **Device data**: app version, device model, crash logs, and analytics (if you opt-in).
- **Purchases**: product IDs, receipts, subscription status (no full payment data—handled by the App Store).
- **Files you import/export** for backups.

#### How We Use It
- Provide and improve the app, generate AI reports, support purchases, backups, and customer support.
- Secure the service, prevent abuse, and meet legal obligations.
- With your consent, send helpful tips or diagnostics.

#### Sharing
- **Service providers** that help us run the app (e.g., cloud storage/processing) under confidentiality and security commitments.
- **Legal compliance** or to protect rights, safety, and security.
- We do **not** sell your personal information.

#### AI Processing
When you request an AI report, your text is processed by our AI/service providers to generate output. We minimize what's sent and do not use your data to train public models without your consent.

#### Data Retention
We keep data as long as needed for the Services or as required by law. You can export or delete your data (subject to legal holds).

#### Your Choices
- Use manual logging if you don't want AI processing.
- Opt-in/out of diagnostics and notifications in **Settings**.
- Access, update, or delete your data by contacting support.

#### Security
We use reasonable technical and organizational measures to protect data.

#### Children
The app is not intended for children under 13 (or applicable minimum age). Do not use if under the applicable age.

#### International Use
Your data may be processed in the U.S. or other countries with different laws than yours.

#### Changes
We'll update this policy as practices change and post a new effective date.

#### Contact
**Support:** SBOMarkteplace@gmail.com

### Cookie Policy (Full Text)

**Effective:** Aug 23, 2025

We use limited tracking technologies to make ClearCase work and improve it.

#### What We Use
- **Essential storage** (required): keeps you signed in, remembers preferences, supports purchases.
- **Analytics (optional)**: crash/error reporting and usage metrics if you opt-in.
- **No ad cookies.**

#### Your Choices
Control analytics and diagnostics in **Settings**. You can also clear local data or reinstall the app. Disabling essential storage may break core features.

#### Contact
Questions? **SBOMarkteplace@gmail.com**

## Design Tokens

### Colors (HSL values from index.css)
- **Primary**: `25 95% 53%` (Orange brand color)
- **Secondary**: `220 15% 96%` (Light gray)
- **Accent**: `214 100% 50%` (Blue)
- **Success**: `142 76% 36%` (Green)
- **Destructive**: `0 84% 60%` (Red)
- **Muted**: `220 13% 95%` (Subtle gray)
- **Border**: `220 13% 91%` (Subtle border)

### Typography Scale
- **Page title**: `text-3xl font-bold tracking-tight` (24px, bold)
- **Section headers**: `text-lg font-medium` (18px, medium)  
- **Row titles**: `text-base font-semibold` (16px, semibold)
- **Row descriptions**: `text-base text-muted-foreground` (16px, muted)
- **Badge text**: `text-xs font-medium` (12px, medium, uppercase)

### Spacing & Layout Classes
- **Page container**: `max-w-4xl mx-auto space-y-6 pb-safe-bottom`
- **Hero spacing**: `text-center pt-3 pb-2`  
- **Accordion sections**: `settings-section` (custom CSS class)
- **Section content**: `settings-section-content cc-acc-content`
- **Row layout**: `settings-row` with `settings-row-label`

## Behavior Notes

### Expand/Collapse Actions
- **Accordion sections**: Multiple can be open simultaneously (`type="multiple"`)
- **Section state**: Managed by Accordion component with chevron rotation
- **Smooth animations**: `accordion-down 0.2s ease-out` and `accordion-up 0.2s ease-in`

### Modal & Dialog Behavior  
- **SupportLegalModal**: Opens on "Support & Legal" row click
- **ConfirmModal**: Opens on "Delete all incidents" button click, requires typing "DELETE"
- **FloatingModal**: Opens on subscription management (currently unused in main flow)
- **Backdrop dismiss**: Click outside modal area to close

### State-Dependent Visibility
- **Purchase buttons**: Only visible when `!isSubscribed`
- **Subscription badge**: Changes color and text based on `isSubscribed` state
- **Debug info**: Only visible when `DEV && VITE_SHOW_DEV_IAP === "true"`
- **Loading states**: Buttons show Loader2 spinner during async operations

### Toast Notifications
- **Expected toasts**: Purchase success/failure, restore success/failure
- **Delete confirmation**: No explicit toast mentioned in code
- **Error handling**: Console logging with user-facing error states

### Native vs Web Differences
- **iOS specific**: Safe area insets for notch compatibility  
- **Capacitor features**: App review flow, email client integration
- **No native-only visibility**: All features available on web