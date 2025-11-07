// apps/web/components/sections/common/filters/filter-chip.tsx
"use client"

/**
 * FilterChip
 * - Compact, accessible “pill” for filters.
 * - Modes:
 *    • Toggle chip (selected/not selected) via onToggle
 *    • Removable chip (used in Active bar) via onRemove
 * - Optional count badge (e.g., result counts) and leading icon.
 */

import * as React from "react"
import { X } from "lucide-react"
import { Button } from "@components/button"
import { Badge } from "@components/badge"
import { cn } from "@workspace/ui/lib/utils"

type BaseProps = {
  label: string
  className?: string
  icon?: React.ReactNode
  count?: number
  disabled?: boolean
  "aria-label"?: string
}

type ToggleProps = {
  selected?: boolean
  onToggle?: (nextSelected: boolean) => void
  onRemove?: never
}

type RemovableProps = {
  selected?: never
  onToggle?: never
  onRemove?: () => void
}

export type FilterChipProps = BaseProps & (ToggleProps | RemovableProps)

export function FilterChip(props: FilterChipProps) {
  const {
    label,
    icon,
    count,
    disabled,
    className,
    "aria-label": ariaLabel,
  } = props

  const isRemovable = typeof (props as RemovableProps).onRemove === "function"
  const isToggle = typeof (props as ToggleProps).onToggle === "function"
  const selected = isToggle ? Boolean((props as ToggleProps).selected) : false

  const handleClick = () => {
    if (isToggle && (props as ToggleProps).onToggle) {
      ;(props as ToggleProps).onToggle!(!selected)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isRemovable) return
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault()
      ;(props as RemovableProps).onRemove?.()
    }
  }

  return (
    <div className="inline-flex items-center">
      <Button
        type="button"
        variant={selected ? "default" : "outline"}
        size="sm"
        disabled={disabled}
        className={cn(
          "h-8 rounded-full px-3 text-xs",
          "data-[pressed=true]:ring-2 data-[pressed=true]:ring-ring",
          className
        )}
        data-pressed={selected}
        aria-pressed={isToggle ? selected : undefined}
        aria-label={ariaLabel ?? label}
        onClick={isToggle ? handleClick : undefined}
        onKeyDown={isRemovable ? handleKeyDown : undefined}
      >
        <span className="flex items-center gap-1.5">
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <span className="truncate">{label}</span>
          {typeof count === "number" ? (
            <Badge
              variant={selected ? "secondary" : "outline"}
              className="ml-0.5 h-5 rounded-full px-1.5 text-[10px] leading-none"
            >
              {count}
            </Badge>
          ) : null}
        </span>
      </Button>

      {isRemovable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-1 h-6 w-6 rounded-full"
          aria-label={`Remove ${label}`}
          onClick={(props as RemovableProps).onRemove}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}
