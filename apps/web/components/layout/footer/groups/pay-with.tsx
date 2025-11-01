"use client"

/**
 * Footer Group: Pay With (logos + tooltips)
 * - Uses brand SVGs under /public/logos/*.svg
 * - Hover shows tooltip with the provider label
 * - Collapsible on mobile; expanded on md+
 *
 * TODO: Drop your real SVGs in apps/web/public/logos:
 *   visa.svg, mastercard.svg, revolut.svg, paypal.svg, applepay.svg,
 *   googlepay.svg, klarna.svg, bank.svg, pad.svg
 */

import * as React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@components/avatar"
import { ChevronDown, CreditCard, Wallet, Banknote } from "lucide-react"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@components/collapsible"
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@components/tooltip"

  type Method = { id: string; label: string; lightSrc: string; darkSrc: string }
const METHODS: Method[] = [
  { id: "visa",       label: "Visa",       lightSrc: "/logos/payments/light/visa.svg",       darkSrc: "/logos/payments/dark/visa.svg" },
  { id: "mastercard", label: "Mastercard", lightSrc: "/logos/payments/light/mastercard.svg", darkSrc: "/logos/payments/dark/mastercard.svg" },
  { id: "revolut",    label: "Revolut",    lightSrc: "/logos/payments/light/revolut.svg",    darkSrc: "/logos/payments/dark/revolut.svg" },
  { id: "paypal",     label: "PayPal",     lightSrc: "/logos/payments/light/paypal.svg",     darkSrc: "/logos/payments/dark/paypal.svg" },
  { id: "applepay",   label: "Apple Pay",  lightSrc: "/logos/payments/light/applepay.svg",   darkSrc: "/logos/payments/dark/applepay.svg" },
  { id: "googlepay",  label: "Google Pay", lightSrc: "/logos/payments/light/googlepay.svg",  darkSrc: "/logos/payments/dark/googlepay.svg" },
  { id: "klarna",     label: "Klarna",     lightSrc: "/logos/payments/light/klarna.svg",     darkSrc: "/logos/payments/dark/klarna.svg" },
  { id: "bank",       label: "Bank Transfer", lightSrc: "/logos/payments/light/bank.svg",    darkSrc: "/logos/payments/dark/bank.svg" },
  { id: "pad",        label: "Pay after Delivery", lightSrc: "/logos/payments/light/pad.svg", darkSrc: "/logos/payments/dark/pad.svg" },
]


function MethodLogo({ m }: { m: Method }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center justify-center h-10 w-16 md:h-12 md:w-20"
            aria-label={m.label}
          >
          <Avatar
            className="
              h-10 w-10 md:h-12 md:w-12
              rounded-full
              hover:bg-accent transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              ring-offset-background
              overflow-hidden
            "
          >
            {/* Light theme logo */}
            <AvatarImage
              src={m.lightSrc}
              alt={m.label}
              className="object-contain p-1.5 dark:hidden"
            />
            {/* Dark theme logo */}
            <AvatarImage
              src={m.darkSrc}
              alt={m.label}
              className="object-contain p-1.5 hidden dark:inline"
            />
            <AvatarFallback className="text-[10px] md:text-xs">{m.label}</AvatarFallback>
          </Avatar>

          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{m.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function GroupPayWith() {
  const [open, setOpen] = React.useState<boolean>(false)

  return (
    <div>
      {/* Mobile: collapsible */}
      <div className="md:hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger
            className="flex w-full items-center justify-between py-2 text-left text-sm font-semibold"
            aria-label="Pay With"
          >
            <span className="inline-flex items-center gap-2">
              <CreditCard className="h-4 w-4" aria-hidden />
              Pay With
            </span>
            <ChevronDown
              className={["h-4 w-4 transition-transform", open ? "rotate-180" : "rotate-0"].join(" ")}
              aria-hidden
            />
          </CollapsibleTrigger>

          <CollapsibleContent className="pt-1">
            <div className="flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <MethodLogo key={m.id} m={m} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet className="h-4 w-4" aria-hidden />
              <span>Secure payments powered by industry-standard providers.</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop: expanded */}
      <div className="hidden md:block">
        <h3 className="mb-3 text-sm font-semibold inline-flex items-center gap-2">
          <CreditCard className="h-4 w-4" aria-hidden />
          Pay With
        </h3>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <MethodLogo key={m.id} m={m} />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Banknote className="h-4 w-4" aria-hidden />
          <span>Secure payments powered by industry-standard providers.</span>
        </div>
      </div>
    </div>
  )
}
