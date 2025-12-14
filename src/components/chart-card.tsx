import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ChartCard({
  title,
  description,
  action,
  footer,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card
      className={cn(
        "h-full border border-border/60 bg-card/80 shadow-[0_18px_55px_-40px_rgba(76,29,149,0.45)] backdrop-blur-md",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description ? (
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {action ? <CardAction>{action}</CardAction> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
      {footer ? (
        <CardFooter className="border-t border-border/60 pt-4">{footer}</CardFooter>
      ) : null}
    </Card>
  )
}
