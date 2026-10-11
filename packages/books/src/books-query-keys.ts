export const booksKeys = {
  all: ['books'] as const,
  catalog: () => [...booksKeys.all, 'catalog'] as const,
  devoteeProgress: (profileId: string | null | undefined) =>
    [...booksKeys.all, 'progress', profileId] as const,
}
