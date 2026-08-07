import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldCheck } from "lucide-react"

export default async function DpaPage() {
  const t = await getTranslations("dpa")

  // Each section is a translated title + body paragraph.
  const sections = [
    "parties",
    "subject",
    "responsibilities",
    "subProcessors",
    "security",
    "dataSubjectRights",
    "retention",
    "breach",
  ] as const

  return (
    <div className="min-h-svh w-full bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6 md:py-16">
        <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
          <Link href="/auth/sign-up">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{t("title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">{t("intro")}</p>

        <div className="space-y-6">
          {sections.map((key, index) => (
            <section key={key} className="space-y-2">
              <h2 className="text-base font-semibold">
                {index + 1}. {t(`sections.${key}.title`)}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`sections.${key}.body`)}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">{t("lastUpdated")}</p>
      </div>
    </div>
  )
}
