import React from 'react';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import Index from './index';

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <Index />
      </ChatProvider>
    </ThemeProvider>
  );
}

const AppComponent = App;
export default AppComponent;