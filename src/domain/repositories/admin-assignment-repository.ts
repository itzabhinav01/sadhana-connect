import type { AdminMentorAssignment } from '@/domain/entities/mentor-assignment'

export interface AdminAssignmentFilters {
  mentorId?: string
  devoteeId?: string
}

export interface MentorDevoteeCount {
  mentorId: string
  activeDevoteeCount: number
}

export interface AdminAssignmentRepository {
  listAssignments(filters: AdminAssignmentFilters): Promise<AdminMentorAssignment[]>

  // Wraps public.reassign_devotee(uuid, uuid) via RPC — SECURITY INVOKER,
  // atomic deactivate-old + insert-new, relies entirely on the caller's
  // own RLS privileges (see migration 0005). This repository method adds
  // no authorization logic of its own.
  reassignDevotee(devoteeId: string, newMentorId: string): Promise<AdminMentorAssignment>

  deactivateAssignment(assignmentId: string): Promise<void>

  listMentorDevoteeCounts(): Promise<MentorDevoteeCount[]>

  getMentorDevoteeCount(mentorId: string): Promise<number>
}
