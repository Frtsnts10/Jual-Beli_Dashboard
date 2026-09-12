"use client";

import React, { useState } from "react";
import { CarouselSlide, updateCarouselSlideAction } from "../actions/carousel-actions";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, Switch, Button } from "@heroui/react";
import { toast } from "sonner";

export function EditCarouselModal({
  slide,
  onClose,
  storeId,
}: {
  slide: CarouselSlide;
  onClose: () => void;
  storeId: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [active, setActive] = useState(slide.active);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("active", active ? "on" : "off");

    const res = await updateCarouselSlideAction(storeId, slide.id, formData);

    setIsPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Carousel slide updated");
      onClose();
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => !open && onClose()} backdrop="blur" size="2xl" classNames={{
      base: "bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-2xl border border-white/80 dark:border-slate-800 rounded-3xl shadow-2xl",
    }}>
      <ModalContent>
        {() => (
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Edit Hero Slide
              </h3>
            </ModalHeader>
            <ModalBody className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
                <Input
                  name="title"
                  labelPlacement="outside"
                  label="Title"
                  defaultValue={slide.title}
                  isRequired
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
                <Input
                  name="image_url"
                  labelPlacement="outside"
                  label="Image URL"
                  defaultValue={slide.image_url}
                  isRequired
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
              </div>
              <Textarea
                name="subtitle"
                labelPlacement="outside"
                label="Subtitle (Optional)"
                defaultValue={slide.subtitle || ""}
                variant="bordered"
                radius="lg"
                minRows={2}
                classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-5">
                <Input
                  name="cta_text"
                  labelPlacement="outside"
                  label="Button Text (Optional)"
                  defaultValue={slide.cta_text || ""}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
                <Input
                  name="cta_link"
                  labelPlacement="outside"
                  label="Button Link (Optional)"
                  defaultValue={slide.cta_link || ""}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
                <Input
                  name="order"
                  type="number"
                  labelPlacement="outside"
                  label="Display Order"
                  defaultValue={slide.order.toString()}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Switch isSelected={active} onValueChange={setActive} size="sm" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {active ? "Visible on storefront" : "Hidden (draft)"}
                </span>
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-slate-50 dark:border-slate-800/60 mt-4">
              <Button variant="light" onPress={onClose} isDisabled={isPending} className="text-xs font-bold text-slate-500 dark:text-slate-400" radius="lg">
                Cancel
              </Button>
              <Button type="submit" isLoading={isPending} color="primary" radius="lg" className="text-xs font-bold shadow-md">
                {isPending ? "Updating..." : "Update Slide"}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
