import * as React from "react"
import {
  ChartContainer,
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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChartCard } from "@/components/chart-card"
import { hasData, saveChartData, normalizeEmail } from "@/lib/api/analytics"
import {
  useChartStore,
  type DurationPoint,
} from "@/stores/chart-store"

const durationConfig = {
  value: {
    label: "Avg duration (sec)",
    color: "hsl(263 75% 72%)",
  },
}

type OverlayStep = "none" | "email" | "confirm"

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export function CallDurationCard() {
  const [draftDuration, setDraftDuration] = React.useState<DurationPoint[]>([])
  const [overlayStep, setOverlayStep] = React.useState<OverlayStep>("none")
  const [emailInput, setEmailInput] = React.useState("")
  const [flowError, setFlowError] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const pendingSaveRef = React.useRef<DurationPoint[] | null>(null)

  const {
    callDuration,
    initialCallDuration,
    isEditingDuration,
    setEditingDuration,
    setCallDuration,
    setInitialCallDuration,
    userEmail,
    setUserEmail,
  } = useChartStore()

  React.useEffect(() => {
    if (isEditingDuration) {
      setDraftDuration(callDuration.map((point) => ({ ...point })))
      setEmailInput(userEmail ?? "")
      return
    }

    setOverlayStep("none")
    setFlowError("")
    setIsProcessing(false)
    pendingSaveRef.current = null
  }, [callDuration, isEditingDuration, userEmail])

  const handleChangePoint = (day: string, value: number) => {
    const nextValue = Number.isNaN(value) ? 0 : value
    setDraftDuration((prev) =>
      prev.map((point) =>
        point.day === day
          ? { ...point, value: Number.isNaN(nextValue) ? 0 : Math.max(nextValue, 0) }
          : point
      )
    )
  }

  const handleResetDraft = () => {
    setDraftDuration(initialCallDuration.map((point) => ({ ...point })))
  }

  const sanitizeDraft = (points: DurationPoint[]) =>
    points.map((point) => ({
      ...point,
      value: Number.isNaN(point.value) ? 0 : Math.max(point.value, 0),
    }))

  const handleSave = () => {
    const sanitized = sanitizeDraft(draftDuration)
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
        const exists = await hasData(normalizedEmail, "call_duration")
        if (exists && overlayStep !== "confirm") {
          setEmailInput(normalizedEmail)
          setOverlayStep("confirm")
          setIsProcessing(false)
          return
        }
      }

      await saveChartData(normalizedEmail, "call_duration", dataToSave)
      setUserEmail(normalizedEmail)
      setCallDuration(dataToSave)
      setInitialCallDuration(dataToSave)
      setOverlayStep("none")
      pendingSaveRef.current = null
      setEditingDuration(false)
    } catch (error) {
      console.error("Failed to save call duration data", error)
      setFlowError("Unable to save right now. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <ChartCard
      title="Call Duration Analysis"
      description="Average handle time in seconds at the start of each month."
      action={
        <AlertDialog open={isEditingDuration} onOpenChange={setEditingDuration}>
          <AlertDialogTrigger
            render={
              <Button
                size="sm"
                variant={isEditingDuration ? "secondary" : "outline"}
              >
                {isEditingDuration ? "Close" : "Edit"}
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
                          We save your call duration edits by email so you can pick up later.
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
                          We already have saved call duration data for{" "}
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
              <AlertDialogTitle>Edit call duration</AlertDialogTitle>
              <AlertDialogDescription>
                Set average handle time (seconds) for the first day of each month.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <CallDurationEditor
              points={draftDuration}
              onChange={handleChangePoint}
            />
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
      <div className="rounded-2xl border border-border/60 bg-linear-to-b from-card via-card to-primary/5 p-2">
        <ChartContainer
          config={durationConfig}
          className="h-64 w-full aspect-auto sm:h-80"
        >
          <AreaChart
            data={callDuration}
            margin={{ left: 8, right: 8, top: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="callDurationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.65} />
                <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 11 }}
              minTickGap={22}
              tickFormatter={formatMonthLabel}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatSeconds(Number(value))}
              width={60}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={formatFullDateLabel}
                  formatter={(value) => (
                    <span className="font-medium">{formatSeconds(Number(value))}</span>
                  )}
                />
              }
            />
            <Area
              dataKey="value"
              type="natural"
              stroke="var(--color-value)"
              strokeWidth={3}
              fill="url(#callDurationFill)"
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </ChartCard>
  )
}

interface CallDurationEditorProps {
  points: DurationPoint[]
  onChange: (day: string, value: number) => void
}

function CallDurationEditor({
  points,
  onChange,
}: CallDurationEditorProps) {
  const handleChange = (day: string, rawValue: string) => {
    const nextValue = rawValue === "" ? 0 : parseFloat(rawValue)
    onChange(day, Number.isNaN(nextValue) ? 0 : nextValue)
  }

  return (
    <div className="space-y-4">
      <div className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto pr-1">
        {points.map((point) => {
          const inputId = `duration-${point.day.replace(/\s+/g, "-").toLowerCase()}`
          return (
            <div
              key={point.day}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-border/60 bg-card/80 px-4 py-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold">{formatFullDateLabel(point.day)}</p>
                <p className="text-xs text-muted-foreground">Avg duration (sec)</p>
              </div>
              <Input
                id={inputId}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={point.value}
                onChange={(event) => handleChange(point.day, event.target.value)}
                className="w-28 text-right"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

const formatSeconds = (rawValue: number) => {
  if (!Number.isFinite(rawValue)) return "0s"

  const totalSeconds = Math.max(0, Math.round(rawValue))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(" ")
}

const formatMonthLabel = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

const formatFullDateLabel = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
