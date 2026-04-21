# eBay API Workbench

A Next.js App Router app for exploring core seller-facing eBay APIs from one UI:

- Account API
- Inventory API
- Taxonomy API
- Fulfillment API
- Browse API fallback for legacy listing IDs
- Trading API Messaging calls

The interface lets a user:

- choose `sandbox` or `production`
- paste their `PRODUCTION_APP_ID`, `PRODUCTION_DEV_ID`, `PRODUCTION_CERT_ID`, `PRODUCTION_USER_ACCESS_TOKEN`, `REQUEST_LOCALE`, `OAUTH_USER_SCOPES`, and `OAUTH_AUTHORIZE_URL_BASE`
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
- `bulkMigrateListing`

### Browse API

- `getItemByLegacyId`

### Taxonomy API

- `getDefaultCategoryTreeId`
- `getCategorySuggestions`
- `getItemAspectsForCategory`

### Fulfillment API

- `getOrders`
- `getOrder`
- `getShippingFulfillments`

### Messaging API

- `GetMemberMessages`
- `GetMyMessages`
- `AddMemberMessageAAQToPartner`

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
PRODUCTION_APP_ID=
PRODUCTION_DEV_ID=
PRODUCTION_CERT_ID=
PRODUCTION_USER_ACCESS_TOKEN=
SANDBOX_APP_ID=
SANDBOX_DEV_ID=
SANDBOX_CERT_ID=
SANDBOX_USER_ACCESS_TOKEN=
REQUEST_LOCALE=en-US
OAUTH_USER_SCOPES="https://api.ebay.com/oauth/api_scope/sell.inventory.readonly https://api.ebay.com/oauth/api_scope/sell.account.readonly"
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

This repository also includes a [`vercel.json`](./vercel.json) file that pins the framework preset to `nextjs` and overrides any incorrect project-level output directory setting.

No server-side environment variables are required because the app accepts runtime credentials from the user interface and sends the selected call through the built-in `/api/ebay` proxy route.

## Messaging implementation notes

- The messaging workflow in this app uses the eBay Trading API member-communication calls, which are XML-based and authenticated with the user access token in the `X-EBAY-API-IAF-TOKEN` header.
- `GetMemberMessages` and `GetMyMessages` are included for inbox retrieval and message polling workflows.
- `AddMemberMessageAAQToPartner` is included for buyer or seller order-partner messaging.
- eBay documents `AddMemberMessageAAQToPartner` as unsupported in Sandbox, so production data is required to live-test message sending.
- The message recipient for `AddMemberMessageAAQToPartner` is an eBay username or public user ID, not an email address.
- The app wraps Trading XML responses in JSON and surfaces `Ack`, `CorrelationID`, parsed error blocks, and the raw XML payload for debugging.

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
- [GetMemberMessages](https://developer.ebay.com/devzone/XML/docs/Reference/ebay/GetMemberMessages.html)
- [GetMyMessages](https://developer.ebay.com/devzone/xml/docs/Reference/ebay/GetMyMessages.html)
- [AddMemberMessageAAQToPartner](https://developer.ebay.com/devzone/xml/docs/Reference/ebay/AddMemberMessageAAQToPartner.html)
- [Using OAuth with the eBay traditional APIs](https://developer.ebay.com/api-docs/static/oauth-trad-apis.html)
