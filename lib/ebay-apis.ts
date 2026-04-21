export type EbayEnvironment = "sandbox" | "production";
export type ApiHostId = "api" | "apiz";
export type ApiAuthFlow = "user" | "application";
export type ApiFamilyId =
  | "account"
  | "inventory"
  | "taxonomy"
  | "fulfillment"
  | "browse"
  | "messaging";
export type ApiFieldLocation = "path" | "query" | "body" | "header";
export type ApiFieldType = "text" | "textarea" | "number";
export type ApiHttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type ApiProtocol = "rest" | "tradingXml";

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
  method: ApiHttpMethod;
  protocol?: ApiProtocol;
  apiHost?: ApiHostId;
  authFlow?: ApiAuthFlow;
  sandboxSupported: boolean;
  requiredScopes: string[];
  tradingCallName?: string;
  tradingCompatibilityLevel?: string;
  tradingSiteId?: string;
  notes?: string[];
  fields: ApiFieldDefinition[];
};

export const EBAY_BASE_URLS: Record<ApiHostId, Record<EbayEnvironment, string>> = {
  api: {
    production: "https://api.ebay.com",
    sandbox: "https://api.sandbox.ebay.com",
  },
  apiz: {
    production: "https://apiz.ebay.com",
    sandbox: "https://apiz.sandbox.ebay.com",
  },
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

const INVENTORY_ITEM_BODY_TEMPLATE = `{
  "availability": {
    "shipToLocationAvailability": {
      "quantity": 1
    }
  },
  "condition": "NEW",
  "product": {
    "title": "Test item title",
    "description": "Test listing payload",
    "aspects": {
      "Brand": [
        "Example"
      ],
      "Type": [
        "Example"
      ]
    },
    "imageUrls": [
      "https://i.ebayimg.com/images/g/6y0AAOSwDHJmECcM/s-l960.webp"
    ]
  }
}`;

const OFFER_BODY_TEMPLATE = `{
  "sku": "318101253980",
  "marketplaceId": "EBAY_US",
  "format": "FIXED_PRICE",
  "availableQuantity": 1,
  "categoryId": "9355",
  "listingDescription": "Test listing payload",
  "listingPolicies": {
    "fulfillmentPolicyId": "YOUR_FULFILLMENT_POLICY_ID",
    "paymentPolicyId": "YOUR_PAYMENT_POLICY_ID",
    "returnPolicyId": "YOUR_RETURN_POLICY_ID"
  },
  "pricingSummary": {
    "price": {
      "currency": "USD",
      "value": "9.99"
    }
  }
}`;

const BULK_INVENTORY_ITEMS_BODY_TEMPLATE = `{
  "requests": [
    {
      "sku": "318101253980",
      "locale": "en_US",
      "availability": {
        "shipToLocationAvailability": {
          "quantity": 1
        }
      },
      "condition": "NEW",
      "product": {
        "title": "Test item title",
        "description": "Test listing payload",
        "aspects": {
          "Brand": [
            "Example"
          ],
          "Type": [
            "Example"
          ]
        },
        "imageUrls": [
          "https://i.ebayimg.com/images/g/6y0AAOSwDHJmECcM/s-l960.webp"
        ]
      }
    }
  ]
}`;

const INVENTORY_ITEM_GROUP_BODY_TEMPLATE = `{
  "title": "Variation group title",
  "description": "Variation group description",
  "variantSKUs": [
    "318101253980"
  ],
  "aspects": {
    "Brand": [
      "Example"
    ]
  },
  "variesBy": {
    "specifications": [
      {
        "name": "Color",
        "values": [
          "Black"
        ]
      }
    ]
  }
}`;

const BULK_CREATE_OFFER_BODY_TEMPLATE = `{
  "requests": [
    {
      "sku": "318101253980",
      "marketplaceId": "EBAY_US",
      "format": "FIXED_PRICE",
      "availableQuantity": 1,
      "categoryId": "9355",
      "listingDescription": "Test listing payload",
      "listingPolicies": {
        "fulfillmentPolicyId": "YOUR_FULFILLMENT_POLICY_ID",
        "paymentPolicyId": "YOUR_PAYMENT_POLICY_ID",
        "returnPolicyId": "YOUR_RETURN_POLICY_ID"
      },
      "pricingSummary": {
        "price": {
          "currency": "USD",
          "value": "9.99"
        }
      }
    }
  ]
}`;

const BULK_UPDATE_PRICE_QUANTITY_BODY_TEMPLATE = `{
  "requests": [
    {
      "sku": "318101253980",
      "shipToLocationAvailability": {
        "quantity": 1
      },
      "offers": [
        {
          "offerId": "YOUR_OFFER_ID",
          "availableQuantity": 1
        }
      ]
    }
  ]
}`;

const PUBLISH_BY_GROUP_BODY_TEMPLATE = `{
  "inventoryItemGroupKey": "YOUR_GROUP_KEY",
  "marketplaceId": "EBAY_US"
}`;

const SHIPPING_FULFILLMENT_BODY_TEMPLATE = `{
  "lineItems": [
    {
      "lineItemId": "YOUR_LINE_ITEM_ID",
      "quantity": 1
    }
  ],
  "shippedDate": "2026-04-09T12:00:00.000Z",
  "shippingCarrierCode": "USPS",
  "trackingNumber": "9400100000000000000000"
}`;

const ISSUE_REFUND_BODY_TEMPLATE = `{
  "orderLevelRefundAmount": {
    "value": "1.00",
    "currency": "USD"
  },
  "reasonForRefund": "BUYER_CANCEL",
  "comment": "Test refund payload"
}`;

const TRADING_COMPATIBILITY_LEVEL = "1451";

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
  {
    id: "messaging",
    label: "Messaging API",
    description:
      "Work with Trading API member messages for inbox retrieval and buyer or bidder communication flows.",
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
    id: "inventory-get-offer",
    apiFamily: "inventory",
    title: "getOffer",
    summary:
      "Retrieve one specific offer by its offer ID, including listing status and policy references.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/getOffer",
    path: "/sell/inventory/v1/offer/{offerId}",
    method: "GET",
    sandboxSupported: true,
    requiredScopes: [
      "https://api.ebay.com/oauth/api_scope/sell.inventory",
      "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly",
    ],
    fields: [
      {
        key: "offerId",
        label: "Offer ID",
        location: "path",
        required: true,
        placeholder: "123456789012",
        description: "The unique eBay offer ID returned by createOffer or getOffers.",
      },
    ],
  },
  {
    id: "inventory-create-item",
    apiFamily: "inventory",
    title: "createOrReplaceInventoryItem",
    summary:
      "Create or fully replace one inventory item record for a seller-defined SKU.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/createOrReplaceInventoryItem",
    path: "/sell/inventory/v1/inventory_item/{sku}",
    method: "PUT",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call changes inventory data for the selected seller account.",
      "Review the payload carefully before using production credentials.",
    ],
    fields: [
      {
        key: "sku",
        label: "SKU",
        location: "path",
        required: true,
        placeholder: "318101253980",
        description: "The seller-defined SKU that will be created or replaced.",
      },
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: INVENTORY_ITEM_BODY_TEMPLATE,
        placeholder: INVENTORY_ITEM_BODY_TEMPLATE,
        description: "Paste a valid JSON inventory item payload from the eBay documentation.",
      },
    ],
  },
  {
    id: "inventory-delete-item",
    apiFamily: "inventory",
    title: "deleteInventoryItem",
    summary:
      "Delete an inventory item record for a seller-defined SKU.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/deleteInventoryItem",
    path: "/sell/inventory/v1/inventory_item/{sku}",
    method: "DELETE",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call permanently deletes the inventory item record for the SKU.",
    ],
    fields: [
      {
        key: "sku",
        label: "SKU",
        location: "path",
        required: true,
        placeholder: "318101253980",
        description: "The seller-defined SKU to delete.",
      },
    ],
  },
  {
    id: "inventory-create-offer",
    apiFamily: "inventory",
    title: "createOffer",
    summary:
      "Create a staged offer for a SKU that can later be published as a live eBay listing.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/createOffer",
    path: "/sell/inventory/v1/offer",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call stages a listing offer and returns an offer ID on success.",
    ],
    fields: [
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: OFFER_BODY_TEMPLATE,
        placeholder: OFFER_BODY_TEMPLATE,
        description: "Paste a valid JSON offer payload from the eBay documentation.",
      },
    ],
  },
  {
    id: "inventory-publish-offer",
    apiFamily: "inventory",
    title: "publishOffer",
    summary:
      "Publish a staged single-variation offer to create or revise a live eBay listing.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/publishOffer",
    path: "/sell/inventory/v1/offer/{offerId}/publish",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call can create or revise a live listing.",
    ],
    fields: [
      {
        key: "offerId",
        label: "Offer ID",
        location: "path",
        required: true,
        placeholder: "123456789012",
        description: "The staged offer ID to publish.",
      },
    ],
  },
  {
    id: "inventory-delete-offer",
    apiFamily: "inventory",
    title: "deleteOffer",
    summary:
      "Delete an unpublished offer or end/remove the listing variation tied to an offer ID.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/deleteOffer",
    path: "/sell/inventory/v1/offer/{offerId}",
    method: "DELETE",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call can end a live listing or remove a variation from a listing.",
    ],
    fields: [
      {
        key: "offerId",
        label: "Offer ID",
        location: "path",
        required: true,
        placeholder: "123456789012",
        description: "The offer ID to delete.",
      },
    ],
  },
  {
    id: "inventory-bulk-create-or-replace-items",
    apiFamily: "inventory",
    title: "bulkCreateOrReplaceInventoryItem",
    summary:
      "Create or replace up to 25 inventory items in a single request payload.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/bulkCreateOrReplaceInventoryItem",
    path: "/sell/inventory/v1/bulk_create_or_replace_inventory_item",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call updates seller inventory records in bulk.",
    ],
    fields: [
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: BULK_INVENTORY_ITEMS_BODY_TEMPLATE,
        placeholder: BULK_INVENTORY_ITEMS_BODY_TEMPLATE,
        description: "Paste a valid JSON bulk inventory payload from the eBay documentation.",
      },
    ],
  },
  {
    id: "inventory-create-or-replace-item-group",
    apiFamily: "inventory",
    title: "createOrReplaceInventoryItemGroup",
    summary:
      "Create or replace an inventory item group used for a multiple-variation listing.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item_group/methods/createOrReplaceInventoryItemGroup",
    path: "/sell/inventory/v1/inventory_item_group/{inventoryItemGroupKey}",
    method: "PUT",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call updates multiple-variation listing group data.",
    ],
    fields: [
      {
        key: "inventoryItemGroupKey",
        label: "Inventory Item Group Key",
        location: "path",
        required: true,
        placeholder: "YOUR_GROUP_KEY",
        description: "The unique identifier for the inventory item group.",
      },
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: INVENTORY_ITEM_GROUP_BODY_TEMPLATE,
        placeholder: INVENTORY_ITEM_GROUP_BODY_TEMPLATE,
        description: "Paste a valid JSON inventory item group payload from the eBay documentation.",
      },
    ],
  },
  {
    id: "inventory-bulk-create-offer",
    apiFamily: "inventory",
    title: "bulkCreateOffer",
    summary:
      "Create up to 25 staged offers in one request.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/bulkCreateOffer",
    path: "/sell/inventory/v1/bulk_create_offer",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call stages multiple offers in one API request.",
    ],
    fields: [
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: BULK_CREATE_OFFER_BODY_TEMPLATE,
        placeholder: BULK_CREATE_OFFER_BODY_TEMPLATE,
        description: "Paste a valid JSON bulk offer payload from the eBay documentation.",
      },
    ],
  },
  {
    id: "inventory-bulk-update-price-quantity",
    apiFamily: "inventory",
    title: "bulkUpdatePriceQuantity",
    summary:
      "Update the total available quantity for a SKU and/or the price and quantity of its offers.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/inventory_item/methods/bulkUpdatePriceQuantity",
    path: "/sell/inventory/v1/bulk_update_price_quantity",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call can revise live offer prices and quantities.",
    ],
    fields: [
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: BULK_UPDATE_PRICE_QUANTITY_BODY_TEMPLATE,
        placeholder: BULK_UPDATE_PRICE_QUANTITY_BODY_TEMPLATE,
        description:
          "Paste a valid JSON bulk price and quantity payload from the eBay documentation.",
      },
    ],
  },
  {
    id: "inventory-publish-offer-by-group",
    apiFamily: "inventory",
    title: "publishOfferByInventoryItemGroup",
    summary:
      "Publish all staged offers in an inventory item group as a multiple-variation listing.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/inventory/resources/offer/methods/publishOfferByInventoryItemGroup",
    path: "/sell/inventory/v1/offer/publish_by_inventory_item_group",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.inventory"],
    notes: [
      "This write call can create a live multiple-variation listing.",
    ],
    fields: [
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: PUBLISH_BY_GROUP_BODY_TEMPLATE,
        placeholder: PUBLISH_BY_GROUP_BODY_TEMPLATE,
        description: "Paste a valid JSON publish-by-group payload from the eBay documentation.",
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
    authFlow: "application",
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
    authFlow: "application",
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
    authFlow: "application",
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
    authFlow: "application",
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
    id: "fulfillment-create-shipping-fulfillment",
    apiFamily: "fulfillment",
    title: "createShippingFulfillment",
    summary:
      "Create a shipping fulfillment record for an order using shipment and tracking details.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/createShippingFulfillment",
    path: "/sell/fulfillment/v1/order/{orderId}/shipping_fulfillment",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.fulfillment"],
    notes: [
      "This write call records shipment activity for an order.",
    ],
    fields: [
      {
        key: "orderId",
        label: "Order ID",
        location: "path",
        required: true,
        placeholder: "12-34567-89012",
        description: "The unique order ID that the shipping fulfillment belongs to.",
      },
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: SHIPPING_FULFILLMENT_BODY_TEMPLATE,
        placeholder: SHIPPING_FULFILLMENT_BODY_TEMPLATE,
        description: "Paste a valid JSON shipping fulfillment payload from the eBay documentation.",
      },
    ],
  },
  {
    id: "fulfillment-get-shipping-fulfillment",
    apiFamily: "fulfillment",
    title: "getShippingFulfillment",
    summary:
      "Retrieve one specific shipping fulfillment for an order.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/shipping_fulfillment/methods/getShippingFulfillment",
    path: "/sell/fulfillment/v1/order/{orderId}/shipping_fulfillment/{fulfillmentId}",
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
        description: "The unique order ID associated with the fulfillment.",
      },
      {
        key: "fulfillmentId",
        label: "Fulfillment ID",
        location: "path",
        required: true,
        placeholder: "6543210000",
        description: "The unique shipping fulfillment ID returned by eBay.",
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
  {
    id: "fulfillment-issue-refund",
    apiFamily: "fulfillment",
    title: "issueRefund",
    summary:
      "Issue an order-level or line-item-level refund against an order.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/fulfillment/resources/order/methods/issueRefund",
    path: "/sell/fulfillment/v1/order/{orderId}/issue_refund",
    method: "POST",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.fulfillment"],
    notes: [
      "This write call triggers a real refund action for the specified order.",
    ],
    fields: [
      {
        key: "orderId",
        label: "Order ID",
        location: "path",
        required: true,
        placeholder: "12-34567-89012",
        description: "The unique order ID that the refund applies to.",
      },
      {
        key: "bodyJson",
        label: "Request Body JSON",
        location: "body",
        type: "textarea",
        required: true,
        defaultValue: ISSUE_REFUND_BODY_TEMPLATE,
        placeholder: ISSUE_REFUND_BODY_TEMPLATE,
        description: "Paste a valid JSON refund payload from the eBay documentation.",
      },
    ],
  },
  {
    id: "fulfillment-get-payment-dispute-summaries",
    apiFamily: "fulfillment",
    title: "getPaymentDisputeSummaries",
    summary:
      "Retrieve a paginated list of payment disputes for the seller account.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute_summary/methods/getPaymentDisputeSummaries",
    path: "/sell/fulfillment/v1/payment_dispute_summary",
    method: "GET",
    apiHost: "apiz",
    authFlow: "application",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.payment.dispute"],
    fields: [
      {
        key: "limit",
        label: "Limit",
        location: "query",
        type: "number",
        defaultValue: "25",
        placeholder: "25",
        description: "How many dispute summaries to return in this page.",
      },
      {
        key: "offset",
        label: "Offset",
        location: "query",
        type: "number",
        defaultValue: "0",
        placeholder: "0",
        description: "How many dispute summaries to skip before the page starts.",
      },
    ],
  },
  {
    id: "fulfillment-get-payment-dispute",
    apiFamily: "fulfillment",
    title: "getPaymentDispute",
    summary:
      "Retrieve the full details of one payment dispute.",
    docsUrl:
      "https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDispute",
    path: "/sell/fulfillment/v1/payment_dispute/{payment_dispute_id}",
    method: "GET",
    apiHost: "apiz",
    sandboxSupported: true,
    requiredScopes: ["https://api.ebay.com/oauth/api_scope/sell.payment.dispute"],
    fields: [
      {
        key: "payment_dispute_id",
        label: "Payment Dispute ID",
        location: "path",
        required: true,
        placeholder: "1234567890",
        description: "The unique payment dispute ID returned by getPaymentDisputeSummaries.",
      },
    ],
  },
  {
    id: "messaging-get-member-messages",
    apiFamily: "messaging",
    title: "GetMemberMessages",
    summary:
      "Retrieve buyer-to-seller member messages tied to active listings, with filters for unanswered questions and time windows.",
    docsUrl:
      "https://developer.ebay.com/devzone/XML/docs/Reference/ebay/GetMemberMessages.html",
    path: "/ws/api.dll",
    method: "POST",
    protocol: "tradingXml",
    sandboxSupported: true,
    requiredScopes: [],
    tradingCallName: "GetMemberMessages",
    tradingCompatibilityLevel: TRADING_COMPATIBILITY_LEVEL,
    tradingSiteId: "0",
    notes: [
      "For Ask Seller Question traffic, eBay requires either ItemID or a StartCreationTime and EndCreationTime range.",
      "Use pagination and narrow time filters to reduce duplicate polling and large result sets.",
      "As of September 26, 2025, eBay accepts either usernames or public user IDs in supported recipient and sender fields.",
    ],
    fields: [
      {
        key: "mailMessageType",
        label: "Mail Message Type",
        location: "body",
        required: true,
        defaultValue: "AskSellerQuestion",
        placeholder: "AskSellerQuestion",
        description: "Use AskSellerQuestion for listing questions or All when retrieving a broader date-ranged message set.",
      },
      {
        key: "itemId",
        label: "Item ID",
        location: "body",
        placeholder: "318101253980",
        description: "Optional listing ID. Required unless you provide both StartCreationTime and EndCreationTime for AskSellerQuestion retrieval.",
      },
      {
        key: "messageStatus",
        label: "Message Status",
        location: "body",
        defaultValue: "Unanswered",
        placeholder: "Unanswered",
        description: "Optional filter such as Unanswered or Answered.",
      },
      {
        key: "senderId",
        label: "Sender ID",
        location: "body",
        placeholder: "buyer-public-user-id",
        description: "Optional sender filter using an eBay username or public user ID.",
      },
      {
        key: "startCreationTime",
        label: "Start Creation Time",
        location: "body",
        placeholder: "2026-04-20T00:00:00.000Z",
        description: "Optional ISO 8601 UTC timestamp. Pair with EndCreationTime when polling incrementally.",
      },
      {
        key: "endCreationTime",
        label: "End Creation Time",
        location: "body",
        placeholder: "2026-04-21T23:59:59.000Z",
        description: "Optional ISO 8601 UTC timestamp. Required whenever StartCreationTime is used.",
      },
      {
        key: "entriesPerPage",
        label: "Entries Per Page",
        location: "body",
        type: "number",
        defaultValue: "25",
        placeholder: "25",
        description: "Valid values are 25, 50, 100, or 200.",
      },
      {
        key: "pageNumber",
        label: "Page Number",
        location: "body",
        type: "number",
        defaultValue: "1",
        placeholder: "1",
        description: "The results page to retrieve.",
      },
      {
        key: "displayToPublic",
        label: "Display To Public",
        location: "body",
        defaultValue: "false",
        placeholder: "false",
        description: "Optional boolean string. Use true to return only public listing questions.",
      },
    ],
  },
  {
    id: "messaging-get-my-messages",
    apiFamily: "messaging",
    title: "GetMyMessages",
    summary:
      "Retrieve the authenticated user’s My Messages inbox headers or full message bodies through the Trading API.",
    docsUrl:
      "https://developer.ebay.com/devzone/xml/docs/Reference/ebay/GetMyMessages.html",
    path: "/ws/api.dll",
    method: "POST",
    protocol: "tradingXml",
    sandboxSupported: true,
    requiredScopes: [],
    tradingCallName: "GetMyMessages",
    tradingCompatibilityLevel: TRADING_COMPATIBILITY_LEVEL,
    tradingSiteId: "0",
    notes: [
      "eBay recommends starting with DetailLevel ReturnHeaders for maximum efficiency before requesting full message bodies.",
      "Flagged messages are intended to be acted on promptly in the seller’s My Messages inbox.",
      "Trading API OAuth does not use REST sell.* scopes; it uses the user access token through X-EBAY-API-IAF-TOKEN.",
    ],
    fields: [
      {
        key: "detailLevel",
        label: "Detail Level",
        location: "body",
        required: true,
        defaultValue: "ReturnHeaders",
        placeholder: "ReturnHeaders",
        description: "Use ReturnHeaders for efficient polling or ReturnMessages when you need full message bodies.",
      },
      {
        key: "folderId",
        label: "Folder ID",
        location: "body",
        placeholder: "0",
        description: "Optional folder filter for the user’s My Messages mailbox.",
      },
      {
        key: "startTime",
        label: "Start Time",
        location: "body",
        placeholder: "2026-04-20T00:00:00.000Z",
        description: "Optional ISO 8601 UTC timestamp to retrieve newer messages incrementally.",
      },
      {
        key: "endTime",
        label: "End Time",
        location: "body",
        placeholder: "2026-04-21T23:59:59.000Z",
        description: "Optional ISO 8601 UTC timestamp. Pair with StartTime when filtering by time.",
      },
      {
        key: "entriesPerPage",
        label: "Entries Per Page",
        location: "body",
        type: "number",
        defaultValue: "25",
        placeholder: "25",
        description: "How many messages to return per page.",
      },
      {
        key: "pageNumber",
        label: "Page Number",
        location: "body",
        type: "number",
        defaultValue: "1",
        placeholder: "1",
        description: "The results page to retrieve.",
      },
    ],
  },
  {
    id: "messaging-add-member-message-partner",
    apiFamily: "messaging",
    title: "AddMemberMessageAAQToPartner",
    summary:
      "Send a Trading API member message to an order partner for a listing tied to an order relationship.",
    docsUrl:
      "https://developer.ebay.com/devzone/xml/docs/Reference/ebay/AddMemberMessageAAQToPartner.html",
    path: "/ws/api.dll",
    method: "POST",
    protocol: "tradingXml",
    sandboxSupported: false,
    requiredScopes: [],
    tradingCallName: "AddMemberMessageAAQToPartner",
    tradingCompatibilityLevel: TRADING_COMPATIBILITY_LEVEL,
    tradingSiteId: "0",
    notes: [
      "This call is not supported in Sandbox and can only be tested against Production data.",
      "The recipient must be an eBay username or public user ID in an order relationship with the authenticated user. The API does not accept an email address as the recipient.",
      "eBay disallows HTML in the message body and limits this call to 75 requests per 60 seconds per seller account.",
      "Buyer and seller order partners can message each other for up to 90 days after the order line item was created.",
    ],
    fields: [
      {
        key: "itemId",
        label: "Item ID",
        location: "body",
        required: true,
        placeholder: "318101253980",
        description: "The listing ID associated with the order relationship.",
      },
      {
        key: "recipientId",
        label: "Recipient ID",
        location: "body",
        required: true,
        placeholder: "buyer-public-user-id",
        description: "The buyer or seller’s eBay username or public user ID. Email addresses are not supported here.",
      },
      {
        key: "subject",
        label: "Subject",
        location: "body",
        required: true,
        placeholder: "Order update",
        description: "The subject shown in My eBay messaging.",
      },
      {
        key: "bodyText",
        label: "Message Body",
        location: "body",
        type: "textarea",
        required: true,
        placeholder: "Thanks for your purchase. Your order is being prepared for shipment.",
        description: "Plain text only. eBay rejects HTML markup in this field.",
      },
      {
        key: "questionType",
        label: "Question Type",
        location: "body",
        required: true,
        defaultValue: "General",
        placeholder: "General",
        description: "Use a supported Trading API question type such as General, Payment, or Shipping.",
      },
      {
        key: "emailCopyToSender",
        label: "Email Copy To Sender",
        location: "body",
        defaultValue: "false",
        placeholder: "false",
        description: "Optional boolean string. Use true to email a copy back to the authenticated sender.",
      },
    ],
  },
];

