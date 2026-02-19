# Customers Feature — Developer Documentation

This document explains how the **Customers List** and **Customer Details** pages are implemented in the Dokan React Boilerplate plugin. It covers the full stack: PHP backend (REST API, menu registration, asset enqueue) and React frontend (routing, data fetching, UI components).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [PHP Backend](#php-backend)
   - [Dashboard Menu Registration](#dashboard-menu-registration)
   - [REST API Controller](#rest-api-controller)
   - [Asset Registration & Enqueue](#asset-registration--enqueue)
4. [React Frontend](#react-frontend)
   - [Route Registration](#route-registration)
   - [Customer List (DataViews)](#customer-list-dataviews)
   - [Customer Details Page](#customer-details-page)
   - [Data Fetching Hooks](#data-fetching-hooks)
5. [Data Flow Diagram](#data-flow-diagram)
6. [API Reference](#api-reference)
7. [How to Extend](#how-to-extend)

---

## Architecture Overview

The Customers feature follows Dokan's official extension pattern:

```
PHP (server)                          React (client)
─────────────                         ──────────────
DashboardMenu                         index.tsx
  ├─ dokan_get_dashboard_nav filter     ├─ dokan-dashboard-routes filter
  ├─ dokan_query_var_filter             ├─ Registers /customers route
  └─ dokan_load_custom_template         └─ Registers /customers/:id route

CustomersController (REST API)        useCustomerData / useCustomerById
  ├─ GET /customers                     ├─ Fetches list via apiFetch
  └─ GET /customers/:id                 └─ Fetches single via apiFetch

Assets                                CustomerTable (DataViews)
  ├─ Registers JS/CSS                  CustomerDetails
  ├─ Enqueues on vendor dashboard
  └─ Passes API config via wp_localize_script
```

**Key principle**: The PHP side registers the sidebar menu, REST endpoints, and enqueues assets. The React side registers routes via WordPress hooks and renders the UI.

---

## Directory Structure

```
dokan-react-boilerplate/
├── includes/
│   ├── Assets.php                      # Script/style registration & enqueue
│   ├── DashboardMenu.php               # Sidebar menu + query var registration
│   ├── DokanReactBoilerplate.php        # Main bootstrap (wires everything)
│   └── REST/
│       └── CustomersController.php      # REST API endpoints
├── src/
│   └── features/
│       └── customers/
│           ├── index.tsx                # Entry point — route registration
│           ├── CustomersContainer.tsx    # Wrapper component
│           ├── CustomerTable.tsx         # DataViews table component
│           ├── CustomerDetails.tsx       # Single customer view
│           ├── constants.tsx             # Column definitions
│           ├── types.ts                 # TypeScript interfaces
│           ├── customers.scss           # Styles
│           └── hooks/
│               ├── useCustomerData.ts   # List data fetching hook
│               └── useCustomerById.ts   # Single customer fetching hook
├── templates/
│   └── customers.php                    # Legacy fallback template
└── assets/js/
    ├── customers.js                     # Built bundle (webpack output)
    ├── customers.css                    # Built styles
    └── customers.asset.php              # Dependency manifest (auto-generated)
```

---

## PHP Backend

### Dashboard Menu Registration

**File**: `includes/DashboardMenu.php`

The `DashboardMenu` class adds the "Customers" item to Dokan's vendor dashboard sidebar using three hooks:

| Hook | Purpose |
|------|---------|
| `dokan_get_dashboard_nav` | Adds menu item with icon, position, permission, and `react_route` key |
| `dokan_query_var_filter` | Registers `customers` as a valid query variable |
| `dokan_load_custom_template` | Provides a legacy PHP template fallback for non-React dashboards |

The `react_route` key is critical — it tells Dokan's layout that this menu item maps to a React route rather than a PHP template:

```php
$menus['customers'] = [
    'title'       => __( 'Customers', 'dokan-react-boilerplate' ),
    'icon'        => '<i class="fas fa-users"></i>',
    'url'         => dokan_get_navigation_url( 'customers' ),
    'pos'         => 55,
    'permission'  => 'dokandar',
    'react_route' => 'customers',  // Maps to the React route path
];
```

### REST API Controller

**File**: `includes/REST/CustomersController.php`  
**Namespace**: `WeLabs\DokanReactBoilerplate\REST`

Registered in `DokanReactBoilerplate::register_rest_route()` via the `rest_api_init` action.

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wp-json/dokan-react-boilerplate/v1/customers` | List customers for the current vendor |
| `GET` | `/wp-json/dokan-react-boilerplate/v1/customers/{id}` | Get a single customer by user ID |

#### Permission

Both endpoints require the `dokandar` capability (i.e., the user must be a Dokan vendor).

#### How the List Endpoint Works

1. Fetches all order IDs for the current vendor via `dokan()->order->all()`
2. Iterates orders to build a map of `customer_id => { order_count, total_spent, last_order_at }`
3. Filters by search term (matches `display_name` or `user_email` using `stripos`)
4. Sorts by order count descending, then by last order date descending
5. Paginates the result
6. Returns customer objects with pagination headers (`X-WP-Total`, `X-WP-TotalPages`)

#### Customer Object Shape

```json
{
  "id": 5,
  "display_name": "John Doe",
  "email": "john@example.com",
  "order_count": 12,
  "total_spent": 459.99,
  "last_order_at": "2026-01-15 14:30:00"
}
```

#### Query Parameters (List)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Current page number |
| `per_page` | integer | 10 | Items per page (max 100) |
| `search` | string | — | Filter by name or email |

### Asset Registration & Enqueue

**File**: `includes/Assets.php`

Assets are handled in two phases:

1. **Registration** (`wp_enqueue_scripts` at priority 5):
   - Reads `assets/js/customers.asset.php` (auto-generated by `@wordpress/scripts`)
   - Registers `dokan-react-boilerplate-customers` script with `dokan-react-components` as an additional dependency
   - Registers matching CSS if the file exists

2. **Enqueue** (`dokan_enqueue_scripts` at priority 15):
   - Only runs on the vendor dashboard (`dokan_is_seller_dashboard()`)
   - Enqueues the registered script and style
   - Passes runtime config via `wp_localize_script`:

```php
wp_localize_script(
    'dokan-react-boilerplate-customers',
    'dokanReactBoilerplateCustomers',
    [
        'api_namespace' => 'dokan-react-boilerplate/v1',
        'nonce'         => wp_create_nonce( 'wp_rest' ),
    ]
);
```

This makes `window.dokanReactBoilerplateCustomers.api_namespace` available to the React code at runtime.

---

## React Frontend

### Route Registration

**File**: `src/features/customers/index.tsx`

This is the webpack entry point. On `domReady`, it uses WordPress's `addFilter` hook to inject two routes into Dokan's dashboard router:

```typescript
wp.hooks.addFilter(
    'dokan-dashboard-routes',           // Dokan's route filter
    'dokan-react-boilerplate-customers', // Unique filter ID
    ( routes ) => {
        routes.push(
            {
                id: 'dokan-react-boilerplate-customers',
                title: 'Customers',
                element: <CustomersContainer />,
                path: 'customers',            // Matches the PHP react_route
                exact: true,
                capabilities: ['dokandar'],
            },
            {
                id: 'dokan-react-boilerplate-customer-details',
                title: 'Customer Details',
                element: <CustomerDetails />,
                path: 'customers/:id',        // Dynamic route param
                backUrl: '/customers',         // Back button target
            }
        );
        return routes;
    }
);
```

**Route properties explained**:

| Property | Purpose |
|----------|---------|
| `id` | Unique route identifier |
| `path` | URL path segment (relative to dashboard root) |
| `element` | React component to render |
| `exact` | Only match this exact path (not children) |
| `capabilities` | Required user capabilities |
| `backUrl` | Shows a back arrow linking to this path |
| `parent` | Empty string for top-level routes |

### Customer List (DataViews)

**File**: `src/features/customers/CustomerTable.tsx`

Uses Dokan's `DataViews` component (a wrapper around `@wordpress/dataviews`) to render a paginated, searchable table.

#### Key configuration:

- **`titleField: 'customer'`** — Designates the `customer` field as the primary/clickable column. This column is rendered by DataViews itself (with click handling), so it must be **excluded** from `view.fields` to avoid duplication.

- **`fields`** array in `view` state — Lists visible column IDs *except* `titleField`.

- **`onClickItem`** — Navigates to `/customers/{id}` when a row is clicked.

- **`isItemClickable`** — Returns `true` for all items to make every row clickable.

#### Column Definitions

**File**: `src/features/customers/constants.tsx`

| Column ID | Label | Renders |
|-----------|-------|---------|
| `customer` | Customer | Display name + email (title column) |
| `orders` | Orders | Order count |
| `total_spent` | Total Spent | Formatted currency amount |
| `last_order` | Last Order | Localized date string |

### Customer Details Page

**File**: `src/features/customers/CustomerDetails.tsx`

Receives the route `params.id` via Dokan's router props. Uses `useCustomerById` to fetch data for a single customer.

Renders a card with:
- Header: customer name and email
- Body: order count, total spent (formatted with `Intl.NumberFormat`), and last order date

The currency code is read from `window.dokanFrontend.currency.code` (provided by Dokan Lite's frontend localization).

### Data Fetching Hooks

#### `useCustomerData(view: ViewState)` — List Hook

**File**: `src/features/customers/hooks/useCustomerData.ts`

- Fetches from `GET /dokan-react-boilerplate/v1/customers`
- Passes `per_page`, `page`, and `search` as query args
- Uses `apiFetch` with `parse: false` to read pagination headers
- Re-fetches when `view.perPage`, `view.page`, or `view.search` change
- Supports request cancellation via a `cancelled` flag

**Returns**: `{ data: Customer[], isLoading: boolean, totalItems: number, error: string | null }`

#### `useCustomerById(id: number | null)` — Detail Hook

**File**: `src/features/customers/hooks/useCustomerById.ts`

- Fetches from `GET /dokan-react-boilerplate/v1/customers/{id}`
- Only fetches when `id` is truthy
- Provides a `refresh()` function to re-fetch
- Resets state when `id` changes

**Returns**: `{ customer: Customer | null, isLoading: boolean, error: string | null, refresh: () => void }`

Both hooks read the API base URL from `window.dokanReactBoilerplateCustomers.api_namespace`, falling back to `'dokan-react-boilerplate/v1'`.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Vendor Dashboard                                  │
│                                                                          │
│  Sidebar (PHP)              React Router              REST API (PHP)     │
│  ─────────────              ────────────              ──────────────     │
│                                                                          │
│  dokan_get_dashboard_nav    dokan-dashboard-routes    rest_api_init      │
│        │                          │                        │             │
│        ▼                          ▼                        ▼             │
│  "Customers" menu ──click──▶ /customers route     GET /customers        │
│                                   │                    ▲                 │
│                                   ▼                    │                 │
│                           CustomersContainer    useCustomerData()        │
│                                   │                    │                 │
│                                   ▼                    │                 │
│                            CustomerTable ──apiFetch───┘                 │
│                              (DataViews)                                 │
│                                   │                                      │
│                              row click                                   │
│                                   │                                      │
│                                   ▼                                      │
│                          /customers/:id route   GET /customers/{id}      │
│                                   │                    ▲                 │
│                                   ▼                    │                 │
│                           CustomerDetails ──apiFetch──┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### List Customers

```
GET /wp-json/dokan-react-boilerplate/v1/customers
```

**Headers (response)**:
- `X-WP-Total` — Total number of customers
- `X-WP-TotalPages` — Total number of pages

**Query params**: `page`, `per_page`, `search`

**Response** `200 OK`:
```json
[
  {
    "id": 5,
    "display_name": "John Doe",
    "email": "john@example.com",
    "order_count": 12,
    "total_spent": 459.99,
    "last_order_at": "2026-01-15 14:30:00"
  }
]
```

### Get Single Customer

```
GET /wp-json/dokan-react-boilerplate/v1/customers/{id}
```

**Response** `200 OK`:
```json
{
  "id": 5,
  "display_name": "John Doe",
  "email": "john@example.com",
  "order_count": 12,
  "total_spent": 459.99,
  "last_order_at": "2026-01-15 14:30:00"
}
```

**Error responses**:
- `401` — Unauthorized (not a vendor)
- `400` — Invalid ID
- `404` — Customer not found (no orders from this customer for the current vendor)

---

## How to Extend

### Adding a new column to the table

1. Add a field definition in `src/features/customers/constants.tsx`:

```tsx
{
    id: 'avatar',
    label: __( 'Avatar', 'dokan-react-boilerplate' ),
    render: ( { item }: { item: Customer } ) => (
        <img src={ item.avatar_url } alt={ item.display_name } />
    ),
    enableSorting: false,
    enableHiding: false,
},
```

2. If the field needs backend data, add the property to the REST response in `CustomersController::get_customers()` and update the `Customer` TypeScript interface in `types.ts`.

### Adding a new route (e.g. customer orders)

1. Add a new route in `src/features/customers/index.tsx`:

```tsx
{
    id: 'dokan-react-boilerplate-customer-orders',
    title: __( 'Customer Orders', 'dokan-react-boilerplate' ),
    element: <CustomerOrders />,
    path: 'customers/:id/orders',
    backUrl: '/customers/:id',
}
```

2. Create the `CustomerOrders` component, using `params.id` from the router props.

### Adding a REST endpoint

1. Add a new `register_rest_route()` call in `CustomersController::register_routes()`.
2. Add the callback method with proper `permission_callback`.
3. Create a corresponding React hook in `src/features/customers/hooks/`.

### Changing the API namespace

The namespace is configured in two places that must stay in sync:
- PHP: `CustomersController::$namespace` property
- JS: `wp_localize_script` in `Assets::enqueue_dashboard_scripts()` passes `api_namespace`

The React hooks read from `window.dokanReactBoilerplateCustomers.api_namespace` at runtime, so changing the PHP localization value is sufficient for the frontend.
