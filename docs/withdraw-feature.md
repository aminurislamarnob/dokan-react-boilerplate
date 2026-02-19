# Withdraw Feature — Developer Documentation

This document explains how the **Withdraw Balance** override is implemented in the Dokan React Boilerplate plugin. It replaces Dokan Lite's default Balance card on the vendor withdraw page with a custom implementation that uses the Slot/Fill pattern. No custom REST endpoints are added — the feature relies entirely on Dokan's existing withdraw API.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [PHP Backend](#php-backend)
4. [React Frontend](#react-frontend)
   - [Plugin Registration & Slot/Fill](#plugin-registration--slotfill)
   - [Balance Component](#balance-component)
   - [Data Fetching Hooks](#data-fetching-hooks)
   - [Asset Registration & Enqueue](#asset-registration--enqueue)
5. [Data Flow Diagram](#data-flow-diagram)
6. [Slot/Fill Reference](#slotfill-reference)
7. [API Reference](#api-reference)
8. [How to Extend](#how-to-extend)

---

## Architecture Overview

The Withdraw feature **extends** Dokan's withdraw page by injecting a custom Balance card **before** the main content. Dokan's default Balance card is hidden via CSS.

```
Dokan (built-in)                      Boilerplate (override)
─────────────                         ─────────────────────
ContentArea.tsx                       index.jsx
  └─ Slot: dokan-layout-content-area-before  └─ registerPlugin (scope: dokan-withdraw)
       │                                       └─ Fill → Balance component
       └─ children (withdraw route content)
            └─ dokan-withdraw-wrapper
                 ├─ Balance (Dokan) ← HIDDEN by withdraw-override.scss
                 ├─ PaymentDetails
                 └─ PaymentMethods
```

**Key principle**: The feature does **not** add new routes or REST endpoints. It uses `registerPlugin` with scope `dokan-withdraw` so the plugin only renders on the withdraw route, and fills the `dokan-layout-content-area-before` slot to show a custom Balance card above the rest of the page. CSS hides Dokan's built-in Balance to avoid duplication.

---

## Directory Structure

```
dokan-react-boilerplate/
├── includes/
│   └── Assets.php                      # Registers withdraw script/style
├── src/
│   └── features/
│       └── withdraw/
│           ├── index.jsx                # Entry point — plugin registration
│           ├── Balance.jsx             # Custom Balance card component
│           ├── withdraw-override.scss   # Hides Dokan's default Balance
│           └── hooks/
│               ├── useBalance.js        # Fetches balance from API
│               ├── useWithdrawRequests.js # Fetches withdraw requests (for loading state)
│               └── useWithdrawSettings.js # Fetches withdraw settings (unused in Balance)
└── assets/js/
    ├── withdraw.js                     # Built bundle (webpack output)
    ├── withdraw.css                    # Built styles
    └── withdraw.asset.php               # Dependency manifest (auto-generated)
```

**Note**: There is **no PHP class** for the withdraw feature. All logic is frontend-only.

---

## PHP Backend

The withdraw feature has no PHP backend. It uses Dokan Lite's existing REST APIs:

- `GET /dokan/v1/withdraw/balance` — Current balance and minimum withdraw amount
- `GET /dokan/v1/withdraw` — Withdraw requests (used for loading-state coordination)

The only PHP involvement is asset registration and enqueue in `Assets.php` (see [Asset Registration & Enqueue](#asset-registration--enqueue)).

---

## React Frontend

### Plugin Registration & Slot/Fill

**File**: `src/features/withdraw/index.jsx`

Uses the WordPress Plugins API to inject the Balance component into Dokan's layout:

```javascript
registerPlugin( 'dokan-react-boilerplate-withdraw-balance', {
    render: WithdrawBalanceOverride,
    scope: 'dokan-withdraw',
} );
```

- **Scope**: `dokan-withdraw` — Matches the route ID in Dokan's routing (`/withdraw`). The plugin only renders when the user is on the withdraw page.
- **Fill**: `dokan-layout-content-area-before` — Renders the Balance **before** the main content area (which contains Dokan's Balance, PaymentDetails, and PaymentMethods).

Dokan's `ContentArea` component defines this slot in `dokan-lite/src/layout/ContentArea.tsx`:

```jsx
<Slot name="dokan-layout-content-area-before" />
{ children }
<Slot name="dokan-layout-content-area-after" />
```

### Balance Component

**File**: `src/features/withdraw/Balance.jsx`

A custom Balance card that displays:

| Field | Source | Description |
|-------|--------|-------------|
| Current Balance | `useBalance().data.current_balance` | Vendor's available balance |
| Minimum Withdraw Amount | `useBalance().data.withdraw_limit` | Admin-configured minimum |
| Request Withdraw button | Conditional | Shown only when `window.dokanFrontend?.withdraw?.isManualWithdrawEnable` is truthy; links to `paymentSettingUrl` |

#### Loading State

The Balance shows a skeleton loader until:

1. `useBalance()` has finished loading (`bodyData.isLoading === false`)
2. `useWithdrawRequests(true)` has finished its initial fetch (`masterLoading === false`)

The withdraw-requests fetch is triggered in `useEffect` when `currentUser` is available, with params: `{ per_page: 10, page: 1, status: 'pending', user_id }`. The actual request data is not displayed in the Balance card — it is used only to coordinate the loading state (matching Dokan's Balance behavior).

#### Request Withdraw Button

When manual withdraw is enabled, a link is shown that points to the payment settings URL (`window.dokanFrontend.withdraw.paymentSettingUrl`). The user configures payment methods there before requesting a withdrawal.

### Data Fetching Hooks

#### `useBalance()`

**File**: `src/features/withdraw/hooks/useBalance.js`

- **API**: `GET /dokan/v1/withdraw/balance`
- **Returns**: `{ data, isLoading, error, refresh }`
- **Data shape**: `{ current_balance, withdraw_limit }` (from Dokan's response)

#### `useWithdrawRequests(defaultLoader = false)`

**File**: `src/features/withdraw/hooks/useWithdrawRequests.js`

- **API**: `GET /dokan/v1/withdraw` with query params (`per_page`, `page`, `status`, `user_id`, etc.)
- **Returns**: `{ data, isLoading, error, fetchWithdrawRequests, refresh, totalItems, totalPages }`
- Uses `parse: false` to read `X-WP-Total` and `X-WP-TotalPages` headers for pagination
- `lastPayload` ref stores the last request params so `refresh()` can re-fetch with the same args

#### `useWithdrawSettings()`

**File**: `src/features/withdraw/hooks/useWithdrawSettings.js`

- **API**: `GET /dokan/v2/withdraw/settings`
- **Returns**: `{ data, setData, isLoading, error, refresh }`
- **Note**: Not used in the Balance component. Available for future extensions (e.g., payment method configuration).

### CSS Override

**File**: `src/features/withdraw/withdraw-override.scss`

Hides Dokan's default Balance card when the boilerplate's Balance is shown:

```scss
.dokan-withdraw-wrapper.dokan-react-withdraw > div:first-child {
    display: none;
}
```

Dokan's withdraw page structure is `dokan-withdraw-wrapper > [Balance, PaymentDetails, PaymentMethods]`. The first child is Dokan's Balance — this rule hides it to avoid duplicate cards.

### Asset Registration & Enqueue

**File**: `includes/Assets.php`

- **Registration**: `register_withdraw_assets()` is called from `register_react_assets()` on `wp_enqueue_scripts` (priority 5)
- **Script**: `dokan-react-boilerplate-withdraw` — depends on `dokan-react-components` and `dokan-react-frontend`
- **Style**: `withdraw.css` — depends on `dokan-react-components`
- **Enqueue**: In `enqueue_dashboard_scripts()`, when `dokan_is_seller_dashboard()` is true

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Vendor Dashboard → Withdraw (/withdraw)                  │
│                                                                              │
│  Route: dokan-withdraw                                                       │
│        │                                                                     │
│        ▼                                                                     │
│  PluginArea (scope: dokan-withdraw)                                          │
│        │                                                                     │
│        ▼                                                                     │
│  WithdrawBalanceOverride (Fill: dokan-layout-content-area-before)            │
│        │                                                                     │
│        ▼                                                                     │
│  Balance                                                                     │
│        │                                                                     │
│        ├── useBalance() ──────► GET /dokan/v1/withdraw/balance               │
│        │         │                                                           │
│        │         └── current_balance, withdraw_limit                         │
│        │                                                                     │
│        ├── useWithdrawRequests() ──► GET /dokan/v1/withdraw?...              │
│        │         │                  (for loading state only)                 │
│        │         └── masterLoading                                         │
│        │                                                                     │
│        └── window.dokanFrontend.withdraw                                     │
│                ├── isManualWithdrawEnable → show Request Withdraw btn        │
│                └── paymentSettingUrl → link target                          │
│                                                                              │
│  ContentArea children: Balance (hidden) + PaymentDetails + PaymentMethods    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Slot/Fill Reference

| Slot Name | Location | Scope | Purpose |
|-----------|----------|-------|---------|
| `dokan-layout-content-area-before` | `ContentArea.tsx` | `dokan-withdraw` (route) | Renders before the main withdraw content |

The `PluginArea` in Dokan's layout uses `scope={ route.id }`. When the route is `dokan-withdraw`, plugins with `scope: 'dokan-withdraw'` render. The boilerplate's Balance fills the slot that appears before the route's children.

---

## API Reference

The feature uses Dokan Lite's withdraw REST API. No custom endpoints are added.

### Get Balance

```
GET /wp-json/dokan/v1/withdraw/balance
```

**Response** `200 OK`:

```json
{
  "current_balance": "1250.00",
  "withdraw_limit": "50.00"
}
```

### Get Withdraw Requests

```
GET /wp-json/dokan/v1/withdraw?per_page=10&page=1&status=pending&user_id=123
```

**Headers (response)**:
- `X-WP-Total` — Total number of requests
- `X-WP-TotalPages` — Total pages

**Response** `200 OK`: Array of withdraw request objects.

---

## How to Extend

### Adding content to the withdraw page

1. Use `registerPlugin` with `scope: 'dokan-withdraw'` so your plugin renders on the withdraw route.
2. Use `Fill` with `name="dokan-layout-content-area-before"` to add content before the main area, or `name="dokan-layout-content-area-after"` to add after it.

### Replacing more of the withdraw page

To override additional sections (e.g., PaymentDetails, PaymentMethods), you would need to either:

- Use `addFilter( 'dokan-dashboard-routes', ... )` to replace the entire withdraw route's `element` with a custom component (similar to the store-seo feature), or
- Find if Dokan exposes Slots within those components and fill them.

### Using `useWithdrawSettings`

The `useWithdrawSettings` hook is available but not used in the Balance component. You can use it to build a settings panel or to conditionally show/hide UI based on withdraw configuration.

### Changing the Balance card layout

Edit `Balance.jsx` to adjust the layout, labels, or add new fields. Ensure the API response includes any new data you need, or extend Dokan's balance endpoint via PHP filters if required.
