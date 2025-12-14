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
import { hasData, saveChartData, normalizeEmail } from "@/lib/api/analytics"
import { useChartStore, type OutcomeSlice } from "@/stores/chart-store"

const outcomesConfig = {
  "Caller Identification": { label: "Caller Identification", color: "var(--chart-1)" },
  "Unsupported Language": { label: "Unsupported Language", color: "var(--chart-2)" },
  "User Refused Identity": { label: "User Refused Identity", color: "var(--chart-3)" },
  "Incorrect Identity Provided": { label: "Incorrect Identity Provided", color: "var(--chart-4)" },
  "Customer Hostility": { label: "Customer Hostility", color: "var(--chart-5)" },
} satisfies Record<string, { label: string; color: string }>

type OverlayStep = "none" | "email" | "confirm"

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export function SadPathCard() {
  const [isEditing, setIsEditing] = React.useState(false)
  const [draftOutcomes, setDraftOutcomes] = React.useState<OutcomeSlice[]>([])
  const [overlayStep, setOverlayStep] = React.useState<OverlayStep>("none")
  const [emailInput, setEmailInput] = React.useState("")
  const [flowError, setFlowError] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const pendingSaveRef = React.useRef<OutcomeSlice[] | null>(null)

  const {
    callOutcomes,
    initialCallOutcomes,
    setCallOutcomes,
    setInitialCallOutcomes,
    userEmail,
    setUserEmail,
  } = useChartStore()

  React.useEffect(() => {
    if (isEditing) {
      setDraftOutcomes(callOutcomes.map((slice) => ({ ...slice })))
      setEmailInput(userEmail ?? "")
      return
    }

    setOverlayStep("none")
    setFlowError("")
    setIsProcessing(false)
    pendingSaveRef.current = null
  }, [callOutcomes, isEditing, userEmail])

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

  const sanitizeDraft = (slices: OutcomeSlice[]) =>
    slices.map((slice) => ({
      ...slice,
      value: Number.isNaN(slice.value) ? 0 : Math.max(slice.value, 0),
    }))

  const handleSave = () => {
    const sanitized = sanitizeDraft(draftOutcomes)
    pendingSaveRef.current = sanitized
    setFlowError("")

    if (!userEmail) {
      setEmailInput("")
      setOverlayStep("email")
      return
    }

    setEmailInput(userEmail)
    void finalizeSave(userEmail)
  }

  const finalizeSave = async (
    emailValue: string,
    options: { checkExisting?: boolean } = { checkExisting: true }
  ) => {
    const normalizedEmail = normalizeEmail(emailValue)
    const dataToSave = pendingSaveRef.current

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setFlowError("Enter a valid email address to save your changes.")
      setOverlayStep("email")
      return
    }

    if (!dataToSave) {
      setFlowError("No changes to save. Please try again.")
      return
    }

    setIsProcessing(true)
    setFlowError("")

    try {
      if (options.checkExisting !== false) {
        const exists = await hasData(normalizedEmail, "sad_path")
        if (exists && overlayStep !== "confirm") {
          setEmailInput(normalizedEmail)
          setOverlayStep("confirm")
          setIsProcessing(false)
          return
        }
      }

      await saveChartData(normalizedEmail, "sad_path", dataToSave)
      setUserEmail(normalizedEmail)
      setCallOutcomes(dataToSave)
      setInitialCallOutcomes(dataToSave)
      setOverlayStep("none")
      pendingSaveRef.current = null
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to save sad path data", error)
      setFlowError("Unable to save right now. Please try again.")
    } finally {
      setIsProcessing(false)
    }
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
          <AlertDialogTrigger
            render={
              <Button size="sm" variant={isEditing ? "secondary" : "outline"}>
                {isEditing ? "Close" : "Edit"}
              </Button>
            }
          />
          <AlertDialogContent
            size="lg"
            className="relative max-h-[90vh] overflow-hidden"
          >
            {overlayStep !== "none" ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-background/95 backdrop-blur-sm p-6">
                <div className="w-full max-w-md space-y-4 rounded-3xl border border-border/50 bg-card/80 p-5 shadow-xl">
                  {overlayStep === "email" ? (
                    <>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Save with your email</h3>
                        <p className="text-sm text-muted-foreground">
                          We store sad path edits by email so you can revisit them later.
                        </p>
                      </div>
                      <Input
                        autoFocus
                        type="email"
                        placeholder="you@example.com"
                        value={emailInput}
                        onChange={(event) => {
                          setEmailInput(event.target.value)
                          setFlowError("")
                        }}
                        disabled={isProcessing}
                      />
                      {flowError ? (
                        <p className="text-sm text-destructive">{flowError}</p>
                      ) : null}
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOverlayStep("none")
                            setFlowError("")
                          }}
                          disabled={isProcessing}
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => void finalizeSave(emailInput)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Checking..." : "Continue"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Overwrite existing data?</h3>
                        <p className="text-sm text-muted-foreground">
                          We already have saved sad path data for{" "}
                          <span className="font-medium">
                            {emailInput || userEmail}
                          </span>
                          . Saving now will replace it.
                        </p>
                      </div>
                      {flowError ? (
                        <p className="text-sm text-destructive">{flowError}</p>
                      ) : null}
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOverlayStep("email")
                            setFlowError("")
                          }}
                          disabled={isProcessing}
                        >
                          Go back
                        </Button>
                        <Button
                          onClick={() =>
                            void finalizeSave(emailInput || userEmail || "", {
                              checkExisting: false,
                            })
                          }
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Saving..." : "Confirm & Save"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}
            <AlertDialogHeader>
              <AlertDialogTitle>Edit sad path distribution</AlertDialogTitle>
              <AlertDialogDescription>
                Update the percentage split across failure categories.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <SadPathEditor points={draftOutcomes} onChange={handleChangeValue} />
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleResetDraft}>
                Reset
              </Button>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button onClick={handleSave} disabled={isProcessing}>
                Save changes
              </Button>
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
