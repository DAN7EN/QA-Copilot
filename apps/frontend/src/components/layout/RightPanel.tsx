import { useState } from "react";
import { Check, Copy, Download, Loader2, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGherkinStore } from "@/stores/gherkin.store";

const DIACRITIC_PATTERN = /\p{Diacritic}/gu;

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "escenarios";
}

function GherkinResultView() {
  const result = useGherkinStore((state) => state.result);
  const [copied, setCopied] = useState(false);

  if (!result) {
    return null;
  }

  async function handleCopy() {
    if (!result) {
      return;
    }
    await navigator.clipboard.writeText(result.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!result) {
      return;
    }
    const blob = new Blob([result.rawMarkdown], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(result.title)}.feature`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="truncate text-sm font-medium text-foreground">
          {result.title || "Gherkin Generator"}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => void handleCopy()} title="Copiar">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} title="Descargar .feature">
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-4 py-4 text-sm">
          {result.feature && (
            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Feature</h3>
              <p className="whitespace-pre-wrap text-foreground">{result.feature}</p>
            </section>
          )}

          {result.background && result.background.length > 0 && (
            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Background</h3>
              <ul className="space-y-0.5 text-foreground">
                {result.background.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </section>
          )}

          {result.scenarios.map((scenario, index) => (
            <section key={index} className="space-y-1">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                Scenario: {scenario.title}
              </h3>
              <ul className="space-y-0.5 text-foreground">
                {scenario.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ul>
            </section>
          ))}

          <Separator />

          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Markdown</h3>
            <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/50 p-3 text-xs text-foreground">
              {result.rawMarkdown}
            </pre>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

function EmptyPanel({ isGenerating }: { isGenerating: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {isGenerating ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <PanelRight className="size-5" />
        )}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {isGenerating ? "Generando..." : "Panel de resultados"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isGenerating
            ? "Estamos generando los escenarios Gherkin."
            : "Acá vivirán las propiedades, resultados, Gherkin, casos de prueba y Playwright de futuras capacidades."}
        </p>
      </div>
    </div>
  );
}

export function RightPanel() {
  const result = useGherkinStore((state) => state.result);
  const isGenerating = useGherkinStore((state) => state.isGenerating);

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-card/40 lg:flex">
      {result ? <GherkinResultView /> : <EmptyPanel isGenerating={isGenerating} />}
    </aside>
  );
}
