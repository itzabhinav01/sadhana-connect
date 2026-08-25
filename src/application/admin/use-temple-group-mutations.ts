import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { useAuth } from '@sadhana-connect/auth'
import { supabaseAdminTempleGroupRepository } from '@sadhana-connect/infra-supabase/admin-temple-group-repository'

export function useCreateTempleGroup() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: (name: string) => supabaseAdminTempleGroupRepository.createTempleGroup(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.templeGroups(adminUserId) })
    },
  })
}

export function useRenameTempleGroup() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      supabaseAdminTempleGroupRepository.renameTempleGroup(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.templeGroups(adminUserId) })
    },
  })
}

export function useDeleteTempleGroup() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const adminUserId = session?.userId ?? null

  return useMutation({
    mutationFn: (id: string) => supabaseAdminTempleGroupRepository.deleteTempleGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.templeGroups(adminUserId) })
    },
  })
}
