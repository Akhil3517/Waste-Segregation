import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';

// Import screens
import LandingPage from './src/screens/LandingPage';
import DashboardSelection from './src/screens/DashboardSelection';
import Features from './src/screens/Features';
import WasteDetection from './src/screens/WasteDetection';
import ReportGarbage from './src/screens/ReportGarbage';
import MunicipalDashboard from './src/screens/MunicipalDashboard';
import RecycleMe from './src/screens/RecycleMe';

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#000000' },
        }}
      >
                            <Stack.Screen name="Landing" component={LandingPage} />
                    <Stack.Screen name="DashboardSelection" component={DashboardSelection} />
                    <Stack.Screen name="Features" component={Features} />
                    <Stack.Screen name="WasteDetection" component={WasteDetection} />
                    <Stack.Screen name="ReportGarbage" component={ReportGarbage} />
                    <Stack.Screen name="MunicipalDashboard" component={MunicipalDashboard} />
                    <Stack.Screen name="RecycleMe" component={RecycleMe} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App; 