import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Assignments from "./pages/Assignments";
import PendingDocs from "./pages/PendingDocs";
import Requests from "./pages/Requests";
import MyDevices from "./pages/MyDevices";
import MyRequests from "./pages/MyRequests";
import NotFound from "./pages/NotFound";

// Asset pages (new architecture)
import AssetList from "./pages/assets/AssetList";
import AssetNew from "./pages/assets/AssetNew";
import AssetDetail from "./pages/assets/AssetDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes with layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Assets routes - new architecture */}
              <Route path="/assets" element={<AssetList />} />
              <Route path="/assets/new" element={<AssetNew />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              
              {/* Legacy route redirect */}
              <Route path="/inventory" element={<Navigate to="/assets" replace />} />
              
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/pending-docs" element={<PendingDocs />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/my-devices" element={<MyDevices />} />
              <Route path="/my-requests" element={<MyRequests />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
