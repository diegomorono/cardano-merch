import { NextResponse } from "next/server";
import { submitOrderToPopCustoms } from "@/lib/popcustoms";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderNumber = `ADA-${Date.now()}`;

    const result = await submitOrderToPopCustoms(body.cart, body.shipping, orderNumber);

    return NextResponse.json(
      {
        success: true,
        order_number: orderNumber,
        gatewayData: result
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Legacy Orders Route Fatal Error]:", error);
    return NextResponse.json(
      { message: error.message || "Internal Processing Failure" },
      { status: 500 }
    );
  }
}