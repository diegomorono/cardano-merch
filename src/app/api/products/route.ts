import { NextResponse } from "next/server";
import { productsCatalog } from "@/lib/catalog";

export async function GET() {
  // Serve the compiled POPCustoms showroom catalog (26 real POPCustoms shirts & hoodies + curated drinkware & gear)
  return NextResponse.json(productsCatalog);
}
