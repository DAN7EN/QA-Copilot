import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-center text-foreground">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-sm text-muted-foreground">Página no encontrada.</p>
      <Button asChild>
        <Link to="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
