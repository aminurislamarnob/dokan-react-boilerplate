# Webpack Configuration — Developer Documentation

This document explains the webpack configuration used by the Dokan React Boilerplate plugin. The config extends `@wordpress/scripts` defaults and integrates with Dokan Lite's dependency mapping for correct script registration in WordPress.

---

## Table of Contents

1. [Overview](#overview)
2. [Configuration Structure](#configuration-structure)
3. [Entry Points](#entry-points)
4. [Output](#output)
5. [Externals](#externals)
6. [Dependency Extraction](#dependency-extraction)
7. [Path Resolution](#path-resolution)
8. [Build Commands](#build-commands)
9. [How to Extend](#how-to-extend)

---

## Overview

The webpack config is in `webpack.config.js` at the plugin root. It:

- Extends the default config from `@wordpress/scripts`
- Defines multiple entry points (one per feature)
- Writes bundled JS and CSS to `assets/js/`
- Uses Dokan Lite's `webpack-dependency-mapping` so `@dokan/*` and `@woocommerce/*` packages are externalized
- Replaces the default `DependencyExtractionWebpackPlugin` with a custom one that uses Dokan's mapping

**Key principle**: The boilerplate does not bundle Dokan or WooCommerce packages. They are treated as externals and loaded from WordPress handles, so the plugin depends on Dokan Lite/Pro being active.

---

## Configuration Structure

```javascript
const updatedConfig = {
    ...defaultConfig,           // Base from @wordpress/scripts
    entry: { ... },             // Override: multi-entry
    output: { ... },            // Override: path, filename, clean
    externals: { ... },         // Override: add WooCommerce blocks
    plugins: [ ... ],            // Override: custom DependencyExtractionWebpackPlugin
};
```

The spread `...defaultConfig` keeps all defaults (e.g. Babel, CSS handling, dev server) while overridden properties replace or merge with base values.

---

## Entry Points

| Entry Key | Source File | Purpose |
|-----------|-------------|---------|
| `customers` | `./src/features/customers/index.jsx` | Customers list and details (vendor dashboard) |
| `withdraw` | `./src/features/withdraw/index.jsx` | Withdraw Balance override |
| `store-seo` | `./src/features/store-seo/index.jsx` | Store SEO form with LinkedIn fields (requires Dokan Pro) |
| `admin-vendors` | `./src/features/admin-vendors/index.jsx` | Admin vendors table columns + Passport Number field |

Each entry produces:
- `[name].js` — JavaScript bundle
- `[name].css` — Extracted styles (if any)
- `[name].asset.php` — PHP file with `dependencies` and `version` for `wp_enqueue_script`
- `[name]-rtl.css` — RTL stylesheet (if applicable)

---

## Output

| Property | Value | Description |
|----------|-------|-------------|
| `path` | `./assets/js` | Output directory (relative to plugin root) |
| `filename` | `[name].js` | One JS file per entry |
| `clean` | `true` | Remove old files before each build |

The `@wordpress/scripts` build process also generates `.asset.php` files and copies them when using `--webpack-copy-php` (see [Build Commands](#build-commands)).

---

## Externals

Externals are packages that are **not** bundled. Webpack replaces `import`/`require` with a reference to a global variable or WordPress script handle.

```javascript
externals: {
    jquery: 'jQuery',
    '@woocommerce/blocks-registry': [ 'wc', 'wcBlocksRegistry' ],
    '@woocommerce/settings': [ 'wc', 'wcSettings' ],
    '@woocommerce/block-data': [ 'wc', 'wcBlocksData' ],
    '@woocommerce/shared-context': [ 'wc', 'wcSharedContext' ],
    '@woocommerce/shared-hocs': [ 'wc', 'wcSharedHocs' ],
    '@woocommerce/price-format': [ 'wc', 'priceFormat' ],
    '@woocommerce/blocks-checkout': [ 'wc', 'blocksCheckout' ],
}
```

- **jQuery**: Uses the global `jQuery` object (WordPress core).
- **@woocommerce/***: Uses `wc[handle]` (e.g. `wc.wcBlocksRegistry`) — loaded by WooCommerce or Dokan.

`@dokan/*` packages (e.g. `@dokan/components`, `@dokan/hooks`, `@dokan/stores/...`) are externalized via the `DependencyExtractionWebpackPlugin` and Dokan's mapping, not via the static `externals` object.

---

## Dependency Extraction

The `DependencyExtractionWebpackPlugin` from `@wordpress/dependency-extraction-webpack-plugin`:

1. Detects imports of WordPress, Dokan, and WooCommerce packages
2. Adds them to the `dependencies` array in `*.asset.php`
3. Ensures they are not bundled, but listed as script dependencies

The config **replaces** the default plugin with a custom instance that uses Dokan Lite's `requestToExternal` and `requestToHandle`:

```javascript
const { requestToExternal, requestToHandle } = require(
    `../${ liteLocation }/webpack-dependency-mapping`
);

new DependencyExtractionWebpackPlugin( {
    requestToExternal,
    requestToHandle,
} )
```

### What Dokan's mapping provides

| Import | External | WordPress Handle |
|--------|----------|------------------|
| `@dokan/components` | `dokan.react-components` | `dokan-react-components` |
| `@dokan/hooks` | `dokan.reactHooks` | `dokan-hooks` |
| `@dokan/stores/vendors` | `dokan.vendorsStore` | `dokan-stores-vendors` |
| `@woocommerce/*` | `wc.*` | `wc-*` (WooCommerce handles) |

This keeps script handles aligned with Dokan Lite so `wp_enqueue_script` loads the correct dependencies.

---

## Path Resolution

The config uses `getDokanLitePath()` from `src/utils/dokan-path.js` to find Dokan Lite and load its `webpack-dependency-mapping`.

### `getDokanLitePath()`

**File**: `src/utils/dokan-path.js`

Returns the directory name of Dokan Lite relative to the parent of the boilerplate (typically `wp-content/plugins/`):

1. Checks for `dokan-lite` first
2. Falls back to `dokan` if `dokan-lite` is missing
3. Throws if neither exists

**Resolved path**: `path.resolve( __dirname, '../../..', liteLocation )` from the utils file, i.e. `wp-content/plugins/dokan-lite` or `wp-content/plugins/dokan`.

The webpack config then loads:

```javascript
require( `../${ liteLocation }/webpack-dependency-mapping` )
```

So from the boilerplate root, that resolves to `../dokan-lite/webpack-dependency-mapping.js` (or `../dokan/`).

---

## Build Commands

Defined in `package.json`:

| Command | Description |
|---------|-------------|
| `npm run build` | Production build; runs `wp-scripts build --progress --webpack-copy-php` |
| `npm run start` | Development build with watch; runs `wp-scripts start --progress --webpack-copy-php` |

### `--webpack-copy-php`

Instructs `@wordpress/scripts` to copy generated `.asset.php` files to the output directory. Those files are used by `Assets.php` to get `dependencies` and `version` for `wp_register_script`.

### Output files (per entry)

After `npm run build`, for each entry (e.g. `customers`):

- `assets/js/customers.js`
- `assets/js/customers.css` (if styles are imported)
- `assets/js/customers.asset.php`
- `assets/js/customers-rtl.css` (if RTL is enabled)

---

## How to Extend

### Adding a new entry point

1. Add an entry in `webpack.config.js`:

```javascript
entry: {
    customers: './src/features/customers/index.jsx',
    withdraw: './src/features/withdraw/index.jsx',
    'store-seo': './src/features/store-seo/index.jsx',
    'admin-vendors': './src/features/admin-vendors/index.jsx',
    'my-feature': './src/features/my-feature/index.jsx',  // New
},
```

2. Register and enqueue the script in `includes/Assets.php` (see other features for the pattern).
3. Run `npm run build` (or `npm run start`) to generate the bundle.

### Adding a new external

If your feature imports a package that must not be bundled (e.g. another WordPress/Dokan script), add it to `externals`:

```javascript
externals: {
    // ...existing
    'some-package': 'globalVariableName',
},
```

For packages already handled by Dokan's mapping, no change is needed.

### Changing the output directory

Update the `output.path` in `webpack.config.js`. Ensure `Assets.php` uses the same path when registering scripts (it expects `DOKAN_REACT_BOILERPLATE_PLUGIN_ASSET . '/js/[name].js'`).

### Using a different Dokan path

If Dokan Lite lives outside `wp-content/plugins/`, adjust `src/utils/dokan-path.js` so `getDokanLitePath()` returns the correct relative path, or pass a custom path from the webpack config.
