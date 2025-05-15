import React, { memo } from 'react';
import { StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface DimOverlayProps {
  isVisible: boolean;
  opacity: SharedValue<number>;
  onPress: () => void;
}

// Using memo to prevent unnecessary re-renders
const DimOverlay = memo(({ isVisible, opacity, onPress }: DimOverlayProps) => {
  // Define the animated style outside of the conditional return
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!isVisible) return null;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        style={[
          styles.overlay,
          animatedStyle
        ]}
      />
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
});

export default DimOverlay;
