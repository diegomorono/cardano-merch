"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SpatialRoomStage } from "@/components/showroom/SpatialRoomStage";

function ShowroomPageInner() {
  const searchParams = useSearchParams();
  const deepLinkedProductId = searchParams?.get("product") ?? null;
  return <SpatialRoomStage initialProductId={deepLinkedProductId} />;
}

export default function Home() {
  return (
    <Suspense fallback={<SpatialRoomStage />}>
      <ShowroomPageInner />
    </Suspense>
  );
}
