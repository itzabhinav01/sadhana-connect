import { useMutation, useQueryClient } from '@tanstack/react-query'

import { adminQueryKeys } from '@/application/admin/admin-query-keys'
import { supabaseAdminAssignmentRepository } from '@/infrastructure/supabase/admin-assignment-repository'

export function useDeactivateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (assignmentId: string) =>
      supabaseAdminAssignmentRepository.deactivateAssignment(assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.all })
    },
  })
}
