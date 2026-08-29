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

interface NumberFormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  // A stepper is only offered for fields tapped repeatedly through the
  // day (round counts) — matches apps/mobile's NumberField exactly, same
  // fields get one on both platforms.
  showStepper?: boolean
  quickAmounts?: number[]
  helpText?: string
}

export function NumberFormField<T extends FieldValues>({
  control,
  name,
  label,
  showStepper = false,
  quickAmounts,
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
                <Input inputMode="numeric" {...field} />
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
                {quickAmounts.map((amount) => {
                  const isActive = field.value === String(amount)
                  return (
                    <Button
                      key={amount}
                      type="button"
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      aria-label={`Set ${label} to ${amount}`}
                      className={cn(isActive && 'pointer-events-none')}
                      onClick={() => field.onChange(String(amount))}
                    >
                      {amount}
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
