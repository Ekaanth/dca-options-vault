import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { StarknetProvider } from "./lib/StarknetProvider";
import { WalletConnect } from "./components/WalletConnect";

const queryClient = new QueryClient();

const App = () => (
  <StarknetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-xl font-bold">DCA Options Vault</h1>
              <WalletConnect />
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
              </Routes>
            </BrowserRouter>
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  </StarknetProvider>
);

export default App;
