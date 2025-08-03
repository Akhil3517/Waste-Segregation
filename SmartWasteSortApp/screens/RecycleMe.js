import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator, ScrollView, Linking } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { API_ENDPOINTS } from '../config/api';

const RecycleMe = ({ navigation, route }) => {
  const { detectedItems } = route.params || {};
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (detectedItems && detectedItems.length > 0) {
      // Get the first reusable item
      const reusableItems = detectedItems.filter(item => isReusable(item));
      if (reusableItems.length > 0) {
        setSelectedItem(reusableItems[0]);
        getYoutubeSuggestions(reusableItems[0]);
      }
    }
  }, [detectedItems]);

  const handleBack = () => {
    navigation.goBack();
  };

  const isReusable = (detection) => {
    const reusableTypes = ['plastic', 'glass', 'paper', 'cardboard', 'metal', 'fabric'];
    const itemName = (detection.type || detection.name || '').toLowerCase();
    return reusableTypes.some(type => itemName.includes(type));
  };

  const getYoutubeSuggestions = async (item) => {
    if (!item) {
      Alert.alert('No Item', 'No item selected for recycling suggestions.');
      return;
    }

    setIsLoadingVideos(true);
    try {
      const itemName = item.type || item.name;
      
      const response = await fetch(API_ENDPOINTS.YOUTUBE_SUGGESTIONS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: [itemName] }),
      });

      const data = await response.json();
      if (response.ok) {
        // Convert the suggestions object to a flat array of videos
        const allVideos = [];
        if (data.suggestions) {
          Object.values(data.suggestions).forEach(itemVideos => {
            if (Array.isArray(itemVideos)) {
              allVideos.push(...itemVideos);
            }
          });
        }
        
        // If no videos from API, use fallback
        if (allVideos.length === 0) {
          const fallbackVideos = getFallbackVideos([itemName]);
          setYoutubeVideos(fallbackVideos);
        } else {
          setYoutubeVideos(allVideos);
        }
      } else {
        // Use fallback if API fails
        const fallbackVideos = getFallbackVideos([itemName]);
        setYoutubeVideos(fallbackVideos);
      }
    } catch (error) {
      console.error('YouTube suggestions error:', error);
      // Use fallback on error
      const itemName = item.type || item.name;
      const fallbackVideos = getFallbackVideos([itemName]);
      setYoutubeVideos(fallbackVideos);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const getFallbackVideos = (itemNames) => {
    const fallbackVideos = [];
    itemNames.forEach(itemName => {
      fallbackVideos.push({
        title: `38 Creative Ideas With ${itemName} | Thaitrick`,
        creator: "Thaitrick",
        duration: "12:03",
        views: "79M",
        difficulty: "Medium",
        videoId: null,
        url: `https://www.youtube.com/results?search_query=DIY+upcycling+${itemName.replace(' ', '+')}`,
        thumbnail: null
      });
      fallbackVideos.push({
        title: `6 ${itemName} Recycling Ideas You Wish You Had Known Sooner. EASY HOME HACKS 2024`,
        creator: "Tips Secret",
        duration: "8:05",
        views: "4M",
        difficulty: "Medium",
        videoId: null,
        url: `https://www.youtube.com/results?search_query=recycle+${itemName.replace(' ', '+')}+craft`,
        thumbnail: null
      });
      fallbackVideos.push({
        title: `21 Surprising Ways To Upcycle Old ${itemName} Products`,
        creator: "Creative Crafts",
        duration: "15:30",
        views: "2.1M",
        difficulty: "Easy",
        videoId: null,
        url: `https://www.youtube.com/results?search_query=upcycle+${itemName.replace(' ', '+')}`,
        thumbnail: null
      });
    });
    return fallbackVideos;
  };

  const openYoutubeVideo = (video) => {
    let url;
    if (video.videoId) {
      // Direct video link
      url = `https://www.youtube.com/watch?v=${video.videoId}`;
    } else if (video.url) {
      // Fallback search URL
      url = video.url;
    } else {
      Alert.alert('Error', 'Invalid video data.');
      return;
    }
    
    Linking.openURL(url).catch(err => {
      console.error('Error opening YouTube:', err);
      Alert.alert('Error', 'Failed to open YouTube video.');
    });
  };

  const getReusableItems = () => {
    return detectedItems ? detectedItems.filter(item => isReusable(item)) : [];
  };

  const selectItem = (item) => {
    setSelectedItem(item);
    getYoutubeSuggestions(item);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Feather name="refresh-cw" size={24} color="#10b981" />
            <Text style={styles.headerTitle}>Recycle Your Items</Text>
          </View>
          <Text style={styles.headerSubtitle}>Choose DIY tutorials to upcycle your detected items:</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Item Selection */}
        {getReusableItems().length > 1 && (
          <View style={styles.itemSelection}>
            <Text style={styles.sectionTitle}>Select Item to Recycle:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemScroll}>
              {getReusableItems().map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.itemChip,
                    selectedItem && selectedItem.type === item.type && styles.selectedItemChip
                  ]}
                  onPress={() => selectItem(item)}
                >
                  <Text style={[
                    styles.itemChipText,
                    selectedItem && selectedItem.type === item.type && styles.selectedItemChipText
                  ]}>
                    {item.type || item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Selected Item Display */}
        {selectedItem && (
          <View style={styles.selectedItemSection}>
            <View style={styles.selectedItemHeader}>
              <Feather name="refresh-cw" size={20} color="#10b981" />
              <Text style={styles.selectedItemTitle}>{selectedItem.type || selectedItem.name}</Text>
            </View>
          </View>
        )}

        {/* Loading State */}
        {isLoadingVideos && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading DIY tutorials...</Text>
          </View>
        )}

        {/* YouTube Videos */}
        {!isLoadingVideos && youtubeVideos.length > 0 && (
          <View style={styles.videosContainer}>
            {youtubeVideos.map((video, index) => (
              <View key={index} style={styles.videoCard}>
                {/* Thumbnail */}
                <View style={styles.videoThumbnail}>
                  {video.thumbnail ? (
                    <Image source={{ uri: video.thumbnail }} style={styles.thumbnailImage} />
                  ) : (
                    <View style={styles.placeholderThumbnail}>
                      <Feather name="play" size={32} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                {/* Video Info */}
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>
                    {video.title}
                  </Text>
                  
                  <View style={styles.videoCreator}>
                    <Feather name="monitor" size={14} color="#666666" />
                    <Text style={styles.creatorText}>{video.creator || 'Unknown Creator'}</Text>
                  </View>

                  <View style={styles.videoDetails}>
                    <View style={styles.detailItem}>
                      <Feather name="clock" size={14} color="#666666" />
                      <Text style={styles.detailText}>{video.duration || 'Unknown'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Feather name="eye" size={14} color="#666666" />
                      <Text style={styles.detailText}>{video.views || 'Unknown'}</Text>
                    </View>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>{video.difficulty || 'Medium'}</Text>
                    </View>
                  </View>

                  {/* Watch Button */}
                  <TouchableOpacity
                    style={styles.watchButton}
                    onPress={() => openYoutubeVideo(video)}
                  >
                    <Feather name="play" size={16} color="#FFFFFF" />
                    <Text style={styles.watchButtonText}>Watch on YouTube</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* No Videos State */}
        {!isLoadingVideos && youtubeVideos.length === 0 && (
          <View style={styles.noVideosContainer}>
            <Feather name="youtube" size={48} color="#666666" />
            <Text style={styles.noVideosTitle}>No Tutorials Found</Text>
            <Text style={styles.noVideosText}>
              We couldn't find any DIY tutorials for this item. Try searching on YouTube manually.
            </Text>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemSelection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  itemScroll: {
    flexDirection: 'row',
  },
  itemChip: {
    backgroundColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItemChip: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  itemChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedItemChipText: {
    color: '#FFFFFF',
  },
  selectedItemSection: {
    marginBottom: 24,
  },
  selectedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 16,
  },
  selectedItemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  videosContainer: {
    gap: 16,
  },
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#666666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInfo: {
    gap: 8,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 24,
  },
  videoCreator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  videoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  difficultyBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  watchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noVideosContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noVideosTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  noVideosText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RecycleMe; 