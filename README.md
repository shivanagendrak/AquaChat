# AquaChat

![AquaChat Logo](./assets/images/splash-icon-light.png)

AquaChat is an LLM-powered chat application designed specifically for the aquaculture industry. Inspired by the mission of [Kurma AI](https://kurma.ai/) to drive sustainable innovation with advanced AI, AquaChat leverages Large Language Models to provide real-time, intelligent support and recommendations for fish farming and marine ecosystem management.

This project is part of a broader initiative to accelerate responsible growth and operational efficiency in aquaculture, supporting the UN’s sustainability goals through cutting-edge AI solutions.

AquaChat is a cross-platform chat application built with [Expo](https://expo.dev) and React Native. It supports multiple languages and offers a modern, responsive UI for seamless communication.

## Features

- Real-time chat interface
- Multi-language support (English, Spanish, French, etc.)
- Theming and custom splash screen
- File-based routing for easy navigation
- Works on Android, iOS, and web

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the app

```bash
npx expo start
```

You can then open the app in:

- [Expo Go](https://expo.dev/go) on your device
- Android emulator
- iOS simulator
- Web browser

Edit files inside the **app/** directory to start developing. Routing is handled automatically based on the file structure.

## Project Structure

```
app/            # App screens and routes
components/     # Reusable UI components
assets/         # Images and fonts
locales/        # Translation files (JSON)
hooks/          # Custom React hooks
```

## Localization

AquaChat supports multiple languages. Add or edit translations in the `locales/` directory. Language selection is available in the app settings.

## Resetting the Project

To reset the app to a blank state:

```bash
npm run reset-project
```

This moves starter code to **app-example/** and creates a blank **app/** directory.

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [React Native documentation](https://reactnative.dev/)

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## Community

- [Expo on GitHub](https://github.com/expo/expo)
- [Expo Discord](https://chat.expo.dev)
