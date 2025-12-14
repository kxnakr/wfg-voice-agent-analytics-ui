import { create } from "zustand"

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

type ChartState = {
  callDuration: DurationPoint[]
  initialCallDuration: DurationPoint[]
  callOutcomes: OutcomeSlice[]
  initialCallOutcomes: OutcomeSlice[]
  dropOffSteps: DropOffStep[]
  isEditingDuration: boolean
  setEditingDuration: (isEditing: boolean) => void
  setCallDuration: (points: DurationPoint[]) => void
  setCallOutcomes: (slices: OutcomeSlice[]) => void
  updateCallDuration: (day: string, value: number) => void
  resetCallDuration: () => void
  getSavePayload: () => ChartSavePayload
}

const defaultCallDuration: DurationPoint[] = [
  { day: "1 Jan 2024", value: 242 },
  { day: "1 Feb 2024", value: 255 },
  { day: "1 Mar 2024", value: 236 },
  { day: "1 Apr 2024", value: 274 },
  { day: "1 May 2024", value: 288 },
  { day: "1 Jun 2024", value: 261 },
  { day: "1 Jul 2024", value: 307 },
  { day: "1 Aug 2024", value: 292 },
  { day: "1 Sep 2024", value: 278 },
  { day: "1 Oct 2024", value: 303 },
  { day: "1 Nov 2024", value: 286 },
  { day: "1 Dec 2024", value: 318 },
]

const defaultOutcomes: OutcomeSlice[] = [
  { name: "Caller Identification", value: 34 },
  { name: "Unsupported Language", value: 22 },
  { name: "User Refused Identity", value: 16 },
  { name: "Incorrect Identity Provided", value: 14 },
  { name: "Customer Hostility", value: 14 },
]

const defaultDropOffSteps: DropOffStep[] = [
  { step: "Greeting & Consent", value: 100 },
  { step: "Intent Captured", value: 83 },
  { step: "Authentication", value: 69 },
  { step: "Knowledge Lookup", value: 54 },
  { step: "Resolution Offered", value: 43 },
  { step: "Transfer / Manual Review", value: 28 },
]

export const useChartStore = create<ChartState>((set, get) => ({
  callDuration: defaultCallDuration,
  initialCallDuration: defaultCallDuration,
  callOutcomes: defaultOutcomes,
  initialCallOutcomes: defaultOutcomes,
  dropOffSteps: defaultDropOffSteps,
  isEditingDuration: false,
  setEditingDuration: (isEditing) => set({ isEditingDuration: isEditing }),
  setCallDuration: (points) =>
    set({
      callDuration: points.map((point) => ({
        ...point,
        value: Number.isNaN(point.value) ? 0 : Math.max(point.value, 0),
      })),
    }),
  setCallOutcomes: (slices) =>
    set({
      callOutcomes: slices.map((slice) => ({
        ...slice,
        value: Number.isNaN(slice.value) ? 0 : Math.max(slice.value, 0),
      })),
    }),
  updateCallDuration: (day, value) =>
    set((state) => ({
      callDuration: state.callDuration.map((point) =>
        point.day === day
          ? { ...point, value: Number.isNaN(value) ? 0 : Math.max(value, 0) }
          : point
      ),
    })),
  resetCallDuration: () => set({ callDuration: defaultCallDuration }),
  getSavePayload: () => ({
    chartKey: "call_duration_trend",
    data: get().callDuration,
    updatedAt: new Date().toISOString(),
  }),
}))
