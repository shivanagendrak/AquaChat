import { Feather } from '@expo/vector-icons';
import React, { memo, useEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import ApiKeySettings from './ApiKeySettings';

interface SettingsViewProps {
  isVisible: boolean;
  onClose: () => void;
}

const SettingsView = memo(({ isVisible, onClose }: SettingsViewProps) => {
  // State variables
  const [notifications, setNotifications] = React.useState(true);
  const [dataUsage, setDataUsage] = React.useState(false);

  // Get theme context
  const { isDarkMode, toggleTheme, theme } = useTheme();

  // Animation for sliding up - using Reanimated
  const slideProgress = useSharedValue(0);

  // Update animation when visibility changes
  useEffect(() => {
    if (isVisible) {
      slideProgress.value = withTiming(1, { duration: 300 });
    } else {
      slideProgress.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible]);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      slideProgress.value,
      [0, 1],
      [600, 0]
    );

    return {
      transform: [{ translateY }]
    };
  });

  if (!isVisible && slideProgress.value === 0) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.primary }]}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Appearance</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: "#D9D9D9", true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Notifications</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Enable Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#D9D9D9", true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>Data</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Reduce Data Usage</Text>
            <Switch
              value={dataUsage}
              onValueChange={setDataUsage}
              trackColor={{ false: "#D9D9D9", true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>API Configuration</Text>
          <ApiKeySettings />
        </View>

        <View style={[styles.section, { borderBottomColor: theme.divider }]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>About</Text>
          <TouchableOpacity style={styles.aboutRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Version</Text>
            <Text style={[styles.versionText, { color: theme.secondaryText }]}>1.0.0</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.aboutRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Terms of Service</Text>
            <Feather name="chevron-right" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.aboutRow}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Privacy Policy</Text>
            <Feather name="chevron-right" size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  closeButton: {
    position: 'absolute',
    left: 15,
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#204553',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#204553',
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  versionText: {
    fontSize: 16,
    color: '#999999',
  },
});

export default SettingsView;