export function getCallDefinition(callId: string) {
  return API_CALLS.find((call) => call.id === callId);
}

export function usesTradingXmlProtocol(call: ApiCallDefinition) {
  return call.protocol === "tradingXml";
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
  if (usesTradingXmlProtocol(call)) {
    return new URL(`${EBAY_BASE_URLS.api[environment]}${call.path}`);
  }

  let path = call.path;

  for (const field of call.fields.filter((entry) => entry.location === "path")) {
    const rawValue = params[field.key]?.trim() ?? "";
    path = path.replace(`{${field.key}}`, encodeURIComponent(rawValue));
  }

  const apiHost = call.apiHost ?? "api";
  const url = new URL(`${EBAY_BASE_URLS[apiHost][environment]}${path}`);

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
  if (usesTradingXmlProtocol(call)) {
    return undefined;
  }

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

  if (bodyFields.length === 1 && bodyFields[0]?.key === "bodyJson") {
    const rawBody = params.bodyJson?.trim();
    if (!rawBody) {
      return undefined;
    }

    try {
      return JSON.parse(rawBody);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown JSON parsing error.";
      throw new Error(`Request Body JSON must be valid JSON.\n\n${message}`);
    }
  }

  return Object.fromEntries(
    bodyFields.map((field) => [field.key, params[field.key]?.trim() ?? ""]),
  );
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function maybeXmlTag(tagName: string, value?: string) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return "";
  }

  return `<${tagName}>${xmlEscape(normalizedValue)}</${tagName}>`;
}

