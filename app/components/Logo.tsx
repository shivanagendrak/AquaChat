import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LogoProps {
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 120 }) => {
  const { isDarkMode } = useTheme();

  // Use the appropriate logo based on theme
  const logoSource = isDarkMode
    ? require('../../assets/logo-dark.png')
    : require('../../assets/logo-light.png');

  return (
    <View style={styles.container}>
      <Image
        source={logoSource}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
        accessibilityLabel="AquaChat Logo"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  logo: {
    // Size is set via props and applied in the style array
  },
});

export default Logo;
