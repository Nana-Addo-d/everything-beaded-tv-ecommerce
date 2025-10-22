import { Button } from "@workspace/ui/components/button"

export default function Home() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Everything Beaded — Marketplace</h1>
        <p className="opacity-80">Monorepo + shadcn/ui is working.</p>
        <Button>Click me</Button>
      </div>
    </main>
  )
}
