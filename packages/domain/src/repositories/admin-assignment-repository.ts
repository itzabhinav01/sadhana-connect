import type { AdminMentorAssignment } from '../entities/mentor-assignment'

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

  // Wraps public.assign_devotee_to_mentor(uuid, uuid) via RPC — SECURITY
  // INVOKER, additive only (never deactivates any other assignment),
  // relies entirely on the caller's own RLS privileges (see migration
  // 0015). This repository method adds no authorization logic of its own.
  assignMentor(devoteeId: string, mentorId: string): Promise<AdminMentorAssignment>

  deactivateAssignment(assignmentId: string): Promise<void>

  listMentorDevoteeCounts(): Promise<MentorDevoteeCount[]>

  getMentorDevoteeCount(mentorId: string): Promise<number>
}
