"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Button } from "@components/button";

export function SearchTrigger() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  return (
    <form
      action="/shop"
      role="search"
      className="flex w-full min-w-0 items-center rounded-lg border bg-background"
    >
      <input
        ref={inputRef}
        type="search"
        name="q"
        aria-label="Search products"
        placeholder="Search products…"
        className="h-9 min-w-0 flex-1 rounded-l-lg bg-transparent px-3 text-sm outline-offset-2"
      />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        aria-label="Submit search"
        className="shrink-0"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
