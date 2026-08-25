import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'

import { colors, fontSize, spacing } from '../../shared/theme'

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
            {...inputProps}
          />
          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
