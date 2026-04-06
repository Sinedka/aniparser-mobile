import React, { useMemo } from "react";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ViewStyle } from "react-native";

type Props = {
  streakIntervalMs?: number
  holdDelayMs?: number

  onFirstPressIn?: () => void
  onHoldWithoutStreak?: () => void
  onHoldEnd?: () => void

  onStreakPress?: (count: number) => void
  onStreakBroken?: (lastCount: number) => void

  style?: ViewStyle
  children?: React.ReactNode
}

export function StreakPressable({
  streakIntervalMs = 300,
  holdDelayMs = 350,
  onFirstPressIn,
  onHoldWithoutStreak,
  onHoldEnd,
  onStreakPress,
  onStreakBroken,
  style,
  children,
}: Props) {

  const lastDownTs = useSharedValue(0)
  const count = useSharedValue(0)

  const brokenCount = useSharedValue(0)
  const breakTimer = useSharedValue(0)

  const holdFiredThisTouch = useSharedValue(false)

  const scheduleBreak = (currentCount: number) => {
    "worklet"

    cancelAnimation(breakTimer)

    breakTimer.value = withDelay(
      streakIntervalMs,
      withTiming(1, { duration: 1 }, finished => {
        if (finished) {
          brokenCount.value = currentCount
          count.value = 0
          lastDownTs.value = 0
        }
      })
    )
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const touchGesture = useMemo(() =>
    Gesture.Pan()
      .minDistance(0)

      .onBegin(() => {
        const now = Date.now()

        const within =
          lastDownTs.value !== 0 &&
          now - lastDownTs.value <= streakIntervalMs

        if (!within) {
          count.value = 1
          lastDownTs.value = now

          if (onFirstPressIn) runOnJS(onFirstPressIn)()

          scheduleBreak(1)
          return
        }

        count.value += 1
        lastDownTs.value = now

        if (onStreakPress) runOnJS(onStreakPress)(count.value)

        scheduleBreak(count.value)
      }),

  [onFirstPressIn, onStreakPress, streakIntervalMs])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const longPressGesture = useMemo(() =>
    Gesture.LongPress()
      .minDuration(holdDelayMs)

      .onStart(() => {
        if (!holdFiredThisTouch.value && count.value < 2) {
          holdFiredThisTouch.value = true
          if (onHoldWithoutStreak) runOnJS(onHoldWithoutStreak)()
        }
      })

      .onEnd(() => {
        if (holdFiredThisTouch.value) {
          holdFiredThisTouch.value = false
          if (onHoldEnd) runOnJS(onHoldEnd)()
        }
      }),

  [holdDelayMs, onHoldWithoutStreak, onHoldEnd])

  const gesture = Gesture.Simultaneous(touchGesture, longPressGesture)

  useAnimatedReaction(
    () => brokenCount.value,
    (val, prev) => {
      if (val !== 0 && val !== prev) {
        if (onStreakBroken) runOnJS(onStreakBroken)(val)
        brokenCount.value = 0
      }
    },
    [onStreakBroken]
  )

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style}>
        {children}
      </Animated.View>
    </GestureDetector>
  )
}
