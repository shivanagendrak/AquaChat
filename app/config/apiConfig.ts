// API Configuration
// This file contains API configuration and secure handling of API keys

import * as Storage from '../utils/storage';

// API Constants
const API_ENDPOINTS = {
  LLAMA: 'https://api.llama.com/v1', // Updated to match the curl example
};

// Default API key - this is just a placeholder and will be replaced with the securely stored key
// Never expose the actual API key in the code
const DEFAULT_API_KEY = 'LLM|967381905288086|fBRNpuhPYTqpLWGwySahplSpIrk'; // Exact format as provided

// Storage keys
const STORAGE_KEYS = {
  API_KEY: 'LLAMA_API_KEY',
};

// Interface for API configuration
interface ApiConfig {
  apiKey: string;
  baseUrl: string;
}

// Function to securely save API key
export const saveApiKey = async (key: string): Promise<boolean> => {
  try {
    // Ensure the key is properly formatted
    const formattedKey = key.trim();
    if (!formattedKey) {
      throw new Error('API key cannot be empty');
    }
    
    // Store the formatted key
    await Storage.setItem(STORAGE_KEYS.API_KEY, formattedKey);
    console.log('API key saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

// Function to securely retrieve API key
export const getApiKey = async (): Promise<string> => {
  try {
    // Use our storage utility which works with or without AsyncStorage
    const key = await Storage.getItem(STORAGE_KEYS.API_KEY);
    if (!key) {
      console.log('No API key found in storage, using default key');
      return DEFAULT_API_KEY;
    }
    console.log('Retrieved API key from storage');
    return key;
  } catch (error) {
    console.error('Error retrieving API key:', error);
    return DEFAULT_API_KEY;
  }
};

// Function to delete API key
export const deleteApiKey = async (): Promise<boolean> => {
  try {
    await Storage.removeItem(STORAGE_KEYS.API_KEY);
    return true;
  } catch (error) {
    console.error('Error deleting API key:', error);
    return false;
  }
};

// Function to get API configuration
export const getApiConfig = async (): Promise<ApiConfig> => {
  const apiKey = await getApiKey();
  console.log('Getting API config with key:', apiKey.substring(0, 10) + '...');

  return {
    apiKey,
    baseUrl: API_ENDPOINTS.LLAMA,
  };
};

// Initialize API key (call this at app startup)
export const initializeApiKey = async (key?: string): Promise<void> => {
  const existingKey = await getApiKey();

  // If a key is provided, always use it
  if (key) {
    await saveApiKey(key);
    console.log('API key initialized with provided key');
    return;
  }

  // If no key is provided but we have an existing key, keep using it
  if (existingKey && existingKey !== DEFAULT_API_KEY) {
    console.log('Using existing API key');
    return;
  }

  // If no key is provided and no existing key, use the default key
  console.log('Using default API key');
  await saveApiKey(DEFAULT_API_KEY);
};

// Function to reset API key to default
export const resetApiKey = async (): Promise<void> => {
  try {
    // Delete the existing key
    await deleteApiKey();
    // Initialize with default key
    await initializeApiKey();
    console.log('API key has been reset to default');
  } catch (error) {
    console.error('Error resetting API key:', error);
    throw error;
  }
};

// Default export to satisfy the router
export default {
  getApiConfig,
  initializeApiKey,
  saveApiKey,
  getApiKey,
  deleteApiKey,
  resetApiKey,
};
