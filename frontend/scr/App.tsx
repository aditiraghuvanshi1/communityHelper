import { Toaster } from "@/components/ui/sonner";
import { Route, Routes } from "react-router-dom";
import Layout from "@/components/site/Layout";
import Admin from "@/pages/Admin";
import ComplaintDetail from "@/pages/ComplaintDetail";
import Dashboard from "@/pages/Dashboard";
import Explore from "@/pages/Explore";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import Register from "@/pages/Register";
import Report from "@/pages/Report";
import { LocalityProvider } from "@/lib/locality-context";
import { LanguageProvider } from "@/lib/language-context";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <LanguageProvider>
      <LocalityProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/complaints/:id" element={<ComplaintDetail />} />
            <Route path="/report" element={<Report />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </LocalityProvider>
    </LanguageProvider>
  );
}
