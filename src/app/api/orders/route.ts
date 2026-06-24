import { NextResponse } from "next/server";

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

interface IncomingRequestBody {
  cart: CartItem[];
  shipping: ShippingData;
}

interface DiagnosticRun {
  strategyName: string;
  status: number;
  cleared401: boolean;
  responseData: string;
}

export async function POST(req: Request) {
  try {
    const body: IncomingRequestBody = await req.json();

    // 1. Sanitize system environment parameters
    const rawApiKey = process.env.POPCUSTOMS_API_KEY || "";
    const rawStoreId = process.env.POPCUSTOMS_STORE_ID || "";

    // Clear string pollution from environment injections
    const apiKey = rawApiKey.replace(/['"\s\n\r]/g, "").trim();
    const storeId = rawStoreId.replace(/['"\s\n\r]/g, "").trim();

    if (!apiKey || !storeId) {
      return NextResponse.json(
        {
          success: false,
          message: "CONFIGURATION FAULT: Environment keys are missing or unreadable within the hosting compute container.",
          diagnostics: { apiKeyLength: apiKey.length, storeIdLength: storeId.length }
        },
        { status: 500 }
      );
    }

    const orderNumber = `ADA-DIAG-${Date.now()}`;

    // 2. Build minimum valid schema payload footprint
    const popCustomsPayload = {
      order_number: orderNumber,
      line_items: body.cart.map((item) => ({
        sku: item.sku.trim(),
        quantity: Number(item.quantity),
      })),
      shipping_method: "Standard",
      shipping_address: {
        name: body.shipping.name.trim(),
        address: body.shipping.address.trim(),
        phone_number: body.shipping.phone_number.replace(/[^\d+]/g, ""),
        city: body.shipping.city.trim(),
        state: body.shipping.state.trim(),
        country_code: body.shipping.country_code.toUpperCase().trim(),
        zip_code: body.shipping.zip_code.trim(),
        email: body.shipping.email.trim(),
      },
    };

    const basePayloadString = JSON.stringify(popCustomsPayload);
    const diagnosticLedger: DiagnosticRun[] = [];

    // 3. Define all five common authentication permutations
    const testingStrategies = [
      {
        id: "Strategy_A: Bearer Prefix Header",
        url: `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      },
      {
        id: "Strategy_B: Naked Key Authorization Header",
        url: `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": apiKey
        }
      },
      {
        id: "Strategy_C: Custom X-API-Key Header",
        url: `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-API-Key": apiKey
        }
      },
      {
        id: "Strategy_D: Custom Token Header Field",
        url: `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General`,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "token": apiKey
        }
      },
      {
        id: "Strategy_E: URL Query Parameter Assignment",
        url: `https://i.popcustoms.com/api/v1/stores/${storeId}/webhooks/orders?platform=General&token=${apiKey}`,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      }
    ];

    // 4. Run authentication probes
    for (const strategy of testingStrategies) {
      try {
        const response = await fetch(strategy.url, {
          method: "POST",
          headers: strategy.headers,
          body: basePayloadString,
        });

        const textResponse = await response.text();

        diagnosticLedger.push({
          strategyName: strategy.id,
          status: response.status,
          cleared401: response.status !== 401,
          responseData: textResponse.substring(0, 200) // Truncate response length
        });
      } catch (error: any) {
        diagnosticLedger.push({
          strategyName: strategy.id,
          status: 0,
          cleared401: false,
          responseData: `Network Dispatch Failure: ${error.message}`
        });
      }
    }

    // 5. Check if any configuration successfully cleared the 401 gate
    const matchingStrategy = diagnosticLedger.find((run) => run.cleared401);

    if (matchingStrategy) {
      return NextResponse.json({
        success: true,
        message: "AUTHENTICATION MOAT CLEARED: A verification matrix successfully cleared the 401 gate.",
        optimalStrategy: matchingStrategy.strategyName,
        targetResponseStatus: matchingStrategy.status,
        fullDiagnosticMatrix: diagnosticLedger
      }, { status: 200 });
    }

    // If all test configurations returned a 401, log the diagnostic matrix for inspection
    return NextResponse.json({
      success: false,
      message: "CRITICAL FAILURE: Every tested authentication strategy returned a 401 Unauthorized error.",
      environmentCheck: {
        apiKeyLength: apiKey.length,
        storeIdLength: storeId.length,
        apiKeyPrefixLook: apiKey.substring(0, 8)
      },
      fullDiagnosticMatrix: diagnosticLedger
    }, { status: 401 });

  } catch (error: any) {
    console.error("[Diagnostic Suite Runtime Error]:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error during execution", error: error.message },
      { status: 500 }
    );
  }
}