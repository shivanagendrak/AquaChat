import { SharedValue } from 'react-native-reanimated';

// Default export to satisfy the router
export default {};

// DimOverlay component declaration
declare module './DimOverlay' {
  interface DimOverlayProps {
    isVisible: boolean;
    opacity: SharedValue<number>;
    onPress: () => void;
  }

  const DimOverlay: React.FC<DimOverlayProps>;
  export default DimOverlay;
}

// EdgeDragDetector component declaration
declare module './EdgeDragDetector' {
  interface EdgeDragDetectorProps {
    onDragStart: () => void;
    onDragUpdate: (translationX: number) => void;
    onDragEnd: (translationX: number, velocityX: number) => void;
    isMenuOpen: boolean;
  }

  const EdgeDragDetector: React.FC<EdgeDragDetectorProps>;
  export default EdgeDragDetector;
}

// SettingsView component declaration
declare module './SettingsView' {
  interface SettingsViewProps {
    isVisible: boolean;
    onClose: () => void;
  }

  const SettingsView: React.FC<SettingsViewProps>;
  export default SettingsView;
}

// SideMenu component declaration
declare module './SideMenu' {
  interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
  }

  const SideMenu: React.FC<SideMenuProps>;
  export default SideMenu;
}
