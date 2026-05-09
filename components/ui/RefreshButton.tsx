import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, radius } from '@/lib/theme';

interface RefreshButtonProps {
  isRefreshing: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function RefreshButton({ isRefreshing, onPress, disabled }: RefreshButtonProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isRefreshing) {
      // Inicia la rotación infinita suave
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1200,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      // Detiene la animación
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) });
    }
  }, [isRefreshing, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isRefreshing}
      activeOpacity={0.8}
      style={[styles.btn, isRefreshing && styles.btnActive]}
    >
      <Animated.View style={animatedStyle}>
        <RotateCcw
          size={18}
          color={isRefreshing ? colors.primary : colors.textSecondary}
          strokeWidth={2}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
});
