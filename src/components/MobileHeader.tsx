import { Menu, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsNativeApp } from '@/hooks/useIsNativeApp';

export function MobileHeader() {
  const { toggleSidebar, isMobile } = useSidebar();
  const { isInstallable, promptInstall } = usePWAInstall();
  const isNativeApp = useIsNativeApp();

  if (!isMobile) return null;

  // Show install button only in PWA (not native app) and when installable
  const showInstallButton = !isNativeApp && isInstallable;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 bg-card border-b border-border pt-[calc(0.5rem+env(safe-area-inset-top,0px))]">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-10 w-10"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex items-center gap-3">
        <img
          src="/newicon.png"
          alt="ResusBuddy Icon"
          className="h-[2.53125rem] w-[2.53125rem]"
        />
        <span className="font-bold text-lg text-acls-shockable">ResusBuddy</span>
      </div>

      {showInstallButton ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={promptInstall}
          className="h-10 w-10"
        >
          <Download className="h-5 w-5" />
        </Button>
      ) : (
        <div className="w-10" />
      )}
    </header>
  );
}
