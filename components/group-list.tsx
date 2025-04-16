"use client"

import type React from "react"

import type { Group } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Users, CheckSquare, Globe } from "lucide-react"

interface SystemGroup {
  id: number
  name: string
  icon: React.ReactNode
}

interface GroupListProps {
  groups: Group[]
  selectedGroup: string
  onSelectGroup: (groupName: string) => void
  onDeleteGroup: (groupId: number) => void
  systemGroups?: SystemGroup[]
}

export function GroupList({ groups, selectedGroup, onSelectGroup, onDeleteGroup, systemGroups }: GroupListProps) {
  // 기본 시스템 그룹 (외부에서 제공되지 않은 경우)
  const defaultSystemGroups = [
    { id: -1, name: "전체", icon: <Globe className="h-4 w-4 mr-2" /> },
    { id: -2, name: "선택됨", icon: <CheckSquare className="h-4 w-4 mr-2" /> },
  ]

  // 사용할 시스템 그룹 (외부에서 제공된 경우 그것을 사용, 아니면 기본값)
  const sysGroups = systemGroups || defaultSystemGroups

  return (
    <ScrollArea className="h-[calc(100vh-450px)]">
      <div className="space-y-1">
        {/* System groups */}
        {sysGroups.map((group) => (
          <Button
            key={group.id}
            variant="ghost"
            className={cn("w-full justify-start", selectedGroup === group.name && "bg-muted")}
            onClick={() => onSelectGroup(group.name)}
          >
            {group.icon}
            {group.name}
          </Button>
        ))}

        {/* User groups */}
        {groups.map((group) => (
          <Button
            key={group.id}
            variant="ghost"
            className={cn("w-full justify-start", selectedGroup === group.name && "bg-muted")}
            onClick={() => onSelectGroup(group.name)}
          >
            <Users className="h-4 w-4 mr-2" />
            {group.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}

