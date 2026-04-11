import React from 'react'
import { CalendarDays, CircleUser, Home, ListTodo, MessageSquare, StickyNote } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from './ui/sidebar'

export type View = 'today' | 'calendar' | 'posts' | 'todo' | 'notes' | 'account'

interface AppSidebarProps {
  currentView: View
  onViewChange: (view: View) => void
}

const menuItems = [
  { id: 'today' as const, label: 'Today', icon: Home },
  { id: 'calendar' as const, label: 'Calendar', icon: CalendarDays },
  { id: 'posts' as const, label: 'Posts', icon: MessageSquare },
  { id: 'todo' as const, label: 'ToDo', icon: ListTodo },
  { id: 'notes' as const, label: 'Notes', icon: StickyNote },
  { id: 'account' as const, label: 'Account', icon: CircleUser }
]

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps): React.JSX.Element {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Techo</span>
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
      <SidebarFooter />
    </Sidebar>
  )
}
