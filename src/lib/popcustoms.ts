interface CartItem {
  sku: string;
  quantity: number;
}

interface ShippingData {
  name: string;
  address: string;
  phone_number: string;
  city: string;
  state: string;
  country_code: string;
  zip_code: string;
  email: string;
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

export async function submitOrderToPopCustoms(
  cart: CartItem[],
  shipping: ShippingData,
  orderNumber: string
) {
  // 1. Ingest environment parameters
  const account = (process.env.POPCUSTOMS_ACCOUNT || "").trim();
  const password = (process.env.POPCUSTOMS_PASSWORD || "").trim();
  const storeId = (process.env.POPCUSTOMS_STORE_ID || "").replace(/['"\s]/g, "").trim();
  const apiKey = (process.env.POPCUSTOMS_API_KEY || "").replace(/['"\s]/g, "").trim();

  if (!account || !password || !storeId || !apiKey) {
    throw new Error("CONFIGURATION ERROR: Missing account, password, store ID, or signing API key in system environment.");
  }

  // 2. STEP 1 AUTHENTICATION: Authenticate account dynamically to obtain the standard Bearer Token
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

  const loginData = await loginResponse.json();
  const jwtBearerToken = loginData?.data?.token;

  if (!jwtBearerToken) {
    throw new Error("AUTHENTICATION FAILURE: Token missing from POPCustoms login response body structure.");
  }

  // 3. Clean and map parameters matching the exact specification schema
  const cleanLineItems = (cart || []).map((item) => ({
    sku: (item.sku || "").trim(),
    quantity: Number(item.quantity || 1)
  }));

  const popCustomsPayload = {
    order_number: orderNumber,
    line_items: cleanLineItems,
    shipping_method: "Standard",
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

  // Formatted strictly to match singular path syntax: /api/v1/stores/{store_id}/webhooks/order
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
  let popCustomsData: any;
  try {
    popCustomsData = JSON.parse(responseText);
  } catch {
    popCustomsData = responseText;
  }

  if (!popCustomsResponse.ok) {
    console.error(`[POPCustoms Order Rejection Code ${popCustomsResponse.status}]:`, popCustomsData);
    throw new Error(`PROTOCOL ERROR: POPCustoms rejected order configuration. Details: ${JSON.stringify(popCustomsData)}`);
  }

  return popCustomsData;
}
