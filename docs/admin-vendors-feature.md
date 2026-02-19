# Admin Vendors Feature — Developer Documentation

This document explains how the **Admin Vendors** enhancements are implemented in the Dokan React Boilerplate plugin. It extends the WordPress admin vendor list (Dokan → Vendors) and the vendor create/edit forms with custom columns and fields. The implementation uses WordPress filters, the Slot/Fill pattern, and Dokan's existing REST API.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [PHP Backend](#php-backend)
   - [AdminVendors Class](#adminvendors-class)
   - [Hooks Used](#hooks-used)
   - [User Meta Storage](#user-meta-storage)
4. [React Frontend](#react-frontend)
   - [Asset Registration & Enqueue](#asset-registration--enqueue)
   - [Vendors List Columns](#vendors-list-columns)
   - [Passport Number Form Field](#passport-number-form-field)
   - [Tailwind CSS Setup](#tailwind-css-setup)
5. [Data Flow Diagram](#data-flow-diagram)
6. [Slot/Fill Reference](#slotfill-reference)
7. [How to Extend](#how-to-extend)

---

## Architecture Overview

The Admin Vendors feature extends Dokan's built-in admin vendor management:

```
PHP (server)                          React (client)
─────────────                         ──────────────
AdminVendors                          index.jsx
  ├─ dokan_rest_store_additional_fields   ├─ addFilter (column fields)
  ├─ dokan_update_vendor                  ├─ addFilter (view state)
  ├─ dokan_rest_stores_create_store      └─ registerPlugin + Fill (form field)
  └─ User meta: dokan_passport_number

Assets.php                            DataViews (Dokan)
  ├─ Registers admin-vendors.js          ├─ dokan-admin-vendors-list-column-fields
  └─ Enqueues on Dokan admin pages       └─ dokan_dokan_admin_vendors_table_dataviews_view
```

**Key principle**: The feature does **not** add new REST endpoints. It hooks into Dokan's existing `/dokan/v1/stores` API to add custom fields to the response and persist custom data via `dokan_update_vendor` and `dokan_rest_stores_create_store`.

---

## Directory Structure

```
dokan-react-boilerplate/
├── includes/
│   ├── AdminVendors.php                 # Saves/loads passport_number via hooks
│   ├── Assets.php                        # Registers & enqueues admin-vendors assets
│   └── DokanReactBoilerplate.php         # Bootstraps AdminVendors
├── src/
│   ├── features/
│   │   └── admin-vendors/
│   │       ├── index.jsx                 # Entry point — filters + plugins
│   │       ├── admin-vendors.scss        # Tailwind imports
│   │       └── tailwind.config.js        # Tailwind content paths
│   └── utils/
│       └── dokan-path.js                 # getDokanLitePath() for Tailwind base
├── postcss.config.js                    # tailwindcss + autoprefixer
└── assets/js/
    ├── admin-vendors.js                 # Built bundle (webpack output)
    ├── admin-vendors.css                # Built styles (Tailwind output)
    └── admin-vendors.asset.php           # Dependency manifest (auto-generated)
```

---

## PHP Backend

### AdminVendors Class

**File**: `includes/AdminVendors.php`  
**Namespace**: `WeLabs\DokanReactBoilerplate`

The `AdminVendors` class is instantiated in `DokanReactBoilerplate::init_classes()` and registers three hooks.

### Hooks Used

| Hook | Type | Purpose |
|------|------|---------|
| `dokan_rest_store_additional_fields` | Filter | Add `passport_number` to the vendor REST API response |
| `dokan_update_vendor` | Action | Save `passport_number` when a vendor is updated |
| `dokan_rest_stores_create_store` | Action | Save `passport_number` when a vendor is created via REST |

### User Meta Storage

- **Meta key**: `dokan_passport_number`
- **Storage**: User meta (`update_user_meta` / `get_user_meta`)
- **Sanitization**: `sanitize_text_field()` on save

#### Filter: `dokan_rest_store_additional_fields`

Adds `passport_number` to every vendor object returned by the Dokan REST API (e.g., `GET /dokan/v1/stores/{id}` or list endpoints). This ensures the field is available when:
- Loading the vendor edit form
- Displaying the passport column in the admin vendors table

```php
$additional_fields['passport_number'] = get_user_meta( $store->get_id(), self::META_KEY, true );
```

#### Action: `dokan_update_vendor`

Fires when `dokan()->vendor->update()` completes (e.g., when the admin saves the edit form). The `$data` array contains all form fields sent in the REST request, including `passport_number` from the Redux store.

```php
if ( isset( $data['passport_number'] ) ) {
    update_user_meta( $vendor_id, self::META_KEY, sanitize_text_field( $data['passport_number'] ) );
}
```

#### Action: `dokan_rest_stores_create_store`

Fires after a new vendor is created via `POST /dokan/v1/stores/`. The `passport_number` is read from the request params and saved to user meta.

```php
$passport_number = $request->get_param( 'passport_number' );
if ( ! empty( $passport_number ) ) {
    update_user_meta( $store->get_id(), self::META_KEY, sanitize_text_field( $passport_number ) );
}
```

---

## React Frontend

### Asset Registration & Enqueue

**File**: `includes/Assets.php`

- **Registration**: `register_admin_vendors_assets()` runs on `toplevel_page_dokan` or `dokan_page_dokan-dashboard` (Dokan admin pages).
- **Script**: `dokan-react-boilerplate-admin-vendors` depends on `dokan-admin-dashboard`.
- **Style**: `admin-vendors.css` is registered and enqueued alongside the script.

The assets are only loaded on the Dokan admin dashboard (Vendors list and Create/Edit vendor forms).

### Vendors List Columns

**File**: `src/features/admin-vendors/index.jsx`

Two filters extend the admin vendors DataViews table:

#### 1. Column Definitions — `dokan-admin-vendors-list-column-fields`

Adds two column field objects to the table:

| Column ID | Label | Renders |
|-----------|-------|---------|
| `passport_number` | Passport Number | Text value or em dash (`—`) if empty |
| `featured` | Featured | Green badge "Yes" or red badge "No" |

Both columns are inserted **after** the `phone` column. The `featured` badge uses Tailwind classes for styling (green: `bg-[#D4FBEF] text-[#00563F]`, red: `bg-[#FDE8E8] text-[#9B1C1C]`).

```javascript
const phoneIndex = updated.findIndex( ( f ) => f.id === 'phone' );
if ( phoneIndex !== -1 ) {
    updated.splice( phoneIndex + 1, 0, passportField, featuredField );
} else {
    updated.push( passportField, featuredField );
}
```

#### 2. View State — `dokan_dokan_admin_vendors_table_dataviews_view`

Ensures the new column IDs (`passport_number`, `featured`) are included in the DataViews `fields` array so the columns render. Fields are spliced after `phone` in the same order.

### Passport Number Form Field

The Passport Number input is injected into the vendor **create** and **edit** forms using the WordPress Plugins API (`registerPlugin`) and the Slot/Fill pattern.

#### Store Integration

- **Store**: `dokan/vendors` (Dokan Lite's vendor Redux store)
- **Selector**: `getCreateOrEditVendor()` — returns the current vendor object for create/edit
- **Action**: `setCreateOrEditVendor()` — updates the vendor in the store

When the user types in the passport field, the value is merged into the vendor object and stored in Redux. On form submit, the entire vendor (including `passport_number`) is sent to the REST API.

#### Plugin Registration

| Plugin ID | Fill Slot | Scope |
|-----------|-----------|-------|
| `dokan-react-boilerplate-vendor-passport-create` | `dokan-create-new-vendor-after-phone-store-information` | `dokan-admin-dashboard-vendor-form-dokan-create-new-vendor` |
| `dokan-react-boilerplate-vendor-passport-edit` | `dokan-edit-vendor-after-phone-store-information` | `dokan-admin-dashboard-vendor-form-dokan-edit-vendor` |

The `scope` must match the `PluginArea` scope in Dokan's vendor form. The form's `formKey` is passed to `PluginArea` as `dokan-admin-dashboard-vendor-form-${formKey}`.

### Tailwind CSS Setup

The Featured column badges use Tailwind utility classes. To ensure they compile:

1. **`postcss.config.js`** (plugin root): Loads `tailwindcss` and `autoprefixer`.
2. **`src/features/admin-vendors/tailwind.config.js`**: Extends Dokan Lite's base Tailwind config, sets `content` to `./src/features/admin-vendors/**/*.{js,jsx}`.
3. **`src/features/admin-vendors/admin-vendors.scss`**: Imports Tailwind with `@config './tailwind.config.js'`.
4. **`index.jsx`**: Imports `./admin-vendors.scss` so webpack processes it.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Dokan Admin Dashboard (Vendors)                          │
│                                                                              │
│  Vendor List Table                    Create/Edit Vendor Form                │
│  ──────────────────                   ─────────────────────                │
│                                                                              │
│  dokan-admin-vendors-list-column-fields    dokan-admin-dashboard-vendor-form │
│        │                                              │                      │
│        ▼                                              ▼                      │
│  + passport_number column              Slot: *-after-phone-store-information │
│  + featured column                              │                             │
│        │                                        │ Fill: PassportNumberField   │
│        ▼                                        ▼                             │
│  DataViews renders columns              useSelect(VENDOR_STORE)               │
│        │                                        │                             │
│        ▼                                        │ setCreateOrEditVendor()     │
│  GET /dokan/v1/stores (list)                    │                             │
│        │                                        ▼                             │
│        ▼                                 POST /dokan/v1/stores/{id}          │
│  dokan_rest_store_additional_fields            │                             │
│        │                                        │                             │
│        ▼                                        ▼                             │
│  + passport_number in response         dokan_update_vendor                   │
│                                               │                               │
│                                               ▼                               │
│                                        update_user_meta(dokan_passport_number)│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Slot/Fill Reference

Dokan Lite's vendor create/edit form exposes slots for plugins. The relevant slot is defined in `dokan-lite/src/admin/dashboard/pages/vendor-create-edit/form/General.tsx`:

| Slot Name | Location | formKey (Create) | formKey (Edit) |
|-----------|----------|------------------|----------------|
| `{formKey}-after-phone-store-information` | After the Phone field | `dokan-create-new-vendor` | `dokan-edit-vendor` |

The `PluginArea` scope is `dokan-admin-dashboard-vendor-form-${formKey}`. To inject UI, your `registerPlugin` must use:

- **Create form**: `scope: 'dokan-admin-dashboard-vendor-form-dokan-create-new-vendor'`
- **Edit form**: `scope: 'dokan-admin-dashboard-vendor-form-dokan-edit-vendor'`

---

## How to Extend

### Adding a new column to the vendors list

1. Add a field definition in the `dokan-admin-vendors-list-column-fields` filter callback:

```javascript
const myField = {
    id: 'my_custom_field',
    label: __( 'My Field', 'dokan-react-boilerplate' ),
    enableSorting: false,
    render: ( { item } ) => {
        if ( isLoading ) {
            return <span className={ loadingClass }>{ __( 'Loading', 'dokan-react-boilerplate' ) }</span>;
        }
        return <span>{ item?.my_custom_field || '—' }</span>;
    },
};
```

2. Add the field to the `updated` array (e.g., after `phone`):

```javascript
updated.splice( phoneIndex + 1, 0, myField );
```

3. Add the field ID to the view in the `dokan_dokan_admin_vendors_table_dataviews_view` filter:

```javascript
view.fields.splice( phoneIndex + 1, 0, 'my_custom_field' );
```

4. **Backend**: If the field needs persistence, add a filter for `dokan_rest_store_additional_fields` to include it in the API response, and hook into `dokan_update_vendor` and `dokan_rest_stores_create_store` to save it as user meta.

### Adding a new form field to create/edit

1. Create a component that uses `useSelect` and `useDispatch` with `dokan/vendors` to read and update the vendor object.
2. `registerPlugin` with the correct `scope` and a `Fill` that targets the appropriate slot name.
3. Add PHP hooks to save and load the field (same pattern as `passport_number` in `AdminVendors.php`).

### Using a different slot

To place a field elsewhere (e.g., after store name), inspect `General.tsx` for other `<Slot name={...} />` components and match the slot name in your `Fill`. Ensure your `scope` matches the form's `PluginArea` scope.
