import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { RightPanel } from "./RightPanel";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1">
          <Outlet />
        </main>
      </div>
      <RightPanel />
    </div>
  );
}
