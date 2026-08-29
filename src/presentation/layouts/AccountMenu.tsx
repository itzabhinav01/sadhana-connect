import { LogOut, Settings, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { useSignOut } from '@/application/auth/use-sign-out'
import type { AppRole } from '@sadhana-connect/domain/entities/profile'
import {
  Avatar,
  AvatarFallback,
} from '@/presentation/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu'

const roleLabels: Record<AppRole, string> = {
  devotee: 'Devotee',
  mentor: 'Mentor',
  super_admin: 'Super Admin',
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || '?'
}

interface AccountMenuProps {
  fullName: string
  email: string | null
  role: AppRole
}

export function AccountMenu({ fullName, email, role }: AccountMenuProps) {
  const navigate = useNavigate()
  const signOut = useSignOut()

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => navigate('/login', { replace: true }),
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Avatar>
            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium text-foreground">
            {fullName}
          </span>
          {email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
          ) : null}
          <span className="text-xs font-normal text-muted-foreground">
            {roleLabels[role]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/profile')}>
          <User className="size-4" aria-hidden="true" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings')}>
          <Settings className="size-4" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} disabled={signOut.isPending}>
          <LogOut className="size-4" aria-hidden="true" />
          {signOut.isPending ? 'Signing out…' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
