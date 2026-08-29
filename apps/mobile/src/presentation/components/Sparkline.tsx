import { StyleSheet, View } from 'react-native'

import { useTheme } from '../../application/theme/use-theme'
import { radius } from '../../shared/theme'

interface SparklinePoint {
  value: number
  hasData: boolean
}

interface SparklineProps {
  data: SparklinePoint[]
  height?: number
}

// A dependency-free bar sparkline — plain RN Views, no charting library.
// Bar height is proportional to the range's own max value (not a fixed
// scale), and a day with no submitted report renders as a fixed-height
// stub in the muted tone rather than a bar reaching 0, so "no data" reads
// differently from "a real, submitted zero".
export function Sparkline({ data, height = 56 }: SparklineProps) {
  const { colors } = useTheme()
  const max = Math.max(1, ...data.map((point) => point.value))

  return (
    <View style={[styles.row, { height }]}>
      {data.map((point, index) => {
        const barHeight = point.hasData ? Math.max(4, (point.value / max) * height) : 4
        return (
          <View key={index} style={styles.barTrack}>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  backgroundColor: point.hasData ? colors.primary : colors.mutedBackground,
                },
              ]}
            />
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: radius.sm,
    minHeight: 4,
  },
})
