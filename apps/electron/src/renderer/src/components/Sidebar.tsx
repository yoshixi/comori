import React from 'react'
import { CalendarDays, ListTodo, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from './ui/sidebar'

type View = 'tasks' | 'calendar' | 'settings'

interface AppSidebarProps {
  currentView: View
  onViewChange: (view: View) => void
}

const menuItems = [
  { id: 'tasks' as const, label: 'Tasks', icon: ListTodo },
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { id: 'settings' as const, label: 'Settings', icon: Settings }
]

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps): React.JSX.Element {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Shuchu</span>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onViewChange(item.id)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
