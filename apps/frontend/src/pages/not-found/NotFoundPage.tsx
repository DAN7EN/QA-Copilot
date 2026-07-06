import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section>
      <h1>404</h1>
      <p>Página no encontrada.</p>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}
