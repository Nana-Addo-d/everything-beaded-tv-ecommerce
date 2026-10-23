import { Brand } from "./sections/brand";
import { MainNav } from "./sections/main-nav";
import { SearchTrigger } from "./sections/search-trigger";
import { HeaderActions } from "./sections/header-actions";
import { ModeToggle } from "./sections/mode-toggle";

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur"
      aria-label="Site header"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center gap-3 py-3">
          <Brand />
          <div className="order-3 w-full min-w-0 md:order-none md:mx-auto md:w-auto md:max-w-md md:flex-1">
            <SearchTrigger />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <HeaderActions />
            <ModeToggle />
          </div>
        </div>
        <nav aria-label="Main navigation" className="pb-3">
          <MainNav />
        </nav>
      </div>
    </header>
  );
}
