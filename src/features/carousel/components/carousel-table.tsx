"use client";

import React, { useState } from "react";
import { CarouselSlide, deleteCarouselSlideAction, toggleCarouselSlideActiveAction } from "../actions/carousel-actions";
import { CarouselForm } from "./carousel-form";
import { EditCarouselModal } from "./edit-carousel-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Switch, Button } from "@heroui/react";
import { Edit, Trash2, GalleryHorizontal, ArrowUpRight, ImageOff } from "lucide-react";
import { toast } from "sonner";

interface CarouselTableProps {
  storeId: string;
  slides: CarouselSlide[];
}

export function CarouselTable({ storeId, slides }: CarouselTableProps) {
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const nextOrder = slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 1;

  const handleToggle = async (slide: CarouselSlide) => {
    setTogglingId(slide.id);
    const res = await toggleCarouselSlideActiveAction(storeId, slide.id, !slide.active);
    setTogglingId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(slide.active ? "Slide hidden from storefront" : "Slide now live on storefront");
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const res = await deleteCarouselSlideAction(storeId, deleteConfirmId);
    setDeleteConfirmId(null);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Carousel slide removed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <GalleryHorizontal className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Hero Carousel
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Manage the banner slides shown at the top of your main storefront page.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0d1322] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <CarouselForm storeId={storeId} nextOrder={nextOrder} />
      </div>

      <div className="bg-white dark:bg-[#0d1322] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
            Current Slides ({slides.length})
          </h3>
        </div>

        {slides.length === 0 ? (
          <div className="p-12 text-center">
            <ImageOff className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">
              No hero slides yet. Add one above to populate your storefront carousel.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {slides.map((slide) => (
              <div key={slide.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-6">
                <div className="w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/60 dark:border-slate-800/60">
                  <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 font-mono">#{slide.order}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{slide.title}</h4>
                  </div>
                  {slide.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{slide.subtitle}</p>
                  )}
                  {slide.cta_text && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      <ArrowUpRight className="w-3 h-3" />
                      {slide.cta_text} → {slide.cta_link || "#"}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Switch
                      isSelected={slide.active}
                      onValueChange={() => handleToggle(slide)}
                      isDisabled={togglingId === slide.id}
                      size="sm"
                    />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10">
                      {slide.active ? "Live" : "Draft"}
                    </span>
                  </div>

                  <Button isIconOnly variant="light" size="sm" onPress={() => setEditingSlide(slide)} className="text-slate-500 hover:text-indigo-600">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button isIconOnly variant="light" size="sm" onPress={() => setDeleteConfirmId(slide.id)} className="text-slate-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingSlide && (
        <EditCarouselModal slide={editingSlide} storeId={storeId} onClose={() => setEditingSlide(null)} />
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete this slide?"
        description="This slide will be permanently removed from your storefront carousel. This action cannot be undone."
        confirmText="Delete Slide"
        danger
      />
    </div>
  );
}
