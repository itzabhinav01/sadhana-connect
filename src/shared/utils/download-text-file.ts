// Triggers a browser download of a plain-text file, entirely client-side —
// no network request, no server involvement. Used by Phase 16's Text
// export actions. The anchor is created, clicked, and removed immediately;
// nothing is left in the DOM or cached.
export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
