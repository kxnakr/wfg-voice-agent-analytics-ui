import * as React from "react"
import { AppShell } from "@/components/app-shell"
import { CallDurationCard } from "@/components/features/analytics/call-duration-card"
import { SadPathCard } from "@/components/features/analytics/sad-path-card"
import { useChartStore } from "@/stores/chart-store"

function App() {
  const userEmail = useChartStore((state) => state.userEmail)
  const loadUserData = useChartStore((state) => state.loadUserData)

  React.useEffect(() => {
    if (userEmail) {
      loadUserData(userEmail)
    }
  }, [userEmail, loadUserData])

  return (
    <AppShell>
      <section className="mt-10 grid grid-cols-1 gap-6">
        <CallDurationCard />
        <SadPathCard />
      </section>
    </AppShell>
  )
}

export default App
