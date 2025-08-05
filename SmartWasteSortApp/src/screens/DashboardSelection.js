import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import AppLogo from '../components/AppLogo';

const DashboardSelection = ({ navigation }) => {
  const handleBack = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleCitizenDashboard = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Features');
    }
  };

  const handleMunicipalDashboard = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('MunicipalDashboard');
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
        <View style={styles.headerLogo}>
          <AppLogo size="small" showText={false} />
        </View>
        <Text style={styles.headerTitle}>Choose Dashboard</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Smart Waste Segregation</Text>
          <Text style={styles.welcomeSubtitle}>Please select your role to continue</Text>
        </View>

        {/* Citizen Dashboard Card */}
        <TouchableOpacity style={styles.card} onPress={handleCitizenDashboard}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={styles.iconContainer}>
                <Feather name="users" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Citizen Dashboard</Text>
                <Text style={styles.cardDescription}>
                  Report garbage, detect waste types, and contribute to a cleaner community
                </Text>
                <View style={styles.features}>
                  <View style={styles.feature}>
                    <Feather name="map-pin" size={16} color="#FFFFFF" />
                    <Text style={styles.featureText}>Report Issues</Text>
                  </View>
                  <View style={styles.feature}>
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.featureText}>Waste Detection</Text>
                  </View>
                </View>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Municipal Authorities Card */}
        <TouchableOpacity style={styles.card} onPress={handleMunicipalDashboard}>
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#22c55e' }]}>
                <Feather name="shield" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Municipal Authorities</Text>
                <Text style={styles.cardDescription}>
                  Review citizen reports, manage requests, and coordinate cleanup efforts
                </Text>
                <View style={styles.features}>
                  <View style={styles.feature}>
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.featureText}>Review Reports</Text>
                  </View>
                  <View style={styles.feature}>
                    <Feather name="map-pin" size={16} color="#FFFFFF" />
                    <Text style={styles.featureText}>Manage Requests</Text>
                  </View>
                </View>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* How it works Section */}
        <View style={styles.howItWorks}>
          <Text style={styles.howItWorksTitle}>How it works:</Text>
          <View style={styles.steps}>
            <Text style={styles.step}>• Citizens: Report garbage locations and detect waste types</Text>
            <Text style={styles.step}>• Municipal Authorities: Review reports and coordinate cleanup</Text>
            <Text style={styles.step}>• Community: Work together for a cleaner environment</Text>
          </View>
        </View>
      </ScrollView>
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
  headerLogo: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 12,
    lineHeight: 20,
  },
  features: {
    flexDirection: 'row',
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  howItWorks: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  steps: {
    gap: 8,
  },
  step: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
});

export default DashboardSelection; 