import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator, ScrollView, Linking } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { launchCamera } from 'react-native-image-picker';
import { API_ENDPOINTS } from '../config/api';

const WasteDetection = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectionResults, setDetectionResults] = useState(null);
  const [showResults, setShowResults] = useState(false);


  const handleBack = () => {
    navigation.goBack();
  };

  const takePhoto = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setDetectionResults(null);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const detectWaste = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please take a photo first.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'waste_image.jpg',
      });

      console.log('Sending request to:', API_ENDPOINTS.WASTE_DETECTION);
      
      const response = await fetch(API_ENDPOINTS.WASTE_DETECTION, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        // Handle different response formats
        let results = [];
        if (data.success && (data.detections || data.results)) {
          results = data.detections || data.results || [];
        } else if (data.detections || data.results) {
          results = data.detections || data.results || [];
        } else if (Array.isArray(data)) {
          results = data;
        }
        
        // Use the results directly from the backend (they already have binDescription and tips)
        console.log('All detected items:', results);
        setDetectionResults(results);
        setShowResults(true);
      } else {
        throw new Error(data.error || 'Detection failed');
      }
    } catch (error) {
      console.error('Detection error:', error);
      Alert.alert('Detection Failed', 'Failed to detect waste. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getYoutubeSuggestions = () => {
    if (!detectionResults || detectionResults.length === 0) {
      Alert.alert('No Items', 'No items detected to get recycling suggestions.');
      return;
    }

    // Get all reusable items
    const reusableItems = detectionResults.filter(item => isReusable(item));
    
    if (reusableItems.length === 0) {
      Alert.alert('No Reusable Items', 'No reusable items found in the detected waste.');
      return;
    }

    // Navigate to RecycleMe page with detected items
    navigation.navigate('RecycleMe', { detectedItems: detectionResults });
  };



  const resetDetection = () => {
    setSelectedImage(null);
    setDetectionResults(null);
    setShowResults(false);
  };

  const isReusable = (detection) => {
    const reusableTypes = ['plastic', 'glass', 'paper', 'cardboard', 'metal', 'fabric'];
    const itemName = (detection.type || detection.name || '').toLowerCase();
    return reusableTypes.some(type => itemName.includes(type));
  };





  const hasReusableItems = () => {
    return detectionResults && detectionResults.some(item => isReusable(item));
  };

  const getReusableItemsCount = () => {
    return detectionResults ? detectionResults.filter(item => isReusable(item)).length : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Waste Detection</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.placeholderCorners}>
                <View style={styles.corner} />
                <View style={styles.corner} />
                <View style={styles.corner} />
                <View style={styles.corner} />
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.startCameraButton} onPress={takePhoto}>
            <Feather name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Start Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.detectButton, (!selectedImage || isLoading) && styles.disabledButton]} 
            onPress={detectWaste}
            disabled={!selectedImage || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="camera" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? 'Detecting...' : 'Detect Waste'}
            </Text>
          </TouchableOpacity>
        </View>

                 {/* Recycle Me Button - Single button for all reusable items */}
         {showResults && hasReusableItems() && (
           <View style={styles.recycleMeSection}>
             <View style={styles.recycleMeCard}>
               <View style={styles.recycleMeHeader}>
                 <Feather name="refresh-cw" size={24} color="#8b5cf6" />
                 <Text style={styles.recycleMeTitle}>Ready to Recycle?</Text>
               </View>
               <Text style={styles.recycleMeText}>
                 We found {getReusableItemsCount()} item(s) that can be upcycled!
               </Text>
               <TouchableOpacity 
                 style={styles.recycleMeButton}
                 onPress={getYoutubeSuggestions}
               >
                 <Feather name="play" size={20} color="#FFFFFF" />
                 <Feather name="refresh-cw" size={20} color="#10b981" />
                 <Text style={styles.recycleMeButtonText}>Recycle Me!</Text>
               </TouchableOpacity>
             </View>
           </View>
         )}

                 {/* Results Section */}
         {showResults && (
           <>

            {/* No Waste Detected Message */}
            {(!detectionResults || detectionResults.length === 0) && (
              <View style={styles.noWasteCard}>
                <View style={styles.noWasteIcon}>
                  <Feather name="search" size={48} color="#6b7280" />
                </View>
                <Text style={styles.noWasteTitle}>No Waste Detected</Text>
                <Text style={styles.noWasteText}>
                  We couldn't identify any waste items in this image. Please try taking a clearer photo or ensure the waste items are clearly visible.
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={resetDetection}>
                  <Feather name="refresh-cw" size={20} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Waste Detection Results */}
            {detectionResults && detectionResults.length > 0 && detectionResults.map((detection, index) => (
              <View key={index} style={styles.resultCard}>
                {/* Header */}
                <View style={styles.resultHeader}>
                  <View style={styles.resultTitleContainer}>
                    <Feather name="check-circle" size={24} color="#10b981" />
                    <Text style={styles.resultTitle}>{detection.type || detection.name}</Text>
                  </View>
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceText}>
                      {Math.round(detection.confidence || 0)}% confidence
                    </Text>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                  </View>
                </View>

                {/* Reusable Item Indicator */}
                {isReusable(detection) && (
                  <View style={styles.reusableIndicator}>
                    <Feather name="refresh-cw" size={16} color="#8b5cf6" />
                    <Text style={styles.reusableIndicatorText}>Reusable Item</Text>
                  </View>
                )}

                {/* Disposal Method Section */}
                <View style={styles.recyclingSection}>
                  <View style={styles.recyclingHeader}>
                    <Feather name="trash-2" size={20} color="#10b981" />
                    <Text style={styles.recyclingTitle}>Disposal Method</Text>
                  </View>
                  <Text style={styles.disposalText}>
                    {detection.binDescription || 'General waste bin or local recycling facility'}
                  </Text>
                </View>

                {/* Eco Tips Section */}
                <View style={styles.tipsSection}>
                  <View style={styles.tipsHeader}>
                    <Feather name="leaf" size={20} color="#10b981" />
                    <Text style={styles.tipsTitle}>Eco Tips</Text>
                  </View>
                                     {(detection.tips || ['Clean the item before recycling', 'Check local recycling guidelines', 'Separate different materials']).map((tip, tipIndex) => (
                    <View key={tipIndex} style={styles.tipItem}>
                      <Text style={styles.tipBullet}>•</Text>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        
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
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageSection: {
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  placeholderCorners: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#666666',
    borderWidth: 2,
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  startCameraButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  detectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b7280',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recycleMeSection: {
    marginBottom: 24,
  },
  recycleMeCard: {
    backgroundColor: '#8b5cf6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  recycleMeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recycleMeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  recycleMeText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  recycleMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  recycleMeButtonText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resultTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  rankBadge: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reusableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  reusableIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b5cf6',
    marginLeft: 4,
  },
  recyclingSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recyclingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recyclingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    marginLeft: 8,
  },
  disposalText: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    lineHeight: 20,
  },
  tipsSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    lineHeight: 20,
  },
  
  noWasteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noWasteIcon: {
    marginBottom: 16,
  },
  noWasteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  noWasteText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
});

export default WasteDetection; 