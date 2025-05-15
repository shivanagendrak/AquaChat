// API Key Settings Component
// This component allows users to view and update their API key

import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getApiKey, saveApiKey } from '../config/apiConfig';
import { useTheme } from '../context/ThemeContext';

const ApiKeySettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  // Load the API key when the component mounts
  useEffect(() => {
    loadApiKey();
  }, []);

  // Load the API key from storage
  const loadApiKey = async () => {
    try {
      setIsLoading(true);
      const key = await getApiKey();
      setApiKey(key || '');
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading API key:', error);
      setIsLoading(false);
    }
  };

  // Save the API key to storage
  const handleSaveApiKey = async () => {
    try {
      if (!apiKey.trim()) {
        Alert.alert('Error', 'Please enter a valid API key');
        return;
      }

      await saveApiKey(apiKey.trim());
      Alert.alert('Success', 'API key saved successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving API key:', error);
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  // Toggle editing mode
  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Cancel editing
  const handleCancel = () => {
    loadApiKey(); // Reload the original key
    setIsEditing(false);
  };

  // Mask the API key for display
  const getMaskedApiKey = () => {
    if (!apiKey) return 'No API key set';
    if (apiKey.length <= 8) return '••••••••';
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>API Key</Text>
        {!isEditing && (
          <TouchableOpacity onPress={toggleEditing} style={styles.editButton}>
            <Feather name="edit" size={20} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading...</Text>
      ) : isEditing ? (
        <View>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.searchBackground,
                borderColor: theme.divider
              }
            ]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Enter your API key"
            placeholderTextColor={theme.placeholderText}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={true}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleCancel}
              style={[styles.button, styles.cancelButton, { borderColor: theme.divider }]}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveApiKey}
              style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={[styles.apiKeyText, { color: theme.secondaryText }]}>
          {getMaskedApiKey()}
        </Text>
      )}

      <Text style={[styles.infoText, { color: theme.secondaryText }]}>
        Your API key is stored securely on your device and is used to authenticate requests to the Llama API.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    padding: 5,
  },
  loadingText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  apiKeyText: {
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#204553',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ApiKeySettings;
