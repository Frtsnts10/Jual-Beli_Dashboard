import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carousel",
};

import { getCarouselSlidesAction } from "@/features/carousel/actions/carousel-actions";
import { CarouselTable } from "@/features/carousel/components/carousel-table";

export default async function TenantCarouselPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const slides = await getCarouselSlidesAction(storeId);

  return (
    <div className="space-y-6 font-sans transition-colors pb-12">
      <CarouselTable storeId={storeId} slides={slides} />
    </div>
  );
}
