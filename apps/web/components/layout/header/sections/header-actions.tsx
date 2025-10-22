"use client"

/**
 * HeaderActions
 * - Right-side controls for the header:
 *   🛎 Notifications (with badge)
 *   🛒 Cart (with badge)
 *   👤 Profile menu (Dropdown)
 * - Theme toggle is wired separately as <ModeToggle />.
 *
 * Props:
 *  - notificationCount?: number
 *  - cartItemCount?: number
 */

import * as React from "react"
import Link from "next/link"
import { Bell, ShoppingCart, User, Store } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@components/avatar"
import { Button } from "@components/button"
import { Badge } from "@components/badge"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@components/dropdown-menu"

type HeaderActionsProps = {
    notificationCount?: number
    cartItemCount?: number
}

export function HeaderActions({
    notificationCount = 4,
    cartItemCount = 3,
    }: HeaderActionsProps) {
    return (
        <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
        >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
            <Badge
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] leading-5 flex items-center justify-center"
                aria-label={`${notificationCount} new notifications`}
            >
                {notificationCount}
            </Badge>
            )}
        </Button>

        {/* Cart */}
        <Link href="/cart" aria-label="Cart">
            <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
                <Badge
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] leading-5 flex items-center justify-center"
                aria-label={`${cartItemCount} items in cart`}
                >
                {cartItemCount}
                </Badge>
            )}
            </Button>
        </Link>

        {/* Profile Menu */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open profile menu">
                <Avatar className="h-9 w-9">
                {/* TODO: swap src for real user avatar */}
                    <AvatarImage src="" alt="User avatar" />
                    <AvatarFallback className="text-xs">EB</AvatarFallback>
                </Avatar>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            {/* TODO: replace with real user info (name/email) */}
                <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">Signed in user</p>
                    <p className="text-xs text-muted-foreground">user@example.com</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/shops" className="flex items-center">
                        <Store className="mr-2 h-4 w-4" />
                        My Shops
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Orders
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="w-full">
                        Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
}
