"use client";

import { useParams } from "next/navigation";
import { SpatialRoomStage } from "@/components/showroom/SpatialRoomStage";

export default function ProductDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const productId = Array.isArray(rawId) ? rawId[0] : (rawId ?? null);

  return <SpatialRoomStage initialProductId={productId} />;
}
