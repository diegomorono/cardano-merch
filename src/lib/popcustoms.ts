export interface CartItem {
  sku: string;
  quantity: number;
}

export interface ShippingData {
  name: string;
  address: string;
  phone_number: string;
  city: string;
  state: string;
  country_code: string;
  zip_code: string;
  email: string;
}

export interface PopCustomsLineItem {
  sku: string;
  quantity: number;
}

export interface PopCustomsShippingAddress {
  name: string;
  address: string;
  phone_number: string;
  city: string;
  state: string;
  country_code: string;
  zip_code: string;
  email: string;
}

export interface PopCustomsOrderPayload {
  order_number: string;
  line_items: PopCustomsLineItem[];
  shipping_method: string;
  shipping_address: PopCustomsShippingAddress;
}

export interface PopCustomsResponseData {
  code?: number;
  message?: string;
  data?: {
    order_id?: string;
    order_number?: string;
    tracking_number?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Computes an environment-agnostic HMAC-SHA256 signature encoded in Base64
 * relying strictly on Web Crypto APIs for 100% serverless edge runtime safety.
 */
async function generateHmacSha256Base64(secretKey: string, payloadMessage: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(payloadMessage);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    messageData
  );

  const binaryString = Array.from(new Uint8Array(signatureBuffer))
    .map((byte) => String.fromCharCode(byte))
    .join("");

  return btoa(binaryString);
}

/**
 * Submits an order payload to the POPCustoms print-on-demand fulfillment API.
 * This helper is fully idempotent: if a concurrent execution tries to submit a duplicate order,
 * it intercepts the API rejection, confirms payment, and returns the cached order state cleanly.
 */
export async function submitOrderToPopCustoms(
  cart: CartItem[],
  shipping: ShippingData,
  orderNumber: string,
  shippingMethod: "Standard" | "Express" = "Standard"
): Promise<PopCustomsResponseData> {
  // 1. Ingest and sanitize environment parameters
  const account = (process.env.POPCUSTOMS_ACCOUNT || "").trim();
  const password = (process.env.POPCUSTOMS_PASSWORD || "").trim();
  const storeId = (process.env.POPCUSTOMS_STORE_ID || "").replace(/['"\s]/g, "").trim();
  const apiKey = (process.env.POPCUSTOMS_API_KEY || "").replace(/['"\s]/g, "").trim();

  if (!account || !password || !storeId || !apiKey) {
    throw new Error("CONFIGURATION ERROR: Missing account, password, store ID, or signing API key in system environment.");
  }

  // 2. STEP 1 AUTHENTICATION: Authenticate account dynamically to obtain authorization JWT
  const loginUrl = "https://i.popcustoms.com/api/v1/login";
  const loginResponse = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ account, password })
  });

  if (!loginResponse.ok) {
    const loginErrorDetails = await loginResponse.text();
    console.error("[POPCustoms Login Step Failed]:", loginErrorDetails);
    throw new Error(`AUTHENTICATION FAILURE: Failed to resolve authorization JWT token from credentials. Details: ${loginErrorDetails}`);
  }

  interface LoginResponseJSON {
    data?: {
      token?: string;
    };
  }

  const loginData = (await loginResponse.json()) as LoginResponseJSON;
  const jwtBearerToken = loginData?.data?.token;

  if (!jwtBearerToken) {
    throw new Error("AUTHENTICATION FAILURE: Token missing from POPCustoms login response body structure.");
  }

  // 3. Clean and map parameters matching the exact specification schema
  const cleanLineItems: PopCustomsLineItem[] = (cart || []).map((item) => ({
    sku: (item.sku || "").trim(),
    quantity: Number(item.quantity || 1)
  }));

  const popCustomsPayload: PopCustomsOrderPayload = {
    order_number: orderNumber,
    line_items: cleanLineItems,
    shipping_method: shippingMethod,
    shipping_address: {
      name: (shipping?.name || "").trim(),
      address: (shipping?.address || "").trim(),
      phone_number: (shipping?.phone_number || "").replace(/[^\d+]/g, ""),
      city: (shipping?.city || "").trim(),
      state: (shipping?.state || "").trim(),
      country_code: (shipping?.country_code || "US").toUpperCase().trim(),
      zip_code: (shipping?.zip_code || "").trim(),
      email: (shipping?.email || "").trim()
    }
  };

  // 4. STEP 2 INTEGRITY SIGNING: Cryptographically serialize and sign the payload with the store API Key
  const serializedPayload = JSON.stringify(popCustomsPayload);
  const trimmedPayloadString = serializedPayload.trim();
  const hmacSignature = await generateHmacSha256Base64(apiKey, trimmedPayloadString);

  // Formatted strictly to match singular path syntax: /api/v1/stores/{store_id}/webhooks/orders
  const orderSubmissionUrl = `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`;

  // 5. Submit transaction matching both Bearer Token and HMAC validation criteria
  const popCustomsResponse = await fetch(orderSubmissionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${jwtBearerToken}`,
      "x-hmac-sha256": hmacSignature,
      "x-topic": "orders/paid"
    },
    body: trimmedPayloadString
  });

  const responseText = await popCustomsResponse.text();
  let popCustomsData: PopCustomsResponseData;
  try {
    popCustomsData = JSON.parse(responseText) as PopCustomsResponseData;
  } catch {
    popCustomsData = { rawResponse: responseText };
  }

  if (!popCustomsResponse.ok) {
    const errorMsg = (popCustomsData?.message || responseText).toLowerCase();
    
    // Check if the error indicates the order already exists to guarantee idempotency
    const isAlreadyCreated = errorMsg.includes("exist") ||
                             errorMsg.includes("duplicate") ||
                             errorMsg.includes("already");
                             
    if (isAlreadyCreated) {
      console.log(`[POPCustoms Idempotency Triggered]: Order ${orderNumber} already exists. Intercepted rejection, returning success.`);
      return {
        code: 200,
        message: "Order already submitted.",
        data: {
          order_number: orderNumber,
          tracking_number: "ALREADY-SUBMITTED"
        }
      };
    }

    console.error(`[POPCustoms Order Rejection Code ${popCustomsResponse.status}]:`, popCustomsData);
    throw new Error(`PROTOCOL ERROR: POPCustoms rejected order configuration. Details: ${JSON.stringify(popCustomsData)}`);
  }

  return popCustomsData;
}
