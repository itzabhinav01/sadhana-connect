import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

// A single icon family (Ionicons) used everywhere in the app, restricted
// to a curated name list rather than Ionicons' full ~1300-glyph set —
// this is what keeps "one consistent icon library" actually consistent
// instead of every screen picking its own near-equivalent glyph.
// "-outline" is the default/inactive weight; the filled counterpart
// (no suffix) is reserved for an active/selected state (active tab,
// a lit streak flame, a pinned announcement).
export type IconName =
  | 'home-outline'
  | 'home'
  | 'book-outline'
  | 'book'
  | 'time-outline'
  | 'time'
  | 'stats-chart-outline'
  | 'stats-chart'
  | 'notifications-outline'
  | 'notifications'
  | 'people-outline'
  | 'people'
  | 'hourglass-outline'
  | 'hourglass'
  | 'megaphone-outline'
  | 'chatbubble-outline'
  | 'alarm-outline'
  | 'archive-outline'
  | 'pin'
  | 'pin-outline'
  | 'flame'
  | 'flame-outline'
  | 'chevron-down-outline'
  | 'chevron-up-outline'
  | 'chevron-forward-outline'
  | 'checkmark'
  | 'checkmark-circle-outline'
  | 'ellipsis-horizontal-outline'
  | 'log-out-outline'
  | 'settings-outline'
  | 'person-outline'
  | 'person-circle-outline'
  | 'copy-outline'
  | 'open-outline'
  | 'close-outline'
  | 'sunny'
  | 'sunny-outline'
  | 'moon'
  | 'moon-outline'

interface IconProps {
  name: IconName
  size?: number
  color: string
  accessibilityLabel?: string
}

// Decorative by default (accessibilityElementsHidden) — the enclosing
// control (a tab, a button, a row) already carries the accessible
// name/role. Pass accessibilityLabel only for an icon standing alone
// with no surrounding label.
export function Icon({ name, size = 20, color, accessibilityLabel }: IconProps) {
  const props: ComponentProps<typeof Ionicons> = {
    name,
    size,
    color,
  }
  if (accessibilityLabel) {
    return <Ionicons {...props} accessibilityLabel={accessibilityLabel} accessible />
  }
  return <Ionicons {...props} importantForAccessibility="no" accessibilityElementsHidden />
}
