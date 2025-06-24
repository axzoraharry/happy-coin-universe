
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import CoinsPage from "@/pages/CoinsPage";
import CardsPage from "@/pages/CardsPage";
import HappyPaisaPage from "@/pages/HappyPaisaPage";
import APIPage from "@/pages/APIPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import UserManagementPage from "@/pages/UserManagementPage";
import NotFound from "@/pages/NotFound";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/coins" element={<CoinsPage />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/happy-paisa" element={<HappyPaisaPage />} />
            <Route path="/api" element={<APIPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/user-management" element={<UserManagementPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
