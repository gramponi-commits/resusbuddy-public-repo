import { useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { TermsOfServiceModal } from "@/components/TermsOfServiceModal";
import Index from "./pages/Index";
import SessionHistory from "./pages/SessionHistory";
import Settings from "./pages/Settings";
import InstallHelp from "./pages/InstallHelp";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import { useIsNativeApp } from "@/hooks/useIsNativeApp";
import { useTosAcceptance } from "@/hooks/useTosAcceptance";
import i18n, { isRTL, detectNativeLanguage } from "@/i18n";

const queryClient = new QueryClient();

// Initialize theme from localStorage and update status bar color
function useInitialTheme() {
  useEffect(() => {
    const updateThemeColor = (isDark: boolean) => {
      // Update theme-color meta tag for mobile status bar
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        // Dark mode: use navy background (hsl(222, 47%, 11%))
        // Light mode: use white
        metaThemeColor.setAttribute('content', isDark ? '#1a1f2e' : '#ffffff');
      }

      // Update apple-mobile-web-app-status-bar-style for iOS
      const metaAppleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (metaAppleStatusBar) {
        // Use 'default' for light mode (white status bar) and 'black-translucent' for dark mode
        metaAppleStatusBar.setAttribute('content', isDark ? 'black-translucent' : 'default');
      }
    };

    try {
      const stored = localStorage.getItem('acls-settings');
      if (stored) {
        const settings = JSON.parse(stored);
        const isDark = settings.theme === 'dark';
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        updateThemeColor(isDark);
      } else {
        // Default to dark
        document.documentElement.classList.add('dark');
        updateThemeColor(true);
      }
    } catch (e) {
      document.documentElement.classList.add('dark');
      updateThemeColor(true);
    }

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      updateThemeColor(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);
}

/**
 * Main layout component with gesture support for sidebar
 */
function AppLayout() {
  const { openMobile, setOpenMobile, isMobile } = useSidebar();
  const isNativeApp = useIsNativeApp();
  const { hasAccepted, isLoading, acceptTos } = useTosAcceptance();

  // Swipe gesture handlers - only active on mobile
  const swipeHandlers = useSwipeable({
    onSwipedRight: (eventData) => {
      // Only open sidebar if swipe starts from left edge (first 50px)
      if (isMobile && !openMobile && eventData.initial[0] < 50) {
        setOpenMobile(true);
      }
    },
    onSwipedLeft: () => {
      // Close sidebar on left swipe if it's open
      if (isMobile && openMobile) {
        setOpenMobile(false);
      }
    },
    trackMouse: false, // Touch only, not mouse
    preventScrollOnSwipe: false, // Allow scrolling
    delta: 50, // Minimum distance for swipe
  });

  // Show loading state while checking TOS acceptance
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* First-time TOS acceptance modal */}
      <TermsOfServiceModal
        open={!hasAccepted}
        onOpenChange={() => {}} // Prevent closing without acceptance
        requireAcceptance={true}
        onAccept={acceptTos}
      />

      <div {...swipeHandlers} className="min-h-screen flex w-full pb-safe" dir={isRTL(i18n.language) ? 'rtl' : 'ltr'}>
        <AppSidebar />
        <MobileHeader />
        <main className="flex-1 overflow-auto pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-0">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/history" element={<SessionHistory />} />
            <Route path="/settings" element={<Settings />} />
            {/* Hide install page in native apps (Android/iOS wrappers) */}
            <Route
              path="/install"
              element={isNativeApp ? <Navigate to="/" replace /> : <InstallHelp />}
            />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

const App = () => {
  useInitialTheme();

  // Detect native device language on app start
  useEffect(() => {
    detectNativeLanguage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <AppLayout />
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
