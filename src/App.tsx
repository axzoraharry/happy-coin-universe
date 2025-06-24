import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { useHydrate } from "@/hooks/useHydrate";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/useSession";
import { supabase } from "./integrations/supabase/client";
import { redirect } from "react-router-dom";
import Index from "@/pages/Index";
import CoinsPage from "@/pages/CoinsPage";
import CardsPage from "@/pages/CardsPage";
import HappyPaisaPage from "@/pages/HappyPaisaPage";
import APIPage from "@/pages/APIPage";
import NotFound from "@/pages/NotFound";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
