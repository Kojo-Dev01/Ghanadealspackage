# GhanaDeals — Changelog

Updates are grouped by **date → session**. A new session begins when there is a gap of 5+ hours since the last recorded change.

---

## 2026-04-27

### Session 1

**Authentication System Overhaul**
- `types/api.ts` — Added `SignupVerificationResponse`, `VerifyOtpPayload`, `SendOtpPayload`, `SendOtpResponse`, `CancelVerificationPayload`, `UpgradeToSellerPayload`, `UpgradeToSellerResponse`, `ForgotPasswordPayload`, `ResetPasswordPayload`. Fixed `SignupPayload.accountType` to `'buyer'` only (removed agent toggle)
- `services/api.ts` — `ApiRequestError` now carries a `data` field with the full error body (needed to read `needsVerification`, `userId`, `verificationToken` from 403 responses)
- `services/auth.ts` — Added `verifyOtp`, `sendOtp`, `cancelVerification`, `forgotPassword`, `resetPassword`, `upgradeToSeller`
- `stores/auth-store.ts` — `signup` now returns `SignupVerificationResponse` (no session issued until OTP verified); added `verifyOtp` action (issues session after verification) and `upgradeToSeller` (updates token + agent profile)
- `app/(auth)/signup.tsx` — Removed agent account type toggle; after signup routes to `verify-otp` screen with params instead of home
- `app/(auth)/login.tsx` — Handles 403 `needsVerification` → routes to `verify-otp`; handles `suspended_reason` → shows suspension message; wired up Forgot Password link to new screen

**New Screens — Auth**
- `app/(auth)/verify-otp.tsx` *(created)* — 6-box OTP input, auto-advance on digit entry, backspace handling, 60s resend cooldown, cancel with account deletion confirmation dialog
- `app/(auth)/forgot-password.tsx` *(created)* — Email input → POST to send reset link → success state view

**New Screen — Account Upgrade**
- `app/(buyer)/upgrade.tsx` *(created)* — 3-step seller upgrade flow: (1) company name + phone + multi-select across all 16 Ghana regions, (2) KYC document upload (Ghana Card front+back or Passport) via `expo-image-picker`, (3) success screen with link to seller dashboard

**Support Page**
- `app/(buyer)/support.tsx` *(created)* — FAQ accordion with 4 sections (Buying & Renting, Account & Profile, Listing a Property, Payments & Transactions), search bar with live case-insensitive filtering across questions and answers, auto-expand matched items, no-results state, contact cards (email + phone via `Linking.openURL`)
- `app/(buyer)/_layout.tsx` — Added `'support'` to `HIDDEN_TABS` so it does not appear in the bottom tab bar
- `app/(buyer)/profile.tsx` — Wired **Inquiries** button → `/(buyer)/messages`; **Support** button → `/(buyer)/support`

**Maps — Google Maps Migration**
- `components/google-map.tsx` *(created)* — Full Google Maps component with `PhotoCardMarker` and `tracksViewChanges={!loaded}` performance fix
- `components/map-view.native.tsx` — Platform split; exports `SafeMapView`, `MapMarker`, `CameraPosition`, `CameraMoveEvent`, `MapAvailable = true`
- `app.config.js` — Dynamic config injecting `GOOGLE_MAPS_API_KEY` into Android `config.googleMaps` and iOS `config.googleMapsApiKey`
- Replaced Leaflet/WebView map on search page and property detail with `react-native-maps` (`PROVIDER_GOOGLE`)
- Added photo-card marker on property detail map
- Fixed price marker tap handling and photo card image loading (`pointerEvents="none"`)

**Property Detail**
- `app/property/[id].tsx` — Replaced "Send Inquiry" bottom CTA → "Message Agent" button
- Removed inquiry modal entirely from property detail

**Chat — @ Property Tagging**
- `types/chat.ts` — Added `MessageType = 'text' | 'image' | 'file' | 'property_ref'`, `PropertyRefData` interface, `deleted_at: string | null` to `ChatMessage`, `messageType` and `propertyRefId` to `SendMessagePayload`
- `types/property.ts` — Added `ListingType = 'sale' | 'rent' | 'new' | 'land' | 'uncompleted'`
- `services/chat.ts` — Added `getSellerProperties(conversationId)` → `GET /v1/conversations/:id/seller-properties`; `sendMessage` now accepts `property_ref` message type
- `app/chat/[id].tsx` — Built full @ property picker: triggers on `@` in text input (no `conversationId` guard), shows horizontal scrollable property cards, lets user tag one property; adds preview strip above input when tagged; sends as `property_ref` message type with `propertyRefId`
- Added moderation placeholder for admin-deleted messages (dashed gray bubble, `Ban` icon, italic text)
- Added fallback rendering for `property_ref` messages where the referenced property has been deleted
- Fixed @ picker for new conversations: passes `propertyImage`, `propertyPrice`, `propertyLocation` from `app/property/[id].tsx` (×2 push sites) and `app/(buyer)/search.tsx` so `effectiveProperties` fallback has real image and price
- Added `isLoading` spinner inside picker while seller properties fetch (existing conversations)
- Changed price display to only render when `price > 0` (avoids showing "GHS 0" fallback)
- Updated input placeholder to `"Type a message… use @ to tag a property"`

**Search Page**
- `app/(buyer)/search.tsx` — Added `'Uncompleted'` tab to `LISTING_TABS`, mapped to `listingType: 'uncompleted'` in `LISTING_TAB_MAP`, added `TAB_FILTER_CONFIG` entry (price GHS 100k–10M, shows type + beds filters), added `tabFromParam('uncompleted')` for deep-link support

**EAS Build Configuration**
- `eas.json` — Added `env: { GOOGLE_MAPS_API_KEY: "$GOOGLE_MAPS_API_KEY" }` to `development`, `preview`, and `production` build profiles
- Registered `GOOGLE_MAPS_API_KEY` as an EAS project secret via `eas secret:create`

---

<!-- Add new entries above this line, newest session first within each date block -->
