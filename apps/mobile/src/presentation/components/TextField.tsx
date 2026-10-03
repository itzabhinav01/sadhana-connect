import { useMemo } from 'react'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { fontSize, spacing, fontFamily } from '../../shared/theme'
import type { ThemeColors } from '../../shared/theme'

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  secureTextEntry?: boolean
  keyboardType?: TextInputProps['keyboardType']
  autoComplete?: TextInputProps['autoComplete']
  placeholder?: string
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  ...inputProps
}: TextFieldProps<T>) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value as string | undefined}
            autoCapitalize="none"
            accessibilityLabel={label}
            placeholderTextColor={colors.placeholder ?? colors.muted}
            {...inputProps}
          />
          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        </View>
      )}
    />
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      fontFamily: fontFamily.semiBold,
      color: colors.foreground,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      fontSize: fontSize.base,
      color: colors.foreground,
    },
    inputError: {
      borderColor: colors.destructive,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.destructive,
    },
  })
}
