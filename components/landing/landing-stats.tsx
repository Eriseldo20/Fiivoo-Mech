const stats = [
  { value: "12k+", label: "Kartela pune të procesuara" },
  { value: "98%", label: "Më pak kohë me letra" },
  { value: "4.9/5", label: "Kënaqësia e pronarëve" },
  { value: "24/7", label: "Qasje në cloud" },
]

export function LandingStats() {
  return (
    <section className="border-y border-[oklch(0.92_0.006_260)] bg-[oklch(0.98_0.003_260)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-[oklch(0.92_0.006_260)] px-0 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center justify-center px-4 py-8 text-center ${
              i >= 2 ? "border-t border-[oklch(0.92_0.006_260)] sm:border-t-0" : ""
            }`}
          >
            <span className="text-2xl font-extrabold tracking-tight text-[oklch(0.22_0.03_262)] sm:text-4xl">
              {stat.value}
            </span>
            <span className="mt-1.5 text-xs text-[oklch(0.52_0.02_260)] sm:text-sm">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
