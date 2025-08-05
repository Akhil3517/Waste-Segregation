import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const Features = ({ navigation }) => {
  const handleBack = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleWasteDetection = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('WasteDetection');
    }
  };

  const handleReportGarbage = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('ReportGarbage');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Features</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Waste Detection Feature */}
        <TouchableOpacity style={styles.featureCard} onPress={handleWasteDetection}>
          <View style={styles.iconContainer}>
            <Feather name="search" size={32} color="#10b981" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Waste Detection</Text>
            <Text style={styles.featureDescription}>
              Upload a photo to detect waste type and get recycling tips
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        {/* Report Garbage Feature */}
        <TouchableOpacity style={styles.featureCard} onPress={handleReportGarbage}>
          <View style={styles.iconContainer}>
            <Feather name="map-pin" size={32} color="#f59e0b" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Report Garbage</Text>
            <Text style={styles.featureDescription}>
              Report garbage locations with photos and location data
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color="#6b7280" />
        </TouchableOpacity>

        {/* Coming Soon Feature */}
        {/* <View style={styles.featureCardDisabled}>
          <View style={styles.iconContainerDisabled}>
            <Feather name="bar-chart-2" size={32} color="#6b7280" />
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitleDisabled}>Waste Analytics</Text>
            <Text style={styles.featureDescriptionDisabled}>
              View statistics and insights about waste in your area
            </Text>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </View> */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  featureCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureCardDisabled: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerDisabled: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureTitleDisabled: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  featureDescriptionDisabled: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  comingSoonBadge: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default Features; 