import { AppShell } from "@/components/app-shell"
import { CallDurationCard } from "@/components/features/analytics/call-duration-card"
import { SadPathCard } from "@/components/features/analytics/sad-path-card"

function App() {
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
