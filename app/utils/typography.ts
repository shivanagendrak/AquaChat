// Typography Utility
// This file contains typography utilities for consistent text styling across the app
// Following Apple's Human Interface Guidelines for Dynamic Type

import { Platform, TextStyle } from 'react-native';

// Font families
export const fontFamilies = {
  // Use system fonts for best performance and accessibility
  regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  semibold: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  mono: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
  // Fallback monospace fonts
  monoFallback: Platform.OS === 'ios' 
    ? 'Menlo, Consolas, "Liberation Mono", monospace' 
    : 'monospace',
};

// Font weights
export const fontWeights = {
  regular: '400',
  semibold: '600',
  bold: '700',
};

// Text styles based on Apple's Dynamic Type
export const textStyles: Record<string, TextStyle> = {
  // Large Title - Used for the main screen title
  largeTitle: {
    fontSize: 34,
    fontWeight: fontWeights.regular,
    lineHeight: 41,
    letterSpacing: 0.37,
  },
  
  // Title 1 - Used for primary headings
  title1: {
    fontSize: 28,
    fontWeight: fontWeights.regular,
    lineHeight: 34,
    letterSpacing: 0.36,
  },
  
  // Title 2 - Used for secondary headings
  title2: {
    fontSize: 22,
    fontWeight: fontWeights.regular,
    lineHeight: 28,
    letterSpacing: 0.35,
  },
  
  // Title 3 - Used for tertiary headings
  title3: {
    fontSize: 20,
    fontWeight: fontWeights.regular,
    lineHeight: 25,
    letterSpacing: 0.38,
  },
  
  // Headline - Used for emphasized content
  headline: {
    fontSize: 17,
    fontWeight: fontWeights.semibold,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  
  // Body - Used for regular text content (default for chat messages)
  body: {
    fontSize: 17,
    fontWeight: fontWeights.regular,
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  
  // Callout - Used for secondary content
  callout: {
    fontSize: 16,
    fontWeight: fontWeights.regular,
    lineHeight: 21,
    letterSpacing: -0.32,
  },
  
  // Subheadline - Used for section headers
  subheadline: {
    fontSize: 15,
    fontWeight: fontWeights.regular,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  
  // Footnote - Used for timestamps and supplementary information
  footnote: {
    fontSize: 13,
    fontWeight: fontWeights.regular,
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  
  // Caption 1 - Used for labels and captions
  caption1: {
    fontSize: 12,
    fontWeight: fontWeights.regular,
    lineHeight: 16,
    letterSpacing: 0,
  },
  
  // Caption 2 - Used for smaller labels and captions
  caption2: {
    fontSize: 11,
    fontWeight: fontWeights.regular,
    lineHeight: 13,
    letterSpacing: 0.07,
  },
};

// Helper function to get a text style with a specific weight
export const getTextStyle = (
  style: keyof typeof textStyles, 
  weight: keyof typeof fontWeights = 'regular'
): TextStyle => {
  return {
    ...textStyles[style],
    fontWeight: fontWeights[weight],
  };
};

// Helper function to get a monospaced text style for code blocks
export const getMonoTextStyle = (
  style: keyof typeof textStyles = 'body'
): TextStyle => {
  return {
    ...textStyles[style],
    fontFamily: fontFamilies.mono,
    // Additional styling for code blocks
    letterSpacing: 0, // Monospaced fonts look better with normal letter spacing
  };
};

// Export default to satisfy the router
export default {
  fontFamilies,
  fontWeights,
  textStyles,
  getTextStyle,
  getMonoTextStyle,
};
