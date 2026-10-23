"use client";
import { useState } from "react";
import { ProductImage } from "./product-image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@components/dialog";
import { Button } from "@components/button";

export function ProductGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [selected, setSelected] = useState(0);
  return (
    <section aria-label={`${title} photographs`} className="space-y-3">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="block w-full rounded-lg text-left"
            aria-label={`Enlarge photograph ${selected + 1} of ${title}`}
          >
            <ProductImage
              src={images[selected]}
              title={`${title} — photograph ${selected + 1}`}
            />
          </button>
        </DialogTrigger>
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              setSelected((selected + 1) % images.length);
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              setSelected((selected + images.length - 1) % images.length);
            }
          }}
        >
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Photograph {selected + 1} of {images.length}. Use the arrow keys to
            browse.
          </DialogDescription>
          <ProductImage
            src={images[selected]}
            title={`${title} — photograph ${selected + 1}`}
          />
          {images.length > 1 && (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() =>
                  setSelected((selected + images.length - 1) % images.length)
                }
              >
                Previous photo
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelected((selected + 1) % images.length)}
              >
                Next photo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              type="button"
              key={src}
              aria-label={`View photograph ${i + 1}`}
              aria-pressed={i === selected}
              className={`overflow-hidden rounded-lg border-2 ${selected === i ? "border-foreground" : "border-transparent"}`}
              onClick={() => setSelected(i)}
            >
              <ProductImage src={src} title={`${title} — thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Select the main photograph to enlarge. {images.length}{" "}
        {images.length === 1 ? "photograph" : "photographs"} · Colours may vary
        between screens.
      </p>
    </section>
  );
}
