import * as React from "react"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Cell, Pie, PieChart } from "recharts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChartCard } from "@/components/chart-card"
import { useChartStore, type OutcomeSlice } from "@/stores/chart-store"

const outcomesConfig = {
  "Caller Identification": { label: "Caller Identification", color: "var(--chart-1)" },
  "Unsupported Language": { label: "Unsupported Language", color: "var(--chart-2)" },
  "User Refused Identity": { label: "User Refused Identity", color: "var(--chart-3)" },
  "Incorrect Identity Provided": { label: "Incorrect Identity Provided", color: "var(--chart-4)" },
  "Customer Hostility": { label: "Customer Hostility", color: "var(--chart-5)" },
} satisfies Record<string, { label: string; color: string }>

export function SadPathCard() {
  const [isEditing, setIsEditing] = React.useState(false)
  const [draftOutcomes, setDraftOutcomes] = React.useState<OutcomeSlice[]>([])

  const { callOutcomes, initialCallOutcomes, setCallOutcomes } = useChartStore()

  React.useEffect(() => {
    if (isEditing) {
      setDraftOutcomes(callOutcomes.map((slice) => ({ ...slice })))
    }
  }, [callOutcomes, isEditing])

  const leadingOutcome =
    callOutcomes.length > 0
      ? callOutcomes.reduce(
        (currentMax, slice) =>
          slice.value > currentMax.value ? slice : currentMax,
        callOutcomes[0]
      )
      : undefined

  const handleChangeValue = (name: string, rawValue: string) => {
    const nextValue = rawValue === "" ? 0 : parseFloat(rawValue)
    setDraftOutcomes((prev) =>
      prev.map((slice) =>
        slice.name === name
          ? { ...slice, value: Number.isNaN(nextValue) ? 0 : Math.max(nextValue, 0) }
          : slice
      )
    )
  }

  const handleResetDraft = () => {
    setDraftOutcomes(initialCallOutcomes.map((slice) => ({ ...slice })))
  }

  const handleSave = () => {
    const sanitized = draftOutcomes.map((slice) => ({
      ...slice,
      value: Number.isNaN(slice.value) ? 0 : Math.max(slice.value, 0),
    }))
    setCallOutcomes(sanitized)
    console.log({
      chartKey: "sad_path_analysis",
      data: sanitized,
      updatedAt: new Date().toISOString(),
    })
    setIsEditing(false)
  }

  return (
    <ChartCard
      title="Sad Path Analysis"
      description="Distribution of where automated calls fail or exit."
      className="gap-0"
      footer={
        <p className="text-sm text-muted-foreground">
          {leadingOutcome
            ? `${leadingOutcome.name} is the top driver at ${leadingOutcome.value}%.`
            : "Evenly distributed failure patterns this week."}
        </p>
      }
      action={
        <AlertDialog open={isEditing} onOpenChange={setIsEditing}>
          <AlertDialogTrigger>
            <Button size="sm" variant={isEditing ? "secondary" : "outline"}>
              {isEditing ? "Close" : "Edit"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-h-[90vh] overflow-hidden">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit sad path distribution</AlertDialogTitle>
              <AlertDialogDescription>
                Update the percentage split across failure categories.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <SadPathEditor points={draftOutcomes} onChange={handleChangeValue} />
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleResetDraft}>
                Reset to defaults
              </Button>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button onClick={handleSave}>Save changes</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    >
      <div className="w-full mb-8">
        <ChartContainer config={outcomesConfig} className="h-80">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="font-medium">
                      {name}: {value}%
                    </span>
                  )}
                  nameKey="name"
                />
              }
            />
            <Pie
              data={callOutcomes}
              dataKey="value"
              nameKey="name"
              innerRadius={78}
              outerRadius={120}
              paddingAngle={2}
              stroke="transparent"
            >
              {callOutcomes.map((slice) => (
                <Cell
                  key={slice.name}
                  fill={
                    outcomesConfig[
                      slice.name as keyof typeof outcomesConfig
                    ]?.color ?? "var(--chart-1)"
                  }
                />
              ))}
            </Pie>
            <ChartLegend
              verticalAlign="bottom"
              content={<ChartLegendContent nameKey="name" />}
            />
          </PieChart>
        </ChartContainer>
      </div>
    </ChartCard>
  )
}

interface SadPathEditorProps {
  points: OutcomeSlice[]
  onChange: (name: string, value: string) => void
}

function SadPathEditor({ points, onChange }: SadPathEditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto pr-1">
        {points.map((slice) => {
          const inputId = `outcome-${slice.name.replace(/\s+/g, "-").toLowerCase()}`
          return (
            <div
              key={slice.name}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold">{slice.name}</p>
                <p className="text-xs text-muted-foreground">Percentage of failures</p>
              </div>
              <Input
                id={inputId}
                type="number"
                inputMode="decimal"
                min={0}
                step={1}
                value={slice.value}
                onChange={(event) => onChange(slice.name, event.target.value)}
                className="w-24 text-right"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
