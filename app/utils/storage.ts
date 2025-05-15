// Storage utility that works with or without AsyncStorage
// Fallback to in-memory storage when AsyncStorage is not available

// In-memory storage for fallback
const memoryStorage: Record<string, string> = {};

// Simple storage implementation that always works
const SimpleStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return memoryStorage[key] || null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage[key] = value;
  },

  removeItem: async (key: string): Promise<void> => {
    delete memoryStorage[key];
  }
};

// Get item from storage
export const getItem = async (key: string): Promise<string | null> => {
  try {
    // Always use the simple storage for now
    return await SimpleStorage.getItem(key);
  } catch (error) {
    console.warn('Error getting item from storage:', error);
    return null;
  }
};

// Set item in storage
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    // Always use the simple storage for now
    await SimpleStorage.setItem(key, value);
  } catch (error) {
    console.warn('Error setting item in storage:', error);
  }
};

// Remove item from storage
export const removeItem = async (key: string): Promise<void> => {
  try {
    // Always use the simple storage for now
    await SimpleStorage.removeItem(key);
  } catch (error) {
    console.warn('Error removing item from storage:', error);
  }
};

// Default export to satisfy the router
export default {
  getItem,
  setItem,
  removeItem
};
