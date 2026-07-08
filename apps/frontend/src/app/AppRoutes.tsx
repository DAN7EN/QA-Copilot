import { Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ChatPage } from "../pages/chat/ChatPage";
import { NotFoundPage } from "../pages/not-found/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ChatPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
