import * as React from "react"

import { Button } from "@/components/ui/button"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-primary/5 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <a href="/">
            <div className="text-2xl font-bold italic"><span className="font-light">Voice Agent</span> Analytics</div>
          </a>
          <Button size="lg" >
            Get Started
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        {children}
      </main>
    </div>
  )
}
