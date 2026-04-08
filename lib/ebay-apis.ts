export type EbayEnvironment = "sandbox" | "production";
export type ApiFamilyId =
  | "account"
  | "inventory"
  | "taxonomy"
  | "fulfillment"
  | "browse";
export type ApiFieldLocation = "path" | "query" | "body" | "header";
export type ApiFieldType = "text" | "textarea" | "number";

export type EnvironmentConfig = {
  environment: EbayEnvironment;
  appId: string;
  devId: string;
  certId: string;
  userAccessToken: string;
  requestLocale: string;
  oauthUserScopes: string;
  oauthAuthorizeUrlBase: string;
};

export type ApiFieldDefinition = {
  key: string;
  label: string;
  location: ApiFieldLocation;
  type?: ApiFieldType;
  placeholder?: string;
  description: string;
  required?: boolean;
  defaultValue?: string;
};

export type ApiCallDefinition = {
  id: string;
  apiFamily: ApiFamilyId;
  title: string;
  summary: string;
  docsUrl: string;
  path: string;
  method: "GET" | "POST";
  sandboxSupported: boolean;
  requiredScopes: string[];
  notes?: string[];
  fields: ApiFieldDefinition[];
};

export const EBAY_BASE_URLS: Record<EbayEnvironment, string> = {
  production: "https://api.ebay.com",
  sandbox: "https://api.sandbox.ebay.com",
};

export const DEFAULT_ENVIRONMENT_CONFIG: EnvironmentConfig = {
  environment: "production",
  appId: "",
  devId: "",
  certId: "",
  userAccessToken: "",
  requestLocale: "en-US",
  oauthUserScopes: "",
  oauthAuthorizeUrlBase: "https://auth.ebay.com/oauth2/authorize",
};

export const API_FAMILIES: Array<{
  id: ApiFamilyId;
  label: string;
  description: string;
}> = [
  {
    id: "inventory",
    label: "Inventory API",
    description: "Inspect SKUs, locations, and offers tied to the seller account.",
  },
  {
    id: "account",
    label: "Account API",
    description: "Review the business policies and seller privileges behind live inventory.",
  },
  {
    id: "taxonomy",
    label: "Taxonomy API",
    description: "Discover category trees, suggestions, and aspect requirements for listing data.",
  },
  {
    id: "fulfillment",
    label: "Fulfillment API",
    description: "Inspect orders and shipping fulfillment state that affects stock movement.",
  },
  {
    id: "browse",
    label: "Browse API",
    description:
      "Look up legacy eBay listing IDs directly when a listing is not yet managed by the Inventory API.",
  },
];

