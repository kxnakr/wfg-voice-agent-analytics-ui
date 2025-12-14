import { supabase } from "@/lib/supabase"
import type { DurationPoint, OutcomeSlice } from "@/types/analytics"

export const TABLE_NAME = "voice_agent_analytics"

export type ChartType = "call_duration" | "sad_path"

export interface AnalyticsRow {
  user_email: string
  call_duration_data: DurationPoint[]
  sad_path_data: OutcomeSlice[]
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export async function getUserAnalytics(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("user_email, call_duration_data, sad_path_data")
    .eq("user_email", normalizedEmail)
    .maybeSingle()

  if (error) {
    throw error
  }

  return (data as AnalyticsRow | null) ?? null
}

export async function hasData(email: string, chartType: ChartType) {
  const normalizedEmail = normalizeEmail(email)
  const column =
    chartType === "call_duration" ? "call_duration_data" : "sad_path_data"

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(column)
    .eq("user_email", normalizedEmail)
    .maybeSingle()

  if (error) {
    throw error
  }

  const value = data ? (data as Record<string, unknown>)[column] : null
  return Array.isArray(value) && value.length > 0
}

export async function saveChartData(
  email: string,
  chartType: ChartType,
  data: DurationPoint[] | OutcomeSlice[]
) {
  const normalizedEmail = normalizeEmail(email)
  const column =
    chartType === "call_duration" ? "call_duration_data" : "sad_path_data"

  const payload = {
    user_email: normalizedEmail,
    [column]: data,
  }

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert(payload, { onConflict: "user_email" })

  if (error) {
    throw error
  }

  return { email: normalizedEmail }
}
