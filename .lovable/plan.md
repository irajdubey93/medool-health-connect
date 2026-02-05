

# Medool PWA — Refined Implementation Plan

## Changes from Initial Plan

Based on your feedback, here are the key refinements:

| Requirement | Implementation |
|-------------|----------------|
| Env-driven API URL | `VITE_API_BASE_URL` environment variable, no hardcoding |
| Secure token storage | IndexedDB with encryption for refresh tokens; in-memory for access tokens |
| PWA caching | Static assets cached; authenticated API calls Network-Only; SAS URLs never cached |
| Slot UX | Show "Requested" vs "Confirmed" states clearly |
| Quote screens | Merge Preview + Create + Finalize into single flow |
| Status/Error mapping | Explicit tables added to plan |
| Analytics | Minimal launch events defined |
| Upload handling | Size limits, compression, retry with exponential backoff |

---

## 🔐 Authentication & Token Storage

**Access Token**
- Stored in-memory only (JavaScript variable)
- 15-minute lifetime
- Auto-refresh when ~2 minutes remaining

**Refresh Token (IndexedDB + Rotation)**
- Stored in IndexedDB (not localStorage) with AES encryption
- Database: `medool_auth`, Object Store: `tokens`
- On each refresh, old token is revoked by backend (rotation confirmed)
- On logout, clear IndexedDB entry
- Encryption key derived from device fingerprint

**Token Flow (Backend Confirmed)**
```
Login → access_token (15min) + refresh_token (30 days)
Refresh → new access_token + NEW refresh_token (old revoked)
Logout → refresh_token revoked server-side
```

---

## 🌐 Environment Configuration

**Environment Variables**
```env
VITE_API_BASE_URL=https://medool-audit-report.preview.emergentagent.com/api
```

**API Client Setup**
- Base URL from `import.meta.env.VITE_API_BASE_URL`
- No hardcoded URLs anywhere in codebase
- Fail fast if env variable missing

---

## 📲 PWA Caching Strategy

**Cached (CacheFirst)**
- App shell (index.html)
- Static assets (JS, CSS, images)
- Brand assets (logo, loader GIF)
- Fonts

**Network Only (Never Cached)**
- All authenticated API calls (`/api/*`)
- Report download SAS URLs (blob.core.windows.net)
- Google Places API responses

**Stale-While-Revalidate**
- Test catalog (`/api/tests`) — for faster search UX
- Cities list (`/api/cities`)

---

## 📅 Slot UX — Requested vs Confirmed

**User Flow**
1. User selects preferred slot during quote (`slot_start_at`)
2. Order created → Status shows "Requested: 9:00 AM"
3. OPS approves → Capacity consumed → Status shows "Confirmed: 9:00 AM"

**UI States**
| Order Status | Slot Display |
|--------------|--------------|
| OPS_REVIEW | "Requested: [time]" (amber badge) |
| OPS_APPROVED+ | "Confirmed: [time]" (green badge) |
| OPS_REJECTED | "Slot: [time]" (gray, strikethrough) |
| CANCELLED | "Slot: [time]" (gray, strikethrough) |

**Important**: Capacity is NOT consumed until OPS_APPROVED. If capacity is full at approval time, order may be rejected.

---

## 📋 Merged Quote Flow (3 screens → 1 flow)

**Original (3 screens)**
- Quote Preview Screen
- Quote Create Screen  
- Quote Finalize Screen

**Merged (1 multi-step flow)**

**Quote & Checkout Flow** (single screen with steps)

| Step | Action | API Call |
|------|--------|----------|
| 1. Review Cart | Show items, profile, address | Local state |
| 2. Select Slot | Time picker | Local state |
| 3. Apply Coupon | Optional | Local state |
| 4. View Labs | Show lab options + pricing | `POST /api/quotes/preview` |
| 5. Select Lab | User picks lab | Local state |
| 6. Create Quote | Persist selection | `POST /api/quotes` |
| 7. Finalize | Confirm lab | `POST /api/quotes/{id}/finalize` |
| 8. Place Order | COD confirmation | `POST /api/orders` |

**UX**: Wizard-style with back navigation, progress indicator at top

---

## 📊 Status → UI Mapping Table

**Order Status States**
| Backend Status | Badge Color | Icon | Label | User Action |
|----------------|-------------|------|-------|-------------|
| `OPS_REVIEW` | Amber | Clock | "Under Review" | Wait / Cancel |
| `OPS_APPROVED` | Blue | CheckCircle | "Approved" | Wait / Cancel |
| `OPS_REJECTED` | Red | XCircle | "Rejected" | View reason |
| `SCHEDULED` | Blue | Calendar | "Scheduled" | View details |
| `COLLECTED` | Blue | FlaskConical | "Sample Collected" | Track |
| `DELIVERED_TO_LAB` | Blue | Building | "At Lab" | Track |
| `REPORTS_RECEIVED` | Green | FileCheck | "Reports Ready" | Download |
| `COMPLETED` | Green | CheckCircle2 | "Completed" | Download |
| `CANCELLED` | Gray | Ban | "Cancelled" | View reason |

**Rider Assignment Status**
| Backend Status | UI Display |
|----------------|------------|
| `PENDING` | "Waiting for dispatch..." |
| `OFFERING` | "Finding rider nearby..." |
| `ASSIGNED` | "Rider assigned: [Name]" |
| `CANCELLED` | "Dispatch cancelled" |
| `FAILED` | "No rider available" |

---

