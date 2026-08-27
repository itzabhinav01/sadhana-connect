import { useState } from 'react'

import {
  MentorCapReachedError,
  useAdminUsers,
  useAssignMentor,
} from '@sadhana-connect/admin'
import { Button } from '@/presentation/components/ui/button'
import { Input } from '@/presentation/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/presentation/components/ui/select'

// Additive only — a devotee may have up to 3 active mentors at once
// (approved cap, 0015). This form only ever adds a mentor; it never
// replaces an existing one. Removing a specific mentor from a devotee
// is a separate action (the per-assignment "Deactivate" control below,
// or on AdminUserDetailPage's own "Current mentors" panel).
export function AdminAssignmentForm() {
  const [devoteeSearch, setDevoteeSearch] = useState('')
  const [mentorSearch, setMentorSearch] = useState('')
  const [devoteeId, setDevoteeId] = useState('')
  const [mentorId, setMentorId] = useState('')
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null)

  const devoteesQuery = useAdminUsers({
    role: 'devotee',
    status: 'active',
    search: devoteeSearch,
  })
  const mentorsQuery = useAdminUsers({ role: 'mentor', status: 'active', search: mentorSearch })

  const devotees = devoteesQuery.data?.pages.flatMap((page) => page.users) ?? []
  const mentors = mentorsQuery.data?.pages.flatMap((page) => page.users) ?? []

  const assign = useAssignMentor()

  function handleSubmit() {
    if (!devoteeId || !mentorId) return
    setBlockedMessage(null)
    assign.mutate(
      { devoteeId, mentorId },
      {
        onSuccess: () => {
          setDevoteeId('')
          setMentorId('')
        },
        onError: (error) => {
          if (error instanceof MentorCapReachedError) {
            setBlockedMessage(error.message)
          }
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-lg font-semibold text-foreground">Assign a Mentor</h2>

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
        <Select value={devoteeId || undefined} onValueChange={setDevoteeId}>
          <SelectTrigger aria-label="Devotee">
            <SelectValue placeholder="Select a devotee…" />
          </SelectTrigger>
          <SelectContent>
            {devotees.map((devotee) => (
              <SelectItem key={devotee.id} value={devotee.id}>
                {devotee.fullName}
              </SelectItem>
            ))}
          </SelectContent>
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
        <Select value={mentorId || undefined} onValueChange={setMentorId}>
          <SelectTrigger aria-label="Mentor">
            <SelectValue placeholder="Select a mentor…" />
          </SelectTrigger>
          <SelectContent>
            {mentors.map((mentor) => (
              <SelectItem key={mentor.id} value={mentor.id}>
                {mentor.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!devoteeId || !mentorId || assign.isPending}
        className="self-start"
      >
        {assign.isPending ? 'Saving…' : 'Assign'}
      </Button>

      {blockedMessage ? (
        <p className="text-xs text-destructive">{blockedMessage}</p>
      ) : null}
      {assign.isError && !blockedMessage ? (
        <p className="text-xs text-destructive">Something went wrong saving this assignment.</p>
      ) : null}
      {assign.isSuccess ? (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Assignment saved.</p>
      ) : null}
    </div>
  )
}