export const API_CALLS: ApiCallDefinition[] = [
  {
    id: "inventory-get-item",
    apiFamily: "inventory",
    title: "getInventoryItem",
    summary:
      "Retrieve one inventory item record for a specific seller-defined SKU.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItem",
    path: "/sell/inventory/v1/inventory_item/{sku}",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.inventory",
      "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
    ],
    notes: [
      "This is the fastest way to inspect quantity, condition, and product metadata for one SKU.",
    ],
    fields: [
      {
        key: "sku",
        label: "SKU",
        location: "path",
        required: true,
        placeholder: "SKU-12345",
        description: "The seller-defined SKU to retrieve.",
      },
    ],
  },
  {
    id: "inventory-get-items",
    apiFamily: "inventory",
    title: "getInventoryItems",
    summary:
      "Paginate through all inventory item records defined for the seller account.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/getInventoryItems",
    path: "/sell/inventory/v1/inventory_item",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.inventory",
      "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
    ],
    fields: [
      {
        key: "limit",
        label: "Limit",
        location: "query",
        type: "number",
        defaultValue: "25",
        placeholder: "25",
        description: "How many records to return in this page.",
      },
      {
        key: "offset",
        label: "Offset",
        location: "query",
        type: "number",
        defaultValue: "0",
        placeholder: "0",
        description: "How many records to skip before the page starts.",
      },
    ],
  },
  {
    id: "inventory-get-locations",
    apiFamily: "inventory",
    title: "getInventoryLocations",
    summary:
      "Retrieve the seller's configured inventory locations, such as warehouses or stores.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/getInventoryLocations",
    path: "/sell/inventory/v1/location",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.inventory",
      "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
    ],
    fields: [
      {
        key: "limit",
        label: "Limit",
        location: "query",
        type: "number",
        defaultValue: "25",
        placeholder: "25",
        description: "How many locations to return in this page.",
      },
      {
        key: "offset",
        label: "Offset",
        location: "query",
        type: "number",
        defaultValue: "0",
        placeholder: "0",
        description: "How many locations to skip before the page starts.",
      },
    ],
  },
  {
    id: "inventory-get-offers",
    apiFamily: "inventory",
    title: "getOffers",
    summary:
      "Retrieve all offers tied to a SKU, with optional marketplace and format filters.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/getOffers",
    path: "/sell/inventory/v1/offer",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.inventory",
      "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
    ],
    notes: [
      "Use this after a listing has been migrated into the Inventory API model.",
      "The response includes listing status values such as ACTIVE and OUT_OF_STOCK.",
    ],
    fields: [
      {
        key: "sku",
        label: "SKU",
        location: "query",
        required: true,
        placeholder: "SKU-12345",
        description: "The seller-defined SKU whose offers should be returned.",
      },
      {
        key: "marketplace_id",
        label: "Marketplace ID",
        location: "query",
        placeholder: "EBAY_US",
        description: "Optional marketplace filter for the SKU's offers.",
      },
      {
        key: "format",
        label: "Listing Format",
        location: "query",
        placeholder: "FIXED_PRICE",
        description: "Optional listing format filter, such as FIXED_PRICE or AUCTION.",
      },
      {
        key: "limit",
        label: "Limit",
        location: "query",
        type: "number",
        defaultValue: "25",
        placeholder: "25",
        description: "How many offers to return in this page.",
      },
      {
        key: "offset",
        label: "Offset",
        location: "query",
        type: "number",
        defaultValue: "0",
        placeholder: "0",
        description: "How many offers to skip before the page starts.",
      },
    ],
  },
  {
    id: "browse-get-item-by-legacy-id",
    apiFamily: "browse",
    title: "getItemByLegacyId",
    summary:
      "Retrieve public listing details directly from a legacy eBay item ID, such as the value that appears after /itm/ in an eBay listing URL.",
    docsUrl:
      "https://developer.ebay.com/api-docs/buy/browse/resources/item/methods/getItemByLegacyId",
    path: "/buy/browse/v1/item/get_item_by_legacy_id",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope"],
    notes: [
      "This is the documented fallback when an active listing is not yet represented by Inventory API objects.",
      "For multi-variation listings, you may also need the variation SKU or variation ID.",
    ],
    fields: [
      {
        key: "legacy_item_id",
        label: "Legacy Item ID",
        location: "query",
        required: true,
        placeholder: "318101253980",
        description: "The numeric item ID from the public eBay listing URL.",
      },
      {
        key: "marketplace_id",
        label: "Marketplace ID",
        location: "header",
        defaultValue: "EBAY_US",
        placeholder: "EBAY_US",
        description: "The marketplace header used by the Browse API request.",
      },
      {
        key: "legacy_variation_sku",
        label: "Legacy Variation SKU",
        location: "query",
        placeholder: "VARIATION-SKU",
        description:
          "Optional variation SKU for a multi-variation listing when you need one specific child item.",
      },
      {
        key: "legacy_variation_id",
        label: "Legacy Variation ID",
        location: "query",
        placeholder: "1234567890",
        description:
          "Optional variation item ID for a multi-variation listing when you need one specific child item.",
      },
    ],
  },
  {
    id: "inventory-bulk-migrate-listing",
    apiFamily: "inventory",
    title: "bulkMigrateListing",
    summary:
      "Convert up to five eligible active eBay listings into Inventory API objects so they can be managed and retrieved through Inventory and Offer calls.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/listing/methods/bulkMigrateListing",
    path: "/sell/inventory/v1/bulk_migrate_listing",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "Use this when getInventoryItems returns zero but you still have active listings created outside the Inventory API model.",
      "Per eBay's docs, eligible listings must be fixed-price, use business policies, and have seller-defined SKU values.",
    ],
    fields: [
      {
        key: "listingIds",
        label: "Listing IDs",
        location: "body",
        type: "textarea",
        required: true,
        placeholder: "123456789012\n123456789013",
        description:
          "Enter one to five active eBay listing IDs, separated by commas, spaces, or new lines.",
      },
    ],
  },
  {
    id: "account-get-fulfillment-policies",
    apiFamily: "account",
    title: "getFulfillmentPolicies",
    summary:
      "Retrieve all fulfillment business policies for the selected eBay marketplace.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicies",
    path: "/sell/account/v1/fulfillment_policy",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.account",
      "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
    ],
    fields: [
      {
        key: "marketplace_id",
        label: "Marketplace ID",
        location: "query",
        required: true,
        defaultValue: "EBAY_US",
        placeholder: "EBAY_US",
        description: "The marketplace whose fulfillment policies should be returned.",
      },
    ],
  },
  {
    id: "account-get-payment-policies",
    apiFamily: "account",
    title: "getPaymentPolicies",
    summary:
      "Retrieve all payment business policies for the selected eBay marketplace.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicies",
    path: "/sell/account/v1/payment_policy",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.account",
      "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
    ],
    fields: [
      {
        key: "marketplace_id",
        label: "Marketplace ID",
        location: "query",
        required: true,
        defaultValue: "EBAY_US",
        placeholder: "EBAY_US",
        description: "The marketplace whose payment policies should be returned.",
      },
    ],
  },
  {
    id: "account-get-return-policies",
    apiFamily: "account",
    title: "getReturnPolicies",
    summary:
      "Retrieve all return business policies for the selected eBay marketplace.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/getReturnPolicies",
    path: "/sell/account/v1/return_policy",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.account",
      "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
    ],
    fields: [
      {
        key: "marketplace_id",
        label: "Marketplace ID",
        location: "query",
        required: true,
        defaultValue: "EBAY_US",
        placeholder: "EBAY_US",
        description: "The marketplace whose return policies should be returned.",
      },
    ],
  },
  {
    id: "account-get-privileges",
    apiFamily: "account",
    title: "getPrivileges",
    summary:
      "Retrieve seller privilege details, including registration and selling-limit information.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/account/resources/privilege/methods/getPrivileges",
    path: "/sell/account/v1/privilege",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.account",
      "https://api.ebay.com/oauth/api_scope/sell.account.readonly",
    ],
    fields: [],
  },
  {
    id: "taxonomy-get-default-category-tree",
    apiFamily: "taxonomy",
    title: "getDefaultCategoryTreeId",
    summary:
      "Retrieve the default category tree ID for a given eBay marketplace.",
    docsUrl:
      "https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getDefaultCategoryTreeId",
    path: "/commerce/taxonomy/v1/get_default_category_tree_id",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope"],
    notes: [
      "eBay documents this method with an application-level OAuth scope rather than a sell.* scope.",
      "If your current bearer token was minted only for user-level sell scopes, this taxonomy request can fail until you use a token with api_scope access.",
    ],
    fields: [
      {
        key: "marketplace_id",
        label: "Marketplace ID",
        location: "query",
        required: true,
        defaultValue: "EBAY_US",
        placeholder: "EBAY_US",
        description: "The marketplace whose default category tree should be returned.",
      },
    ],
  },
  {
    id: "taxonomy-get-category-suggestions",
    apiFamily: "taxonomy",
    title: "getCategorySuggestions",
    summary:
      "Return category suggestions for listing keywords inside a specific category tree.",
    docsUrl:
      "https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getCategorySuggestions",
    path: "/commerce/taxonomy/v1/category_tree/{category_tree_id}/get_category_suggestions",
    method: "GET",
    sandboxSupported: false,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope"],
    notes: [
      "The eBay docs note that this call is not supported in Sandbox and can return boilerplate category names there.",
      "If your current bearer token was minted only for user-level sell scopes, this taxonomy request can fail until you use a token with api_scope access.",
    ],
    fields: [
      {
        key: "category_tree_id",
        label: "Category Tree ID",
        location: "path",
        required: true,
        placeholder: "0",
        description: "The category tree ID returned by getDefaultCategoryTreeId.",
      },
      {
        key: "q",
        label: "Keywords",
        location: "query",
        required: true,
        placeholder: "wireless earbuds",
        description: "The search phrase used to generate category suggestions.",
      },
    ],
  },
  {
    id: "taxonomy-get-item-aspects",
    apiFamily: "taxonomy",
    title: "getItemAspectsForCategory",
    summary:
      "Retrieve aspect metadata and required item specifics for a leaf category.",
    docsUrl:
      "https://developer.ebay.com/api-docs/commerce/taxonomy/resources/category_tree/methods/getItemAspectsForCategory",
    path: "/commerce/taxonomy/v1/category_tree/{category_tree_id}/get_item_aspects_for_category",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope"],
    notes: [
      "If your current bearer token was minted only for user-level sell scopes, this taxonomy request can fail until you use a token with api_scope access.",
    ],
    fields: [
      {
        key: "category_tree_id",
        label: "Category Tree ID",
        location: "path",
        required: true,
        placeholder: "0",
        description: "The category tree ID for the marketplace you are targeting.",
      },
      {
        key: "category_id",
        label: "Category ID",
        location: "query",
        required: true,
        placeholder: "9355",
        description: "A leaf category ID whose item aspects should be returned.",
      },
    ],
  },
  {
    id: "fulfillment-get-orders",
    apiFamily: "fulfillment",
    title: "getOrders",
    summary:
      "Search orders by order ID list, time-based filters, and pagination controls.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/getOrders",
    path: "/sell/fulfillment/v1/order",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
      "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
    ],
    notes: [
      "If orderIds is provided, eBay ignores the other query parameters for this method.",
    ],
    fields: [
      {
        key: "orderIds",
        label: "Order IDs",
        location: "query",
        placeholder: "12-34567-89012,98-76543-21098",
        description: "Optional comma-separated list of order IDs to retrieve directly.",
      },
      {
        key: "filter",
        label: "Filter",
        location: "query",
        placeholder: "creationdate:[2026-04-01T00:00:00.000Z..]",
        description:
          "Optional eBay filter expression, such as creationdate or lastmodifieddate ranges.",
      },
      {
        key: "fieldGroups",
        label: "Field Groups",
        location: "query",
        placeholder: "TAX_BREAKDOWN",
        description: "Optional response expansion, such as TAX_BREAKDOWN.",
      },
      {
        key: "limit",
        label: "Limit",
        location: "query",
        type: "number",
        defaultValue: "50",
        placeholder: "50",
        description: "How many orders to return in this page. eBay caps this at 200.",
      },
      {
        key: "offset",
        label: "Offset",
        location: "query",
        type: "number",
        defaultValue: "0",
        placeholder: "0",
        description: "How many orders to skip before the page starts.",
      },
    ],
  },
  {
    id: "fulfillment-get-order",
    apiFamily: "fulfillment",
    title: "getOrder",
    summary:
      "Retrieve one order with its line items, payment details, and fulfillment instructions.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/getOrder",
    path: "/sell/fulfillment/v1/order/{orderId}",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
      "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
    ],
    fields: [
      {
        key: "orderId",
        label: "Order ID",
        location: "path",
        required: true,
        placeholder: "12-34567-89012",
        description: "The unique order ID returned by eBay.",
      },
      {
        key: "fieldGroups",
        label: "Field Groups",
        location: "query",
        placeholder: "TAX_BREAKDOWN",
        description: "Optional response expansion, such as TAX_BREAKDOWN.",
      },
    ],
  },
  {
    id: "fulfillment-get-shipping-fulfillments",
    apiFamily: "fulfillment",
    title: "getShippingFulfillments",
    summary:
      "Retrieve all shipping fulfillments already associated with a specific order.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/getShippingFulfillments",
    path: "/sell/fulfillment/v1/order/{orderId}/shipping_fulfillment",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.fulfillment",
      "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
    ],
    fields: [
      {
        key: "orderId",
        label: "Order ID",
        location: "path",
        required: true,
        placeholder: "12-34567-89012",
        description: "The unique order ID whose shipping fulfillments should be returned.",
      },
    ],
  },
];