## ❌ Backend Error Code → UI Message Mapping

**Authentication Errors**
| Code | HTTP | UI Message |
|------|------|------------|
| `invalid_otp` | 401 | "Invalid OTP. Please try again." |
| `too_many_attempts` | 401 | "Too many failed attempts. Request a new OTP." |
| `otp_cooldown` | 422 | "Please wait before requesting another OTP." |
| `rate_limit` | 429 | "Too many requests. Please wait a moment." |
| `token_expired` | 401 | Auto-refresh (silent) |
| `invalid_refresh_token` | 401 | Redirect to login |

**Profile & Address Errors**
| Code | HTTP | UI Message |
|------|------|------------|
| `user_type_locked` | 400 | "Cannot change patient type after booking." |
| `profile_inactive` | 400 | "This profile is no longer active." |
| `not_found` | 404 | "Not found." |

**Quote & Order Errors**
| Code | HTTP | UI Message |
|------|------|------------|
| `quote_expired` | 422 | "Quote expired. Please create a new quote." |
| `quote_not_draft` | 422 | "Quote already finalized." |
| `quote_not_finalized` | 422 | "Please select a lab first." |
| `invalid_lab_selection` | 422 | "Selected lab is no longer available." |
| `coupon_limit_exceeded` | 422 | "Coupon limit reached. Please remove coupon." |
| `capacity_exceeded` | 422 | "Selected slot is no longer available." |

**Cancellation Errors**
| Code | HTTP | UI Message |
|------|------|------------|
| `cannot_cancel_after_dispatch` | 422 | "Cannot cancel — rider already assigned." |
| `cannot_cancel_after_collection` | 422 | "Cannot cancel — samples already collected." |
| `order_not_cancellable` | 422 | "This order cannot be cancelled." |

**Generic Errors**
| Code | HTTP | UI Message |
|------|------|------------|
| `validation_error` | 422 | Show field-specific errors |
| `forbidden` | 403 | "You don't have permission." |
| `internal_error` | 500 | "Something went wrong. Please try again." |
| Network error | - | "No internet connection. Retry?" |

---

## 📤 Prescription Upload Handling

**File Constraints**
| Constraint | Value |
|------------|-------|
| Max file size | 10MB (compressed) |
| Allowed types | JPEG, PNG, PDF |
| Max dimensions | 4096 x 4096 px |

**Compression Pipeline**
1. If image > 2MB, compress to 80% quality
2. If still > 5MB, resize to max 2048px width
3. If still > 10MB, reject with clear error

**Retry Logic**
- Exponential backoff: 1s → 2s → 4s → 8s
- Max 3 retries
- Show progress percentage during upload
- Resume not supported (full retry)

**UI States**
| State | Display |
|-------|---------|
| Selecting | File picker / Camera UI |
| Compressing | "Optimizing image..." |
| Uploading | Progress bar (0-100%) |
| Processing | "Analyzing prescription..." |
| Success | Green checkmark + navigate to extraction |
| Failed | Red error + "Retry" button |

---

## 📈 Minimal Analytics Events

**Core Events (Launch)**
| Event | Trigger | Properties |
|-------|---------|------------|
| `app_open` | App launch | `source`, `platform` |
| `login_start` | OTP requested | `phone_hash` |
| `login_success` | OTP verified | `user_id`, `is_new_user` |
| `profile_created` | New profile | `relation`, `user_type` |
| `prescription_uploaded` | Upload complete | `profile_id`, `source` |
| `cart_updated` | Item added/removed | `item_count`, `from_extraction` |
| `quote_created` | Quote persisted | `item_count`, `selected_lab_id` |
| `order_placed` | Order created | `order_id`, `total_paise` |
| `order_cancelled` | User cancels | `order_id`, `status_at_cancel` |
| `report_downloaded` | Report opened | `order_id`, `report_type` |

**Implementation**
- Event queue with offline support
- Batch send every 30 seconds or on 10 events
- Anonymized (no PII in events)
- Console logging in development

---

## 🏗️ Technical Architecture Summary

**State Management**
- React Query for API data + caching
- React Context for auth state + active profile
- Local state for cart (persisted to sessionStorage)

**API Client**
- Axios instance with interceptors
- Auto-attach Bearer token
- Auto-refresh on 401 + retry
- Error envelope parsing

**PWA Setup**
- vite-plugin-pwa
- Workbox for caching strategies
- installPrompt handling
- Offline indicator

---

## 📱 Final Screen Count: 16

1. **Login** (OTP flow)
2. **Home** (Dashboard with quick actions)
3. **Profile List**
4. **Profile Create/Edit**
5. **Address List**
6. **Address Create/Edit**
7. **Test Search**
8. **Test Detail**
9. **Prescription Upload**
10. **Prescription List**
11. **Cart Assist** (AI extraction results)
12. **Quote & Checkout** (merged flow)
13. **Order List**
14. **Order Detail** (includes timeline, rider, reports)
15. **Order Cancel Modal**
16. **Report Viewer** (PDF/Image display)

---

## ✅ Success Criteria

- [ ] User can complete end-to-end booking on mobile web
- [ ] All API calls use `VITE_API_BASE_URL`
- [ ] Refresh tokens stored securely in IndexedDB
- [ ] PWA works offline for static content
- [ ] Error messages match backend error codes
- [ ] Analytics events fire correctly
- [ ] Prescription uploads compress and retry properly
- [ ] Slot shows "Requested" vs "Confirmed" correctly

