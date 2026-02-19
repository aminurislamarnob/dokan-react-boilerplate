# Store SEO Feature — Developer Documentation

This document explains how the **Store SEO** form override is implemented in the Dokan React Boilerplate plugin. It extends Dokan Pro's built-in Store SEO settings by replacing the form with a custom React implementation that adds **LinkedIn** fields (Title, Description, Image) alongside the existing Facebook (Open Graph) and Twitter fields.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Requirements](#requirements)
3. [Directory Structure](#directory-structure)
4. [PHP Backend](#php-backend)
   - [StoreSeo Class](#storeseo-class)
   - [Settings API Integration](#settings-api-integration)
5. [React Frontend](#react-frontend)
   - [Route Override](#route-override)
   - [StoreSeoForm Component](#storeseoform-component)
   - [Supporting Components](#supporting-components)
   - [Asset Registration & Enqueue](#asset-registration--enqueue)
6. [Data Flow](#data-flow)
7. [API Reference](#api-reference)
8. [How to Extend](#how-to-extend)

---

## Architecture Overview

The Store SEO feature **overrides** Dokan Pro's Store SEO route instead of adding a new one:

```
PHP (server)                          React (client)
─────────────                         ──────────────
StoreSeo (boilerplate)                 index.jsx
  └─ dokan_vendor_settings_api_store_seo   └─ dokan-dashboard-routes filter (priority 20)
       Adds LinkedIn fields to schema        Replaces settings-store-seo element

Dokan Pro (existing)                  Dokan Pro StoreSeoForm (replaced)
  └─ /dokan/v2/settings/store_seo API        └─ By boilerplate StoreSeoForm
```

**Key principle**: The feature runs **after** Dokan Pro registers the `settings-store-seo` route (priority 10). At priority 20, the boilerplate finds that route and replaces its `element` with the extended `StoreSeoForm`, which includes LinkedIn fields. The PHP side registers the LinkedIn field definitions so the Dokan V2 Settings API accepts and persists them.

---

## Requirements

- **Dokan Pro** must be installed and active. The feature checks for `WeDevs\DokanPro\StoreSeo` before instantiating.
- The vendor must have the `dokan_view_store_seo_menu` capability to access the Store SEO page.

---

## Directory Structure

```
dokan-react-boilerplate/
├── includes/
│   ├── StoreSeo.php                    # Adds LinkedIn fields to settings schema
│   ├── Assets.php                     # Registers store-seo script/style
│   └── DokanReactBoilerplate.php      # Bootstraps StoreSeo (when Dokan Pro active)
├── src/
│   └── features/
│       └── store-seo/
│           ├── index.jsx               # Entry point — route override
│           └── components/
│               ├── StoreSeoForm.jsx    # Main form (replaces Dokan Pro's)
│               ├── StoreSeoSkeleton.jsx # Loading skeleton
│               └── ImagePreview.jsx    # Reusable image upload + preview
└── assets/js/
    ├── store-seo.js                   # Built bundle (webpack output)
    ├── store-seo.css                  # Built styles
    └── store-seo.asset.php            # Dependency manifest (auto-generated)
```

---

## PHP Backend

### StoreSeo Class

**File**: `includes/StoreSeo.php`  
**Namespace**: `WeLabs\DokanReactBoilerplate`  
**Instantiation**: Only when `class_exists( 'WeDevs\DokanPro\StoreSeo' )` is true (in `DokanReactBoilerplate::init_classes()`).

### Settings API Integration

| Hook | Purpose |
|------|---------|
| `dokan_vendor_settings_api_store_seo` | Add LinkedIn field definitions to the Store SEO schema |

The filter receives the existing `$store_seo` array (field definitions) and returns it merged with three new LinkedIn fields:

| Field ID | Type | Description |
|----------|------|-------------|
| `dokan-seo-linkedin-title` | text | LinkedIn Title |
| `dokan-seo-linkedin-desc` | text | LinkedIn Description |
| `dokan-seo-linkedin-image` | image | LinkedIn Image |

These IDs match the format expected by the Dokan V2 Settings API (`/dokan/v2/settings/store_seo`). The API stores them as vendor settings and returns them in the GET response.

---

## React Frontend

### Route Override

**File**: `src/features/store-seo/index.jsx`

Uses `addFilter( 'dokan-dashboard-routes', ... )` at **priority 20** so it runs after Dokan Pro (priority 10). The callback:

1. Finds the route with `id === 'settings-store-seo'`
2. Replaces it with a modified copy: same `path`, `parent`, `capabilities`, etc., but:
   - `element: <StoreSeoForm />` — the boilerplate's extended form
   - `title: <VisitStore>{ __( 'Store SEO', ... ) }</VisitStore>` — optional title override

```javascript
const index = routes.findIndex( ( r ) => r.id === 'settings-store-seo' );
if ( index !== -1 ) {
    routes[ index ] = {
        ...routes[ index ],
        title: <VisitStore>{ __( 'Store SEO', 'dokan-react-boilerplate' ) }</VisitStore>,
        element: <StoreSeoForm />,
    };
}
return routes;
```

### StoreSeoForm Component

**File**: `src/features/store-seo/components/StoreSeoForm.jsx`

A full replacement for Dokan Pro's Store SEO form. It includes:

- **Existing fields**: SEO Title, Meta Description, Meta Keywords; Facebook (OG) Title, Description, Image; Twitter Title, Description, Image
- **New fields**: LinkedIn Title, Description, Image

#### Field-to-API mapping (`mapKeys`)

The form uses friendly keys internally (e.g. `meta_title`, `linkedin_image`). The API uses `id` strings like `dokan-seo-meta-title`, `dokan-seo-linkedin-image`. The `mapKeys` object translates between them:

| API ID | Form key |
|--------|----------|
| `dokan-seo-meta-title` | `meta_title` |
| `dokan-seo-meta-desc` | `meta_desc` |
| `dokan-seo-meta-keywords` | `meta_keywords` |
| `dokan-seo-og-title` | `og_title` |
| `dokan-seo-og-desc` | `og_desc` |
| `dokan-seo-og-image` | `og_image` |
| `dokan-seo-twitter-title` | `twitter_title` |
| `dokan-seo-twitter-desc` | `twitter_desc` |
| `dokan-seo-twitter-image` | `twitter_image` |
| `dokan-seo-linkedin-title` | `linkedin_title` |
| `dokan-seo-linkedin-desc` | `linkedin_desc` |
| `dokan-seo-linkedin-image` | `linkedin_image` |

#### Data flow

1. **Fetch**: `GET /dokan/v2/settings/store_seo` returns an array of `{ id, value, url? }`
2. **Transform**: Filter by `mapKeys` keys, reduce to `{ meta_title: '...', linkedin_image: '...', ... }`
3. **Image URLs**: Items with `type: 'image'` may include `url` for display; the form tracks `selectedOgImage`, `selectedTwitterImage`, `selectedLinkedinImage` for preview
4. **Save**: `POST /dokan/v2/settings/store_seo` with `{ items: [ { id: 'dokan-seo-meta-title', value: '...' }, ... ] }`

The `id` format for POST is `dokan-seo-${key.replace(/_/g, '-')}` (e.g. `linkedin_title` → `dokan-seo-linkedin-title`).

### Supporting Components

#### StoreSeoSkeleton

**File**: `src/features/store-seo/components/StoreSeoSkeleton.jsx`

A loading placeholder while `fetchSeoData` runs. Uses `animate-pulse` and gray `bg-gray-200` blocks to mimic the form layout.

#### ImagePreview

**File**: `src/features/store-seo/components/ImagePreview.jsx`

Reusable component for image upload and preview:

| Prop | Purpose |
|------|---------|
| `path` | Current image URL (or null) |
| `section` | `'facebook'`, `'twitter'`, or `'linkedin'` — passed to `upload`/`action` callbacks |
| `upload` | `(file, section) => void` — called when user selects an image via `MediaUploader` |
| `action` | `(section) => void` — called when user removes the image |
| `label` | Label text (e.g. "Facebook Image:") |

Uses `@dokan/components` `MediaUploader` and `DokanButton` for the upload UI. When `path` is set, shows the image with a hover-to-delete overlay.

### Asset Registration & Enqueue

**File**: `includes/Assets.php`

- **Registration**: `register_store_seo_assets()` is called from `register_react_assets()` on `wp_enqueue_scripts` (priority 5)
- **Script**: `dokan-react-boilerplate-store-seo` — depends on `dokan-react-components` and **`dokan-pro-store-seo`**
- **Style**: `store-seo.css` — depends on `dokan-pro-store-seo`
- **Enqueue**: In `enqueue_dashboard_scripts()`, only when `dokan_is_seller_dashboard()` and `dokan-pro-store-seo` is registered

The script **depends on** Dokan Pro's store-seo bundle so it loads after Dokan Pro's route registration. The route filter then runs and replaces the route's element.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Vendor Dashboard → Settings → Store SEO                  │
│                                                                              │
│  Route: /settings/seo (Dokan Pro)                                            │
│        │                                                                     │
│        ▼                                                                     │
│  dokan-dashboard-routes (priority 10: Dokan Pro adds settings-store-seo)     │
│        │                                                                     │
│        ▼                                                                     │
│  dokan-dashboard-routes (priority 20: Boilerplate replaces element)          │
│        │                                                                     │
│        ▼                                                                     │
│  StoreSeoForm                                                                │
│        │                                                                     │
│        ├── GET /dokan/v2/settings/store_seo  ──► API returns items[]         │
│        │         │                                                           │
│        │         └── mapKeys + filter ──► seoData state                      │
│        │                                                                     │
│        └── POST /dokan/v2/settings/store_seo ◄── items from seoData         │
│                    │                                                         │
│                    └── dokan_vendor_settings_api_store_seo (PHP)             │
│                        ensures LinkedIn fields are in schema                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Reference

The feature uses Dokan Pro's existing V2 Settings API. No custom endpoints are added.

### Get Store SEO Settings

```
GET /wp-json/dokan/v2/settings/store_seo
```

**Response** `200 OK` — Array of setting items:

```json
[
  { "id": "dokan-seo-meta-title", "value": "My Store" },
  { "id": "dokan-seo-linkedin-title", "value": "My Store on LinkedIn" },
  { "id": "dokan-seo-og-image", "value": "123", "url": "https://example.com/image.jpg" }
]
```

Image-type items may include `url` for display. `value` is the attachment ID.

### Save Store SEO Settings

```
POST /wp-json/dokan/v2/settings/store_seo
```

**Body**:

```json
{
  "items": [
    { "id": "dokan-seo-meta-title", "value": "My Store" },
    { "id": "dokan-seo-linkedin-title", "value": "My Store on LinkedIn" },
    { "id": "dokan-seo-linkedin-image", "value": "456" }
  ]
}
```

---

## How to Extend

### Adding a new SEO field (e.g. Pinterest)

1. **PHP**: In `StoreSeo::add_linkedin_fields()`, add a new field definition to the `$linkedin_fields` array (or extract to a separate method). Use `id: 'dokan-seo-pinterest-title'`, etc.

2. **React**: In `StoreSeoForm.jsx`:
   - Add the key to `mapKeys` (e.g. `'dokan-seo-pinterest-title': 'pinterest_title'`)
   - Add a `useState` for preview if it's an image field
   - Add form inputs (and `ImagePreview` if needed) for the new field
   - Ensure the save logic includes it (it will, since `Object.entries(seoData)` covers all keys)

### Reusing the form without replacing the route

If you prefer to add a **new** route instead of overriding, use `addFilter` with `routes.push()` and a unique `id`/`path`. You would still use the same `StoreSeoForm` component and API.

### Changing the API payload format

The save logic builds `items` from `seoData` using:

```javascript
id: `dokan-seo-${ key.replace( /_/g, '-' ) }`
```

If you add new keys that don't follow this pattern, adjust the mapping in `saveSeoData` or extend `mapKeys` accordingly.