export function getCallDefinition(callId: string) {
  return API_CALLS.find((call) => call.id === callId);
}

export function getCallDefaults(call: ApiCallDefinition) {
  return Object.fromEntries(
    call.fields.map((field) => [field.key, field.defaultValue ?? ""]),
  ) as Record<string, string>;
}

export function buildRequestUrl(
  call: ApiCallDefinition,
  environment: EbayEnvironment,
  params: Record<string, string>,
) {
  let path = call.path;

  for (const field of call.fields.filter((entry) => entry.location === "path")) {
    const rawValue = params[field.key]?.trim() ?? "";
    path = path.replace(`{${field.key}}`, encodeURIComponent(rawValue));
  }

  const url = new URL(`${EBAY_BASE_URLS[environment]}${path}`);

  for (const field of call.fields.filter((entry) => entry.location === "query")) {
    const rawValue = params[field.key]?.trim() ?? "";
    if (rawValue) {
      url.searchParams.set(field.key, rawValue);
    }
  }

  return url;
}

export function buildRequestBody(
  call: ApiCallDefinition,
  params: Record<string, string>,
) {
  if (call.id === "inventory-bulk-migrate-listing") {
    const listingIds = (params.listingIds ?? "")
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 5);

    return {
      requests: listingIds.map((listingId) => ({ listingId })),
    };
  }

  const bodyFields = call.fields.filter((field) => field.location === "body");
  if (bodyFields.length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    bodyFields.map((field) => [field.key, params[field.key]?.trim() ?? ""]),
  );
}
