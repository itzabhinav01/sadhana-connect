import { useContext } from 'react'
import { QueryClient, QueryClientContext, useMutation, useQuery } from '@tanstack/react-query'
import { AuthContext } from '@sadhana-connect/auth'
import { sadhanaQueryKeys } from './sadhana-query-keys'
import {
  DEFAULT_SADHANA_SECTIONS_CONFIG,
  getCustomSectionValuesAsync,
  getCustomSectionValuesSync,
  getSadhanaSectionsConfigAsync,
  getSadhanaSectionsConfigSync,
  saveCustomSectionValues,
  saveSadhanaSectionsConfig,
  type CustomSadhanaSection,
  type CustomSectionFieldType,
  type SadhanaSectionsConfig,
  type StandardSectionKey,
} from './sadhana-sections-config'

let fallbackQueryClient: QueryClient | null = null

const noopFallbackClient = {
  cancelQueries: async () => {},
  getQueryData: () => undefined,
  setQueryData: () => {},
  invalidateQueries: async () => {},
} as unknown as QueryClient

function getFallbackQueryClient(): QueryClient {
  if (fallbackQueryClient) return fallbackQueryClient
  try {
    if (typeof QueryClient === 'function') {
      fallbackQueryClient = new QueryClient()
      return fallbackQueryClient
    }
  } catch {
    // fallback gracefully if QueryClient is not constructible (e.g., partial mock in tests)
  }
  return noopFallbackClient
}

function useSafeQueryClient(): QueryClient {
  const contextClient = useContext(QueryClientContext)
  return contextClient ?? getFallbackQueryClient()
}

export function useSadhanaSectionsConfig(profileId?: string | null) {
  const authContext = useContext(AuthContext)
  const effectiveProfileId = profileId ?? authContext?.session?.userId ?? 'default'
  const queryClient = useSafeQueryClient()

  const query = useQuery(
    {
      queryKey: sadhanaQueryKeys.sectionsConfig(effectiveProfileId),
      initialData: () => getSadhanaSectionsConfigSync(effectiveProfileId),
      queryFn: async (): Promise<SadhanaSectionsConfig> => {
        return getSadhanaSectionsConfigAsync(effectiveProfileId)
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    queryClient,
  )

  const mutation = useMutation(
    {
      mutationFn: async (newConfig: SadhanaSectionsConfig) => {
        saveSadhanaSectionsConfig(effectiveProfileId, newConfig)
        return newConfig
      },
      onMutate: async (newConfig) => {
        await queryClient.cancelQueries({
          queryKey: sadhanaQueryKeys.sectionsConfig(effectiveProfileId),
        })
        const previous = queryClient.getQueryData<SadhanaSectionsConfig>(
          sadhanaQueryKeys.sectionsConfig(effectiveProfileId),
        )
        queryClient.setQueryData(
          sadhanaQueryKeys.sectionsConfig(effectiveProfileId),
          newConfig,
        )
        return { previous }
      },
      onError: (_err, _newConfig, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            sadhanaQueryKeys.sectionsConfig(effectiveProfileId),
            context.previous,
          )
        }
      },
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: sadhanaQueryKeys.sectionsConfig(effectiveProfileId),
        })
      },
    },
    queryClient,
  )


  const currentConfig = query.data ?? DEFAULT_SADHANA_SECTIONS_CONFIG

  const toggleStandardSection = async (
    key: StandardSectionKey,
    enabled?: boolean,
  ) => {
    const nextEnabled =
      enabled !== undefined ? enabled : !currentConfig.standardSections[key]
    const updated: SadhanaSectionsConfig = {
      ...currentConfig,
      standardSections: {
        ...currentConfig.standardSections,
        [key]: nextEnabled,
      },
    }
    return mutation.mutateAsync(updated)
  }

  const toggleCustomSection = async (id: string, enabled?: boolean) => {
    const updatedCustom = currentConfig.customSections.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          enabled: enabled !== undefined ? enabled : !item.enabled,
        }
      }
      return item
    })
    const updated: SadhanaSectionsConfig = {
      ...currentConfig,
      customSections: updatedCustom,
    }
    return mutation.mutateAsync(updated)
  }

  const addCustomSection = async (params: {
    title: string
    description?: string
    fieldType: CustomSectionFieldType
    unit?: string
  }) => {
    const newSection: CustomSadhanaSection = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: params.title.trim(),
      description: params.description?.trim(),
      fieldType: params.fieldType,
      unit: params.unit?.trim(),
      enabled: true,
      createdAt: new Date().toISOString(),
    }
    const updated: SadhanaSectionsConfig = {
      ...currentConfig,
      customSections: [...currentConfig.customSections, newSection],
    }
    return mutation.mutateAsync(updated)
  }

  const deleteCustomSection = async (id: string) => {
    const updatedCustom = currentConfig.customSections.filter(
      (item) => item.id !== id,
    )
    const updated: SadhanaSectionsConfig = {
      ...currentConfig,
      customSections: updatedCustom,
    }
    return mutation.mutateAsync(updated)
  }

  const resetToDefault = async () => {
    return mutation.mutateAsync({ ...DEFAULT_SADHANA_SECTIONS_CONFIG })
  }

  return {
    ...query,
    config: currentConfig,
    isUpdating: mutation.isPending,
    toggleStandardSection,
    toggleCustomSection,
    addCustomSection,
    deleteCustomSection,
    resetToDefault,
  }
}

export function useCustomSectionValues(date: string, profileId?: string | null) {
  const authContext = useContext(AuthContext)
  const effectiveProfileId = profileId ?? authContext?.session?.userId ?? 'default'
  const queryClient = useSafeQueryClient()

  const query = useQuery(
    {
      queryKey: sadhanaQueryKeys.customSectionValues(effectiveProfileId, date),
      initialData: () => getCustomSectionValuesSync(effectiveProfileId, date),
      queryFn: async () => getCustomSectionValuesAsync(effectiveProfileId, date),
      staleTime: 1000 * 60 * 5,
    },
    queryClient,
  )

  const mutation = useMutation(
    {
      mutationFn: async (values: Record<string, any>) => {
        saveCustomSectionValues(effectiveProfileId, date, values)
        return values
      },
      onMutate: async (values) => {
        await queryClient.cancelQueries({
          queryKey: sadhanaQueryKeys.customSectionValues(effectiveProfileId, date),
        })
        const previous = queryClient.getQueryData<Record<string, any>>(
          sadhanaQueryKeys.customSectionValues(effectiveProfileId, date),
        )
        queryClient.setQueryData(
          sadhanaQueryKeys.customSectionValues(effectiveProfileId, date),
          values,
        )
        return { previous }
      },
      onError: (_err, _values, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            sadhanaQueryKeys.customSectionValues(effectiveProfileId, date),
            context.previous,
          )
        }
      },
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: sadhanaQueryKeys.customSectionValues(effectiveProfileId, date),
        })
      },
    },
    queryClient,
  )


  const currentValues = query.data ?? {}

  const setFieldValue = async (fieldId: string, value: any) => {
    const updated = {
      ...currentValues,
      [fieldId]: value,
    }
    return mutation.mutateAsync(updated)
  }

  return {
    ...query,
    values: currentValues,
    setFieldValue,
    saveValues: mutation.mutateAsync,
  }
}

