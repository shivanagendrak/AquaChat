import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS
} from 'react-native-reanimated';

interface EdgeDragDetectorProps {
  onDragStart: () => void;
  onDragUpdate: (translationX: number) => void;
  onDragEnd: (translationX: number, velocityX: number) => void;
  isMenuOpen: boolean;
}

const EdgeDragDetector: React.FC<EdgeDragDetectorProps> = ({
  onDragStart,
  onDragUpdate,
  onDragEnd,
  isMenuOpen
}) => {
  // Don't render the detector when menu is open
  if (isMenuOpen) return null;

  // Create a pan gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      runOnJS(onDragUpdate)(event.translationX);
    })
    .onEnd((event) => {
      runOnJS(onDragEnd)(event.translationX, event.velocityX);
    })
    .activeOffsetX([0, 20]); // Only activate for horizontal drags

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={styles.detector} />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  detector: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20, // Width of the edge detection area
    zIndex: 2,
  },
});

export default EdgeDragDetector;
