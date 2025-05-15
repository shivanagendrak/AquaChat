import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// Define theme colors
export const lightTheme = {
  background: '#FFFFFF',
  text: '#333333',
  secondaryText: '#666666',
  placeholderText: '#999999',
  primary: '#204553',
  secondary: '#AAAAAA',
  searchBackground: '#EAEAEA',
  divider: '#EEEEEE',
  chatRowPressed: 'rgba(0, 0, 0, 0.05)',
  icon: '#666666',
  headerBackground: 'transparent',
};

export const darkTheme = {
  background: '#121212',
  text: '#F0F0F0',
  secondaryText: '#BBBBBB',
  placeholderText: '#888888',
  primary: '#FFFFFF', // Changed to white for better visibility in dark mode
  secondary: '#777777',
  searchBackground: '#2A2A2A',
  divider: '#333333',
  chatRowPressed: 'rgba(255, 255, 255, 0.1)',
  icon: '#BBBBBB',
  headerBackground: 'transparent',
};

// Theme context type
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme;
};

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get device color scheme
  const deviceColorScheme = useColorScheme();

  // Initialize dark mode state based on device preference
  const [isDarkMode, setIsDarkMode] = useState(deviceColorScheme === 'dark');

  // Update theme when device color scheme changes
  useEffect(() => {
    setIsDarkMode(deviceColorScheme === 'dark');
  }, [deviceColorScheme]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Get current theme based on dark mode state
  const theme = isDarkMode ? darkTheme : lightTheme;

  // Context value
  const contextValue = {
    isDarkMode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Default export to satisfy the router
export default {
  ThemeProvider,
  useTheme,
  ThemeContext,
  lightTheme,
  darkTheme
};
