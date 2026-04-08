# eBay Inventory Workbench

A Next.js App Router app for exploring core seller-facing eBay APIs from one UI:

- Account API
- Inventory API
- Taxonomy API
- Fulfillment API

The interface lets a user:

- choose `sandbox` or `production`
- paste their `APP_ID`, `Dev_ID`, `Cert_ID`, `USER_ACCESS_TOKEN`, `OAUTH_USER_SCOPES`, and `OAUTH_AUTHORIZE_URL_BASE`
- optionally upload a `.env` file to populate those values
- select a documented API call from a dropdown
- fill in the required method inputs
- execute the call and inspect the response as beautified JSON
- copy the JSON result
- reset only the API-specific input section while keeping environment credentials in session storage

## eBay methods included

### Account API

- `getFulfillmentPolicies`
- `getPaymentPolicies`
- `getReturnPolicies`
- `getPrivileges`

### Inventory API

- `getInventoryItem`
- `getInventoryItems`
- `getInventoryLocations`
- `getOffers`

### Taxonomy API

- `getDefaultCategoryTreeId`
- `getCategorySuggestions`
- `getItemAspectsForCategory`

### Fulfillment API

- `getOrders`
- `getOrder`
- `getShippingFulfillments`

## Local development

1. Install Node.js 20+.
2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment file support

The upload control parses these keys from a local `.env` file:

```env
EBAY_ENVIRONMENT=production
APP_ID=
DEV_ID=
CERT_ID=
USER_ACCESS_TOKEN=
OAUTH_USER_SCOPES=
OAUTH_AUTHORIZE_URL_BASE=https://auth.ebay.com/oauth2/authorize
```

Values are kept in browser `sessionStorage` so they survive form resets and page refreshes for the current session, but they are not written to disk by the app.

## Deployment

### GitHub

Initialize and push once the repository target is ready:

```bash
git init
git add .
git commit -m "Create eBay inventory workbench"
```

Then connect a GitHub remote and push normally.

### Vercel

This project is a standard Next.js deployment target. You can:

- import the GitHub repository into Vercel, or
- deploy with the Vercel CLI after linking the project

No server-side environment variables are required because the app accepts runtime credentials from the user interface and sends the selected call through the built-in `/api/ebay` proxy route.

## Documentation references

These app behaviors are based on the official eBay developer docs:

- [Account API overview](https://developer.ebay.com/api-docs/sell/account/overview.html)
- [Inventory API overview](https://developer.ebay.com/api-docs/sell/inventory/overview.html)
- [Taxonomy API reference](https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId)
- [Fulfillment API overview](https://developer.ebay.com/api-docs/sell/fulfillment/overview.html)
- [getInventoryItem](https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem)
- [getInventoryItems](https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItems)
- [getOffers](https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/getOffers)
- [getFulfillmentPolicies](https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicies)
- [getPaymentPolicies](https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicies)
- [getReturnPolicies](https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/getReturnPolicies)
- [getPrivileges](https://developer.ebay.com/api-docs/sell/account/resources/privilege/methods/getPrivileges)
- [getDefaultCategoryTreeId](https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId)
- [getCategorySuggestions](https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getCategorySuggestions)
- [getItemAspectsForCategory](https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getItemAspectsForCategory)
- [getOrders](https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/getOrders)
- [getOrder](https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/getOrder)
- [getShippingFulfillments](https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/getShippingFulfillments)
