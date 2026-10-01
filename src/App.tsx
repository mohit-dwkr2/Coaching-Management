import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react"; // Added useEffect
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import About from "./pages/About";
import UserLogin from "./pages/UserLogin";
import Dashboard from "./pages/Dashboard";
import SetPassword from "./pages/SetPassword";
import { TenantProvider } from "@/contexts/TenantContext";

const queryClient = new QueryClient();

// 🔥 Scroll Logic: Ye function hash (#) dekh kar sahi jagah scroll karega
function ScrollToHash() {
  // 1. 'key' ko bhi nikaal lein
  const { hash, pathname, key } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");

      let count = 0;
      const checkAndScroll = setInterval(() => {
        const element = document.getElementById(id);

        if (element) {
          // Element mil gaya!
          const offset = 80; // Mobile/Desktop navbar ke liye 80px ka gap rakhein
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });

          clearInterval(checkAndScroll);
        }

        count++;
        if (count > 20) clearInterval(checkAndScroll);
      }, 100);

      return () => clearInterval(checkAndScroll);
    } else {
      // Agar home page par click kiya (bina hash ke), toh top par jaye
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // 🔥 KEY ADD KIYA: Ab har click par ye useEffect dobara chalega!
  }, [hash, pathname, key]);

  return null;
}

function LayoutContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin") || location.pathname === "/admin-login" ||
    location.pathname === "/dashboard";

  return (
    <>
      <ScrollToHash /> {/* 🔥 Ise yahan add kiya */}

      {!isAdminPage && (
        <>

          <Navbar />
        </>
      )}

      <div>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/userlogin" element={<UserLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <TenantProvider>
          <LayoutContent />
        </TenantProvider>
      </BrowserRouter>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;