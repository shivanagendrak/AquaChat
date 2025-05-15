// Llama API Service
// This file contains functions to interact with the Llama API

import { getApiConfig } from '../config/apiConfig';

// Types for API requests and responses
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Updated response type to match actual API response
export interface ChatCompletionResponse {
  completion_message: {
    role: 'assistant';
    stop_reason: string;
    content: {
      type: 'text';
      text: string;
    };
  };
  metrics: Array<{
    metric: string;
    value: number;
    unit: string;
  }>;
}

// Default model to use
const DEFAULT_MODEL = 'Llama-4-Maverick-17B-128E-Instruct-FP8';  // Updated to match the curl example

// Function to send a chat completion request to the Llama API
export const sendChatCompletion = async (
  messages: Message[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<ChatCompletionResponse> => {
  try {
    const config = await getApiConfig();

    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API key not found. Please set up your Llama API key.');
    }

    // Use the actual API call
    const requestBody: ChatCompletionRequest = {
      model: options.model || DEFAULT_MODEL,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 256,
      stream: false,
    };

    const apiUrl = `${config.baseUrl}/chat/completions`;
    console.log('Sending request to Llama API:', {
      url: apiUrl,
      model: requestBody.model,
      messageCount: messages.length,
      requestBody: JSON.stringify(requestBody, null, 2),
      authHeader: 'Bearer ' + config.apiKey.substring(0, 10) + '...', // Log partial key for debugging
    });

    // Ensure the API key is properly formatted
    const authHeader = config.apiKey.startsWith('Bearer ') 
      ? config.apiKey 
      : `Bearer ${config.apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    
    // Validate response structure
    if (!responseData || typeof responseData !== 'object') {
      throw new Error('Invalid response format from API');
    }

    if (!responseData.completion_message || !responseData.completion_message.content?.text) {
      throw new Error('Invalid message format in API response');
    }

    console.log('API response received successfully');
    return responseData;
  } catch (error) {
    console.error('Error in sendChatCompletion:', error);

    // Provide more informative error messages
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please check your API key and try again.');
      } else if (error.message.includes('404')) {
        throw new Error('API endpoint not found. Please check the API URL configuration.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('Invalid response format')) {
        throw new Error('The API returned an invalid response format. Please try again.');
      } else if (error.message.includes('Invalid message format')) {
        throw new Error('The API returned an invalid message format. Please try again.');
      }
    }

    throw error;
  }
};

// Function to get available models from the Llama API
export const getAvailableModels = async (): Promise<string[]> => {
  try {
    const config = await getApiConfig();

    if (!config.apiKey) {
      throw new Error('API key not found. Please set up your Llama API key.');
    }

    console.log('Fetching available models from Llama API');

    const response = await fetch(`${config.baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': config.apiKey,
        'Accept': 'application/json',
      },
    });

    console.log('Models API response status:', response.status);

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        // If parsing JSON fails, use the default error message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Available models retrieved successfully');

    // Return available models or fallback to default
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((model: any) => model.id);
    }

    // Fallback to default model if no models are found
    return [DEFAULT_MODEL];
  } catch (error) {
    console.error('Error in getAvailableModels:', error);

    // Provide more informative error messages
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Authentication failed. Please check your API key and try again.');
      } else if (error.message.includes('404')) {
        throw new Error('API endpoint not found. Please check the API URL configuration.');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.message.includes('Network request failed')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }

    throw error;
  }
};

// Helper function to create a user message
export const createUserMessage = (content: string): Message => ({
  role: 'user',
  content,
});

// Default system message for AquaChat
export const DEFAULT_SYSTEM_MESSAGE: Message = {
  role: 'system',
  content: 'You are AquaChat, an AI assistant specialized in aquaculture. Provide helpful, accurate, and concise information about fish farming, aquatic ecosystems, water quality management, and sustainable aquaculture practices. Be friendly and supportive to users who may be beginners or experts in the field.'
};
