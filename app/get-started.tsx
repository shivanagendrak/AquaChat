import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ImageItem {
  id: string;
  uri: string;
  name: string;
}

// Using all 15 local slide images with descriptive names
const originalImages: ImageItem[] = [
  { id: 'slide1', uri: require('../assets/images/slide1.jpg'), name: 'First Slide' },
  { id: 'slide2', uri: require('../assets/images/slide2.jpg'), name: 'Second Slide' },
  { id: 'slide3', uri: require('../assets/images/slide3.jpg'), name: 'Third Slide' },
  { id: 'slide4', uri: require('../assets/images/slide4.jpg'), name: 'Fourth Slide' },
  { id: 'slide5', uri: require('../assets/images/slide5.jpg'), name: 'Fifth Slide' },
  { id: 'slide6', uri: require('../assets/images/slide6.jpg'), name: 'Sixth Slide' },
  { id: 'slide7', uri: require('../assets/images/slide7.jpg'), name: 'Seventh Slide' },
  { id: 'slide8', uri: require('../assets/images/slide8.jpg'), name: 'Eighth Slide' },
  { id: 'slide9', uri: require('../assets/images/slide9.jpg'), name: 'Ninth Slide' },
  { id: 'slide10', uri: require('../assets/images/slide10.jpg'), name: 'Tenth Slide' },
  { id: 'slide11', uri: require('../assets/images/slide11.jpg'), name: 'Eleventh Slide' },
  { id: 'slide12', uri: require('../assets/images/slide12.jpg'), name: 'Twelfth Slide' },
  { id: 'slide13', uri: require('../assets/images/slide13.jpg'), name: 'Thirteenth Slide' },
  { id: 'slide14', uri: require('../assets/images/slide14.jpg'), name: 'Fourteenth Slide' },
  { id: 'slide15', uri: require('../assets/images/slide15.jpg'), name: 'Fifteenth Slide' },
];

// Create a duplicated array with unique keys and names
const images = [
  ...originalImages.map(img => ({ ...img, id: `${img.id}-1`, name: `${img.name} (Set 1)` })),
  ...originalImages.map(img => ({ ...img, id: `${img.id}-2`, name: `${img.name} (Set 2)` })),
  ...originalImages.map(img => ({ ...img, id: `${img.id}-3`, name: `${img.name} (Set 3)` }))
];

const { width, height } = Dimensions.get('window');
const numColumns = 3;
const baseTileSize = width / numColumns;
const horizontalTileSize = baseTileSize * 1.5; // Increased horizontal size by 50%
const verticalTileSize = baseTileSize * 2; // Increased from 1.5 to 2 for taller images
const totalItems = originalImages.length;
const ANIMATION_DURATION = 20000; // Reduced from 20000 to 8000 (8 seconds) for faster animation
const GRID_ANGLE = 20; // Angle in degrees for the grid tilt

export default function GetStarted() {
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isAnimating, setIsAnimating] = useState(true);

  const startAnimation = useCallback(() => {
    translateY.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -verticalTileSize * (totalItems / numColumns),
        duration: ANIMATION_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: ANIMATION_DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished && isAnimating) {
        startAnimation();
      }
    });
  }, [translateY, scaleAnim, isAnimating]);

  useEffect(() => {
    if (isAnimating) {
      startAnimation();
    }
    return () => {
      translateY.stopAnimation();
    };
  }, [isAnimating, startAnimation]);

  const handleGetStarted = () => {
    router.replace('/language');
  };

  const renderItem = ({ item, index }: { item: ImageItem; index: number }) => {
    const row = Math.floor(index / numColumns);
    const col = index % numColumns;
    
    return (
      <Animated.View
        key={item.id}
        style={[
          styles.imageContainer,
          {
            transform: [
              {
                translateY: translateY.interpolate({
                  inputRange: [-verticalTileSize * (totalItems / numColumns), 0],
                  outputRange: [0, -verticalTileSize * (totalItems / numColumns)],
                  extrapolate: 'clamp',
                }),
              },
              { scale: scaleAnim },
            ],
            left: col * horizontalTileSize,
            top: row * verticalTileSize,
          },
        ]}
      >
        <Image
          source={item.uri}
          style={styles.image}
          contentFit="cover"
          transition={1000}
        />
      </Animated.View>
    );
  };

  return (
    <View
      style={styles.container}
    >
      <View
        style={[
          styles.gridContainer,
          { transform: [{ rotate: `${GRID_ANGLE}deg` }] },
        ]}>
        {images.map((item, index) => renderItem({ item, index }))}
      </View>
      {/* Bottom Box */}
      <View style={styles.bottomBox}>
        <Text style={styles.headline}>Your AI-Powered Aquaculture Assistant</Text>
        <Text style={styles.description}>
          Chat directly with AI to solve your aquaculture problems instantly. Get personalized guidance anytime, anywhere.
        </Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    width: width * 2,
    height: height * 3,
    position: 'relative',
    transformOrigin: 'center',
  },
  imageContainer: {
    width: horizontalTileSize,
    height: verticalTileSize,
    padding: 8,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    flex: 1,
    borderRadius: 12,
  },
  bottomBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  headline: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#20434A',
    textAlign: 'center',
    marginBottom: 18,
    fontFamily: 'BricolageGrotesque-Bold',
    lineHeight: 44,
  },
  description: {
    fontSize: 13.5,
    color: '#222',
    textAlign: 'center',
    marginBottom: 36,
    fontFamily: 'BricolageGrotesque-Regular',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#20434A',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 40,
    width: '90%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'BricolageGrotesque-Bold',
  },
}); 