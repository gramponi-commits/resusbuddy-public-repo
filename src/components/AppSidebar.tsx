import { useTranslation } from 'react-i18next';
import { Heart, History, Settings, Menu, Smartphone, Info, Shield } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useIsNativeApp } from '@/hooks/useIsNativeApp';

export function AppSidebar() {
  const { t } = useTranslation();
  const { state, isMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const hideLabels = !isMobile && collapsed;
  const isNativeApp = useIsNativeApp();

  const allItems = [
    { title: t('nav.code'), url: '/', icon: Heart },
    { title: t('nav.history'), url: '/history', icon: History },
    { title: t('nav.settings'), url: '/settings', icon: Settings },
    { title: t('nav.install'), url: '/install', icon: Smartphone },
    { title: t('nav.about'), url: '/about', icon: Info },
    { title: t('nav.privacy'), url: '/privacy', icon: Shield },
  ];

  // Filter out install page for native apps (Android/iOS wrappers)
  const items = isNativeApp
    ? allItems.filter((item) => item.url !== '/install')
    : allItems;

  return (
    <Sidebar
      className={cn(
        'bg-card border-r border-border transition-all duration-300',
        hideLabels ? 'w-14' : 'w-56'
      )}
      collapsible="icon"
    >
      <div className="flex items-center justify-between p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] border-b border-border">
        <div className="flex items-center gap-3">
          <img
            src="/newicon.png"
            alt="ResusBuddy Icon"
            className={cn(
              "h-[2.53125rem] w-[2.53125rem] transition-opacity duration-200",
              hideLabels && "opacity-0 w-0 overflow-hidden"
            )}
          />
          <span className={cn(
            "font-bold text-lg text-acls-critical transition-opacity duration-200",
            hideLabels && "opacity-0 w-0 overflow-hidden"
          )}>
            ResusBuddy
          </span>
        </div>
        <SidebarTrigger className="h-8 w-8">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className={cn(
                        "transition-opacity duration-200",
                        hideLabels && "opacity-0 w-0 overflow-hidden"
                      )}>
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
