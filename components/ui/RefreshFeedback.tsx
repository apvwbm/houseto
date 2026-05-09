import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors, fontSize, spacing } from '@/lib/theme';

interface RefreshFeedbackProps {
  visible: boolean;
  onHidden?: () => void;
  message?: string;
}

export function RefreshFeedback({
  visible,
  onHidden,
  message = 'Lista actualizada',
}: RefreshFeedbackProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-30);

  useEffect(() => {
    if (visible) {
      // Mostrar feedback
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });

      // Auto-ocultar después de 2 segundos
      const timer = setTimeout(() => {
        opacity.value = withTiming(
          0,
          {
            duration: 300,
            easing: Easing.in(Easing.ease),
          },
          () => {
            if (onHidden) {
              runOnJS(onHidden)();
            }
          }
        );
        translateY.value = withTiming(-30, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, opacity, translateY, onHidden]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.banner}>
        <CheckCircle2 size={18} color={colors.success} strokeWidth={2.5} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl + 12, // Debajo del top bar
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
  },
  banner: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
});
