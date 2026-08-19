import { useState } from 'react'

import { useAdminUsers } from '@/application/admin/use-admin-users'
import { useReassignDevotee } from '@/application/admin/use-reassign-devotee'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import { Select } from '@/presentation/components/ui/select'

// Handles both first-time assignment and reassignment — public.reassign_devotee
// itself decides which applies (see useReassignDevotee), so this form has
// no separate "assign" vs "reassign" mode.
export function AdminAssignmentForm() {
  const [devoteeSearch, setDevoteeSearch] = useState('')
  const [mentorSearch, setMentorSearch] = useState('')
  const [devoteeId, setDevoteeId] = useState('')
  const [mentorId, setMentorId] = useState('')

  const devoteesQuery = useAdminUsers({
    role: 'devotee',
    status: 'active',
    search: devoteeSearch,
  })
  const mentorsQuery = useAdminUsers({ role: 'mentor', status: 'active', search: mentorSearch })

  const devotees = devoteesQuery.data?.pages.flatMap((page) => page.users) ?? []
  const mentors = mentorsQuery.data?.pages.flatMap((page) => page.users) ?? []

  const reassign = useReassignDevotee()

  function handleSubmit() {
    if (!devoteeId || !mentorId) return
    reassign.mutate(
      { devoteeId, mentorId },
      {
        onSuccess: () => {
          setDevoteeId('')
          setMentorId('')
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold text-foreground">Assign or Reassign Devotee</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="assignment-devotee-search" className="text-sm font-medium text-foreground">
          Devotee
        </label>
        <Input
          id="assignment-devotee-search"
          placeholder="Search devotee by name…"
          value={devoteeSearch}
          onChange={(event) => setDevoteeSearch(event.target.value)}
        />
        <Select value={devoteeId} onChange={(event) => setDevoteeId(event.target.value)}>
          <option value="">Select a devotee…</option>
          {devotees.map((devotee) => (
            <option key={devotee.id} value={devotee.id}>
              {devotee.fullName}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="assignment-mentor-search" className="text-sm font-medium text-foreground">
          Mentor
        </label>
        <Input
          id="assignment-mentor-search"
          placeholder="Search mentor by name…"
          value={mentorSearch}
          onChange={(event) => setMentorSearch(event.target.value)}
        />
        <Select value={mentorId} onChange={(event) => setMentorId(event.target.value)}>
          <option value="">Select a mentor…</option>
          {mentors.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>
              {mentor.fullName}
            </option>
          ))}
        </Select>
      </div>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!devoteeId || !mentorId || reassign.isPending}
        className="self-start"
      >
        {reassign.isPending ? 'Saving…' : 'Assign'}
      </Button>

      {reassign.isError ? (
        <p className="text-xs text-destructive">Something went wrong saving this assignment.</p>
      ) : null}
      {reassign.isSuccess ? (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Assignment saved.</p>
      ) : null}
    </div>
  )
}
