import { useState } from 'react'
import {
  Check,
  Eye,
  EyeOff,
  Layers,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
} from 'lucide-react'
import {
  STANDARD_SECTIONS,
  type CustomSectionFieldType,
  type StandardSectionKey,
  useSadhanaSectionsConfig,
} from '@sadhana-connect/sadhana'

import { Button } from '@/presentation/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/presentation/components/ui/dialog'
import { Input } from '@/presentation/components/ui/input'
import { Label } from '@/presentation/components/ui/label'

const FIELD_TYPE_OPTIONS: { label: string; value: CustomSectionFieldType; desc: string }[] = [
  { label: 'Number', value: 'number', desc: 'Whole number (e.g. 15 mins, 4 rounds)' },
  { label: 'Decimal', value: 'decimal', desc: 'Decimal hours (e.g. 1.5 hrs)' },
  { label: 'Yes / No', value: 'boolean', desc: 'Checkbox / Completed flag' },
  { label: 'Time', value: 'time', desc: 'Time of day (e.g. 05:00 AM)' },
  { label: 'Text', value: 'text', desc: 'Free text notes' },
]

export function SadhanaSheetSectionsConfigCard({
  profileId,
}: {
  profileId?: string | null
}) {
  const {
    config,
    toggleStandardSection,
    toggleCustomSection,
    addCustomSection,
    deleteCustomSection,
    resetToDefault,
  } = useSadhanaSectionsConfig(profileId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fieldType, setFieldType] = useState<CustomSectionFieldType>('number')
  const [unit, setUnit] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenAddDialog = () => {
    setTitle('')
    setDescription('')
    setFieldType('number')
    setUnit('')
    setDialogOpen(true)
  }

  const handleSaveCustomSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    try {
      await addCustomSection({
        title: title.trim(),
        description: description.trim() || undefined,
        fieldType,
        unit: unit.trim() || undefined,
      })
      setDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCustomSection = async (id: string, sectionTitle: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${sectionTitle}"? Standard sections can only be hidden, but custom sections are removed.`,
      )
    ) {
      await deleteCustomSection(id)
    }
  }

  const handleReset = async () => {
    if (
      window.confirm(
        'This will show all 7 standard sections in your sadhana sheet. Proceed?',
      )
    ) {
      await resetToDefault()
    }
  }

  return (
    <>
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sliders className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Sadhana Sheet Customization</CardTitle>
                <CardDescription>
                  Tailor which sections appear on your daily sadhana sheet. Standard sections can be hidden
                  (e.g. Office Schedule for students) but never permanently deleted.
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="shrink-0 text-xs"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Reset to Defaults
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* Standard Sections */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Standard Sections</h3>
              <span className="text-xs text-muted-foreground">
                (Cannot be deleted, can be hidden)
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {STANDARD_SECTIONS.map((sec) => {
                const isEnabled = config.standardSections[sec.key] !== false
                return (
                  <div
                    key={sec.key}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                      isEnabled
                        ? 'border-border/80 bg-card hover:bg-muted/30'
                        : 'border-dashed border-border/60 bg-muted/20 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {sec.title}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isEnabled
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isEnabled ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {sec.description}
                      </span>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant={isEnabled ? 'default' : 'outline'}
                      className="h-8 shrink-0 px-3 text-xs"
                      onClick={() =>
                        void toggleStandardSection(
                          sec.key as StandardSectionKey,
                          !isEnabled,
                        )
                      }
                      aria-label={`Toggle visibility of ${sec.title}`}
                    >
                      {isEnabled ? (
                        <>
                          <Eye className="mr-1 size-3.5" />
                          Show
                        </>
                      ) : (
                        <>
                          <EyeOff className="mr-1 size-3.5" />
                          Hide
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom Sections */}
          <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Additional Custom Sections
                </h3>
                <p className="text-xs text-muted-foreground">
                  Add practices specific to your seva or ashram schedule (e.g. Deity Worship, Mangala Aarti).
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddDialog}
                className="shrink-0 text-xs"
              >
                <Plus className="mr-1.5 size-3.5" />
                Add Custom Section
              </Button>
            </div>

            {config.customSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No custom sections added yet. Click &quot;Add Custom Section&quot; to add practices like Deity Worship, Seva, or Sloka study.
                </p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {config.customSections.map((sec) => (
                  <div
                    key={sec.id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                      sec.enabled
                        ? 'border-border/80 bg-card'
                        : 'border-dashed border-border/60 bg-muted/20 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {sec.title}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {sec.fieldType.toUpperCase()}{sec.unit ? ` (${sec.unit})` : ''}
                        </span>
                        {!sec.enabled ? (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Hidden
                          </span>
                        ) : null}
                      </div>
                      {sec.description ? (
                        <span className="text-xs text-muted-foreground">
                          {sec.description}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant={sec.enabled ? 'default' : 'outline'}
                        className="h-8 px-2.5 text-xs"
                        onClick={() => void toggleCustomSection(sec.id, !sec.enabled)}
                        aria-label={`Toggle visibility of ${sec.title}`}
                      >
                        {sec.enabled ? (
                          <Eye className="size-3.5" />
                        ) : (
                          <EyeOff className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteCustomSection(sec.id, sec.title)}
                        aria-label={`Delete ${sec.title}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Section Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveCustomSection}>
            <DialogHeader>
              <DialogTitle>Add Custom Sadhana Section</DialogTitle>
              <DialogDescription>
                Create a practice or tracking item tailored to your daily spiritual schedule.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="section-title">Section Title *</Label>
                <Input
                  id="section-title"
                  placeholder="e.g. Deity Worship, Mangala Aarti, Sloka Reading"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Field Type</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FIELD_TYPE_OPTIONS.map((opt) => {
                    const isSelected = fieldType === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFieldType(opt.value)}
                        className={`flex flex-col items-start rounded-lg border p-2 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <span className="text-xs font-semibold flex items-center gap-1">
                          {isSelected ? <Check className="size-3" /> : null}
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                          {opt.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {(fieldType === 'number' || fieldType === 'decimal') && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="section-unit">Unit (Optional)</Label>
                  <Input
                    id="section-unit"
                    placeholder="e.g. mins, hrs, rounds, verses"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="section-desc">Description (Optional)</Label>
                <Input
                  id="section-desc"
                  placeholder="Brief note on what to log"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !title.trim()}>
                {isSubmitting ? 'Saving…' : 'Save Section'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
