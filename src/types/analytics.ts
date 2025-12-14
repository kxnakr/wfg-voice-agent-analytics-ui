export interface DurationPoint {
  day: string
  value: number
}

export interface OutcomeSlice {
  name: string
  value: number
}

export interface DropOffStep {
  step: string
  value: number
}

export interface ChartSavePayload {
  chartKey: "call_duration_trend"
  data: DurationPoint[]
  updatedAt: string
}
