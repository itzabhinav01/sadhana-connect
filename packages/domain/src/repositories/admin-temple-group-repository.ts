import type { TempleGroup } from '@sadhana-connect/domain/entities/temple-group'

export interface AdminTempleGroupRepository {
  listTempleGroups(): Promise<TempleGroup[]>
  createTempleGroup(name: string): Promise<TempleGroup>
  renameTempleGroup(id: string, name: string): Promise<TempleGroup>

  // Fails with the DB's own ON DELETE RESTRICT error (profiles.temple_group_id,
  // announcements.temple_group_id) if the group is still in use — no
  // pre-check duplicated here, the constraint is the source of truth.
  deleteTempleGroup(id: string): Promise<void>
}
