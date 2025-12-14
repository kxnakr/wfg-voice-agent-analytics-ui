import { create } from "zustand"
import { persist } from "zustand/middleware"

import { getUserAnalytics, normalizeEmail } from "@/lib/api/analytics"
import type {
  ChartSavePayload,
  DropOffStep,
  DurationPoint,
  OutcomeSlice,
} from "@/types/analytics"

type ChartState = {
  userEmail: string | null
  callDuration: DurationPoint[]
  initialCallDuration: DurationPoint[]
  callOutcomes: OutcomeSlice[]
  initialCallOutcomes: OutcomeSlice[]
  dropOffSteps: DropOffStep[]
  isEditingDuration: boolean
  setEditingDuration: (isEditing: boolean) => void
  setUserEmail: (email: string | null) => void
  loadUserData: (email: string) => Promise<void>
  setCallDuration: (points: DurationPoint[]) => void
  setCallOutcomes: (slices: OutcomeSlice[]) => void
  setInitialCallDuration: (points: DurationPoint[]) => void
  setInitialCallOutcomes: (slices: OutcomeSlice[]) => void
  updateCallDuration: (day: string, value: number) => void
  resetCallDuration: () => void
  getSavePayload: () => ChartSavePayload
}

const sanitizeDurationPoints = (points: DurationPoint[]) =>
  points.map((point) => ({
    ...point,
    value: Number.isNaN(point.value) ? 0 : Math.max(point.value, 0),
  }))

const sanitizeOutcomeSlices = (slices: OutcomeSlice[]) =>
  slices.map((slice) => ({
    ...slice,
    value: Number.isNaN(slice.value) ? 0 : Math.max(slice.value, 0),
  }))

const defaultCallDuration: DurationPoint[] = sanitizeDurationPoints([
  { day: "1 Jan 2025", value: 242 },
  { day: "1 Feb 2025", value: 255 },
  { day: "1 Mar 2025", value: 236 },
  { day: "1 Apr 2025", value: 274 },
  { day: "1 May 2025", value: 288 },
  { day: "1 Jun 2025", value: 261 },
  { day: "1 Jul 2025", value: 307 },
  { day: "1 Aug 2025", value: 292 },
  { day: "1 Sep 2025", value: 278 },
  { day: "1 Oct 2025", value: 303 },
  { day: "1 Nov 2025", value: 286 },
  { day: "1 Dec 2025", value: 318 },
])

const defaultOutcomes: OutcomeSlice[] = sanitizeOutcomeSlices([
  { name: "Caller Identification", value: 34 },
  { name: "Unsupported Language", value: 22 },
  { name: "User Refused Identity", value: 16 },
  { name: "Incorrect Identity Provided", value: 14 },
  { name: "Customer Hostility", value: 14 },
])

const defaultDropOffSteps: DropOffStep[] = [
  { step: "Greeting & Consent", value: 100 },
  { step: "Intent Captured", value: 83 },
  { step: "Authentication", value: 69 },
  { step: "Knowledge Lookup", value: 54 },
  { step: "Resolution Offered", value: 43 },
  { step: "Transfer / Manual Review", value: 28 },
]

export const useChartStore = create<ChartState>()(
  persist(
    (set, get) => ({
      userEmail: null,
      callDuration: defaultCallDuration,
      initialCallDuration: defaultCallDuration,
      callOutcomes: defaultOutcomes,
      initialCallOutcomes: defaultOutcomes,
      dropOffSteps: defaultDropOffSteps,
      isEditingDuration: false,
      setEditingDuration: (isEditing) => set({ isEditingDuration: isEditing }),
      setUserEmail: (email) =>
        set({ userEmail: email ? normalizeEmail(email) : null }),
      async loadUserData(email) {
        const normalizedEmail = normalizeEmail(email)

        try {
          const analytics = await getUserAnalytics(normalizedEmail)

          const nextCallDuration = analytics?.call_duration_data?.length
            ? sanitizeDurationPoints(analytics.call_duration_data)
            : defaultCallDuration

          const nextCallOutcomes = analytics?.sad_path_data?.length
            ? sanitizeOutcomeSlices(analytics.sad_path_data)
            : defaultOutcomes

          set({
            userEmail: normalizedEmail,
            callDuration: nextCallDuration,
            initialCallDuration: nextCallDuration,
            callOutcomes: nextCallOutcomes,
            initialCallOutcomes: nextCallOutcomes,
          })
        } catch (error) {
          console.error("Failed to load analytics", error)
        }
      },
      setCallDuration: (points) =>
        set({
          callDuration: sanitizeDurationPoints(points),
        }),
      setCallOutcomes: (slices) =>
        set({
          callOutcomes: sanitizeOutcomeSlices(slices),
        }),
      setInitialCallDuration: (points) =>
        set({
          initialCallDuration: sanitizeDurationPoints(points),
        }),
      setInitialCallOutcomes: (slices) =>
        set({
          initialCallOutcomes: sanitizeOutcomeSlices(slices),
        }),
      updateCallDuration: (day, value) =>
        set((state) => ({
          callDuration: state.callDuration.map((point) =>
            point.day === day
              ? { ...point, value: Number.isNaN(value) ? 0 : Math.max(value, 0) }
              : point
          ),
        })),
      resetCallDuration: () =>
        set((state) => ({
          callDuration: sanitizeDurationPoints(state.initialCallDuration),
        })),
      getSavePayload: () => ({
        chartKey: "call_duration_trend",
        data: get().callDuration,
        updatedAt: new Date().toISOString(),
      }),
    }),
    {
      name: "chart-store",
      partialize: (state) => ({ userEmail: state.userEmail }),
    }
  )
)

export type { DurationPoint, OutcomeSlice, DropOffStep, ChartSavePayload }
