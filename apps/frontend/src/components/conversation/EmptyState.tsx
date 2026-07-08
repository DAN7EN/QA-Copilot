import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  onStartConversation: () => void;
  error?: string | null;
};

export function EmptyState({ onStartConversation, error }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">QA Copilot</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tu copiloto conversacional para Quality Assurance. Iniciá una conversación para empezar.
        </p>
      </div>
      <Button onClick={onStartConversation}>Nueva conversación</Button>
      {error && (
        <p
          role="alert"
          className="max-w-sm rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
