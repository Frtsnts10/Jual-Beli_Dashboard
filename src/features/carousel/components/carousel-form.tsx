"use client";

import React, { useState } from "react";
import { createCarouselSlideAction } from "../actions/carousel-actions";
import { Input, Textarea, Switch, Button } from "@heroui/react";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

interface CarouselFormProps {
  storeId: string;
  nextOrder: number;
  onSuccess?: () => void;
}

export function CarouselForm({ storeId, nextOrder, onSuccess }: CarouselFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [active, setActive] = useState(true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("active", active ? "on" : "off");

    const res = await createCarouselSlideAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Carousel slide created");
      form.reset();
      setActive(true);
      onSuccess?.();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 font-sans transition-colors">
      <div>
        <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-blue-600" />
          Add Hero Slide
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Slides appear on the main storefront hero carousel, ordered lowest to highest.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
        <Input
          name="title"
          labelPlacement="outside"
          label="Title"
          placeholder="Premium Digital Accounts"
          isRequired
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-stone-700 dark:text-slate-300", inputWrapper: "border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
        <Input
          name="image_url"
          labelPlacement="outside"
          label="Image URL"
          placeholder="https://..."
          isRequired
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-stone-700 dark:text-slate-300", inputWrapper: "border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
      </div>

      <Textarea
        name="subtitle"
        labelPlacement="outside"
        label="Subtitle (Optional)"
        placeholder="Get access to your favorite apps at a fraction of the cost."
        variant="bordered"
        radius="lg"
        minRows={2}
        classNames={{ label: "font-bold text-stone-700 dark:text-slate-300", inputWrapper: "border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
        <Input
          name="cta_text"
          labelPlacement="outside"
          label="Button Text (Optional)"
          placeholder="Shop Now"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-stone-700 dark:text-slate-300", inputWrapper: "border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
        <Input
          name="cta_link"
          labelPlacement="outside"
          label="Button Link (Optional)"
          placeholder="/products"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-stone-700 dark:text-slate-300", inputWrapper: "border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
        <Input
          name="order"
          type="number"
          labelPlacement="outside"
          label="Display Order"
          defaultValue={nextOrder.toString()}
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-stone-700 dark:text-slate-300", inputWrapper: "border-stone-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-slate-800">
        <div className="flex items-center gap-3 pt-4">
          <Switch isSelected={active} onValueChange={setActive} size="sm" />
          <span className="text-xs font-bold text-stone-600 dark:text-slate-400">
            {active ? "Visible on storefront" : "Hidden (draft)"}
          </span>
        </div>
        <Button
          type="submit"
          isLoading={isPending}
          color="primary"
          radius="lg"
          className="text-xs font-bold shadow-md mt-4"
        >
          {isPending ? "Saving..." : "Add Slide"}
        </Button>
      </div>
    </form>
  );
}
