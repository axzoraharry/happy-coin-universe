
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/pages/Dashboard";
import { Transactions } from "@/components/pages/Transactions";
import { Budgets } from "@/components/pages/Budgets";
import { Goals } from "@/components/pages/Goals";
import { Settings } from "@/components/pages/Settings";
import { Auth } from "@/components/pages/Auth";
import { Accounts } from "@/components/pages/Accounts";
import { Categories } from "@/components/pages/Categories";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { EnhancedMrHappyInterface } from '@/components/layout/EnhancedMrHappyInterface';

const queryClient = new QueryClient();

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  // For now, we'll simulate authentication as true
  // In a real app, you'd use proper authentication logic
  const isAuthenticated = true;

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          {isAuthenticated ? (
            <div className="h-screen flex overflow-hidden bg-gray-50">
              <Sidebar />
              <div className="flex-1 overflow-auto focus:outline-none">
                <Navbar 
                  currentPage={currentPage} 
                  onPageChange={handlePageChange}
                />
                <main className="relative py-6 lg:pt-8 lg:px-8">
                  <div className="mx-auto max-w-7xl">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/accounts" element={<Accounts />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/budgets" element={<Budgets />} />
                      <Route path="/goals" element={<Goals />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<Navigate to="/auth" />} />
            </Routes>
          )}
        </BrowserRouter>
        
        {/* Add the Enhanced Mr Happy Interface */}
        <EnhancedMrHappyInterface />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
