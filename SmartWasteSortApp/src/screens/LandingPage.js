
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppLogo from '../components/AppLogo';

const LandingPage = ({ navigation }) => {
  const handleGetStarted = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('DashboardSelection');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <AppLogo size="xlarge" showText={true} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Every piece of waste is a resource in disguise
        </Text>

        {/* Get Started Button */}
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'System',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default LandingPage; 