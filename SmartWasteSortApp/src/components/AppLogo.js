import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const AppLogo = ({ size = 'medium', showText = true, style }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { container: 40, icon: 16, text: 12 };
      case 'medium':
        return { container: 60, icon: 24, text: 16 };
      case 'large':
        return { container: 80, icon: 32, text: 20 };
      case 'xlarge':
        return { container: 120, icon: 48, text: 24 };
      default:
        return { container: 60, icon: 24, text: 16 };
    }
  };

  const sizes = getSize();
  const iconSize = sizes.icon;

  return (
    <View style={[styles.container, { width: sizes.container, height: sizes.container }, style]}>
      {/* Main logo container */}
      <View style={styles.logoContainer}>
        {/* Hands holding smartphone */}
        <View style={styles.handsContainer}>
          <View style={styles.handLeft}>
            <Feather name="hand" size={iconSize * 0.4} color="#4CAF50" />
          </View>
          <View style={styles.smartphone}>
            <Feather name="smartphone" size={iconSize * 0.6} color="#2196F3" />
          </View>
          <View style={styles.handRight}>
            <Feather name="hand" size={iconSize * 0.4} color="#4CAF50" />
          </View>
        </View>

        {/* Recycling symbol */}
        <View style={styles.recyclingSymbol}>
          <Feather name="refresh-cw" size={iconSize * 0.8} color="#FF9800" />
        </View>

        {/* Circuit lines */}
        <View style={styles.circuitLines}>
          <View style={styles.circuitLine1} />
          <View style={styles.circuitLine2} />
          <View style={styles.circuitLine3} />
        </View>
      </View>

      {/* App name */}
      {showText && (
        <Text style={[styles.appName, { fontSize: sizes.text }]}>
          SmartWaste
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  handsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  handLeft: {
    position: 'absolute',
    left: -8,
    transform: [{ rotate: '-15deg' }],
  },
  smartphone: {
    zIndex: 1,
  },
  handRight: {
    position: 'absolute',
    right: -8,
    transform: [{ rotate: '15deg' }],
  },
  recyclingSymbol: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 2,
  },
  circuitLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circuitLine1: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 2,
    backgroundColor: '#00BCD4',
    borderRadius: 1,
  },
  circuitLine2: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 2,
    height: 8,
    backgroundColor: '#00BCD4',
    borderRadius: 1,
  },
  circuitLine3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 6,
    height: 1,
    backgroundColor: '#00BCD4',
    borderRadius: 0.5,
    transform: [{ translateX: -3 }, { translateY: -0.5 }],
  },
  appName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AppLogo; 