function maybeXmlBooleanTag(tagName: string, value?: string) {
  const normalizedValue = value?.trim().toLowerCase();
  if (!normalizedValue) {
    return "";
  }

  if (!["true", "false"].includes(normalizedValue)) {
    throw new Error(`${tagName} must be the string true or false for this Trading API call.`);
  }

  return `<${tagName}>${normalizedValue}</${tagName}>`;
}

function buildTradingMessageId(call: ApiCallDefinition) {
  const compactTimestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `workbench-${call.tradingCallName?.toLowerCase() ?? call.id}-${compactTimestamp}`;
}

function toTradingErrorLanguage(requestLocale: string) {
  const normalizedLocale = requestLocale.trim() || "en-US";
  return normalizedLocale.replace("-", "_");
}

export function buildTradingXmlRequestBody(
  call: ApiCallDefinition,
  params: Record<string, string>,
  requestLocale: string,
) {
  const messageId = buildTradingMessageId(call);
  const errorLanguage = toTradingErrorLanguage(requestLocale);

  if (call.id === "messaging-get-member-messages") {
    const mailMessageType = params.mailMessageType?.trim() || "AskSellerQuestion";
    const itemId = params.itemId?.trim() || "";
    const startCreationTime = params.startCreationTime?.trim() || "";
    const endCreationTime = params.endCreationTime?.trim() || "";
    const messageStatus = params.messageStatus?.trim() || "";
    const senderId = params.senderId?.trim() || "";
    const entriesPerPage = params.entriesPerPage?.trim() || "";
    const pageNumber = params.pageNumber?.trim() || "";

    if (mailMessageType === "All" && (!startCreationTime || !endCreationTime)) {
      throw new Error(
        "GetMemberMessages requires both Start Creation Time and End Creation Time when Mail Message Type is All.",
      );
    }

    if (
      mailMessageType === "AskSellerQuestion" &&
      !itemId &&
      (!startCreationTime || !endCreationTime)
    ) {
      throw new Error(
        "GetMemberMessages requires Item ID or both Start Creation Time and End Creation Time for AskSellerQuestion retrieval.",
      );
    }

    return `<?xml version="1.0" encoding="utf-8"?>
<GetMemberMessagesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  ${maybeXmlTag("ErrorLanguage", errorLanguage)}
  ${maybeXmlTag("MessageID", messageId)}
  <MailMessageType>${xmlEscape(mailMessageType)}</MailMessageType>
  ${maybeXmlTag("ItemID", itemId)}
  ${maybeXmlTag("MessageStatus", messageStatus)}
  ${maybeXmlTag("SenderID", senderId)}
  ${maybeXmlTag("StartCreationTime", startCreationTime)}
  ${maybeXmlTag("EndCreationTime", endCreationTime)}
  ${maybeXmlBooleanTag("DisplayToPublic", params.displayToPublic)}
  <Pagination>
    <EntriesPerPage>${xmlEscape(entriesPerPage || "25")}</EntriesPerPage>
    <PageNumber>${xmlEscape(pageNumber || "1")}</PageNumber>
  </Pagination>
</GetMemberMessagesRequest>`;
  }

  if (call.id === "messaging-get-my-messages") {
    return `<?xml version="1.0" encoding="utf-8"?>
<GetMyMessagesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  ${maybeXmlTag("ErrorLanguage", errorLanguage)}
  ${maybeXmlTag("MessageID", messageId)}
  <DetailLevel>${xmlEscape(params.detailLevel?.trim() || "ReturnHeaders")}</DetailLevel>
  ${maybeXmlTag("FolderID", params.folderId)}
  ${maybeXmlTag("StartTime", params.startTime)}
  ${maybeXmlTag("EndTime", params.endTime)}
  <Pagination>
    <EntriesPerPage>${xmlEscape(params.entriesPerPage?.trim() || "25")}</EntriesPerPage>
    <PageNumber>${xmlEscape(params.pageNumber?.trim() || "1")}</PageNumber>
  </Pagination>
</GetMyMessagesRequest>`;
  }

  if (call.id === "messaging-add-member-message-partner") {
    return `<?xml version="1.0" encoding="utf-8"?>
<AddMemberMessageAAQToPartnerRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  ${maybeXmlTag("ErrorLanguage", errorLanguage)}
  ${maybeXmlTag("MessageID", messageId)}
  <ItemID>${xmlEscape(params.itemId?.trim() || "")}</ItemID>
  <MemberMessage>
    <Subject>${xmlEscape(params.subject?.trim() || "")}</Subject>
    <Body>${xmlEscape(params.bodyText?.trim() || "")}</Body>
    <QuestionType>${xmlEscape(params.questionType?.trim() || "General")}</QuestionType>
    <RecipientID>${xmlEscape(params.recipientId?.trim() || "")}</RecipientID>
    ${maybeXmlBooleanTag("EmailCopyToSender", params.emailCopyToSender)}
  </MemberMessage>
</AddMemberMessageAAQToPartnerRequest>`;
  }

  throw new Error(`Trading XML request builder is not configured for ${call.title}.`);
}
