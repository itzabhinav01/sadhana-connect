import { Minus, Plus } from 'lucide-react'
import type { Control, FieldValues, Path } from 'react-hook-form'

import { Button } from '@/presentation/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/presentation/components/ui/form'
import { Input } from '@/presentation/components/ui/input'
import { cn } from '@/shared/utils/cn'

export interface QuickAmountOption {
  label: string
  mode?: 'add' | 'set'
  amount: number
}

export type QuickAmountItem = number | QuickAmountOption

interface NumberFormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  // A stepper is only offered for fields tapped repeatedly through the
  // day (round counts) — matches apps/mobile's NumberField exactly, same
  // fields get one on both platforms.
  showStepper?: boolean
  quickAmounts?: QuickAmountItem[]
  allowDecimal?: boolean
  helpText?: string
}

export function NumberFormField<T extends FieldValues>({
  control,
  name,
  label,
  showStepper = false,
  quickAmounts,
  allowDecimal = false,
  helpText,
}: NumberFormFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const numericValue = Number(field.value) || 0

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2">
              {showStepper ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Decrease ${label}`}
                  onClick={() => field.onChange(String(Math.max(0, numericValue - 1)))}
                >
                  <Minus aria-hidden="true" />
                </Button>
              ) : null}
              <FormControl>
                <Input
                  inputMode={allowDecimal ? 'decimal' : 'numeric'}
                  placeholder={allowDecimal ? '0 (e.g. 2.5)' : '0'}
                  className="bg-card font-medium"
                  {...field}
                  onChange={(event) => {
                    const raw = event.target.value
                    field.onChange(allowDecimal ? raw.replace(',', '.') : raw)
                  }}
                />
              </FormControl>
              {showStepper ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Increase ${label}`}
                  onClick={() => field.onChange(String(numericValue + 1))}
                >
                  <Plus aria-hidden="true" />
                </Button>
              ) : null}
            </div>
            {quickAmounts ? (
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((item, index) => {
                  const opt: QuickAmountOption =
                    typeof item === 'number'
                      ? { label: String(item), mode: 'set', amount: item }
                      : item
                  const isSetMatch = opt.mode === 'set' && field.value === String(opt.amount)

                  const handlePress = () => {
                    if (opt.mode === 'add') {
                      field.onChange(String(Math.max(0, numericValue + opt.amount)))
                    } else {
                      field.onChange(String(opt.amount))
                    }
                  }

                  return (
                    <Button
                      key={`${opt.label}-${index}`}
                      type="button"
                      size="sm"
                      variant={isSetMatch ? 'default' : 'outline'}
                      aria-label={
                        opt.mode === 'add'
                          ? `Add ${opt.label} to ${label}`
                          : `Set ${label} to ${opt.amount}`
                      }
                      className={cn(isSetMatch && 'pointer-events-none')}
                      onClick={handlePress}
                    >
                      {opt.label}
                    </Button>
                  )
                })}
              </div>
            ) : null}
            {helpText ? <p className="text-sm text-muted-foreground">{helpText}</p> : null}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
