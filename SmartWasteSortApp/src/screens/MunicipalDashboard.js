import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { getAPIEndpoints } from '../config/api';

const { width, height } = Dimensions.get('window');

const MunicipalDashboard = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState({});
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [apiEndpoints, setApiEndpoints] = useState(null);

  useEffect(() => {
    loadReports();
    // Test backend connectivity
    testBackendConnection();
  }, []);

  const testBackendConnection = async () => {
    try {
      const apiEndpoints = await getAPIEndpoints();
      const response = await fetch(apiEndpoints.HEALTH);
      const data = await response.json();
      console.log('Backend health check:', data);
    } catch (error) {
      console.log('Backend connection failed:', error);
      Alert.alert('Connection Error', 'Cannot connect to backend server. Please check if the server is running.');
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      // Get dynamic API endpoints
      const endpoints = await getAPIEndpoints();
      setApiEndpoints(endpoints);
      
      console.log('🔍 Loading reports from:', endpoints.DASHBOARD);
      
      // Make API call to your Flask backend
      const response = await fetch(endpoints.DASHBOARD, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      const data = await response.json();
      console.log('📊 Dashboard API response:', data);

      if (response.ok) {
        // Check if we have reports data
        if (data.recent_reports) {
          console.log('✅ Reports loaded successfully:', data.recent_reports.length, 'reports');
          setReports(data.recent_reports);
        } else if (data.success === false) {
          // Handle explicit error response
          console.error('❌ API Error:', data);
          throw new Error(data.error || data.message || 'Failed to load reports');
        } else {
          // Handle empty response
          console.log('📭 No reports found');
          setReports([]);
        }
      } else {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('💥 Error loading reports:', error);
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert(
        'Connection Error', 
        `Failed to load reports: ${error.message}\n\nPlease check your internet connection and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    }
  };

  const handleApprove = async (reportId) => {
    try {
      const apiEndpoints = await getAPIEndpoints();
      const response = await fetch(apiEndpoints.UPDATE_STATUS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId,
          status: 'approved'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReports(prev => prev.map(report => 
          (report._id === reportId || report.id === reportId) ? { ...report, status: 'approved' } : report
        ));
        Alert.alert('Approved', data.message);
        setShowDetailsModal(false);
      } else {
        throw new Error(data.error || 'Failed to approve report');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      Alert.alert('Error', 'Failed to approve report. Please try again.');
    }
  };

  const handleReject = async (reportId) => {
    try {
      const apiEndpoints = await getAPIEndpoints();
      const response = await fetch(apiEndpoints.UPDATE_STATUS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: reportId,
          status: 'rejected'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReports(prev => prev.map(report => 
          (report._id === reportId || report.id === reportId) ? { ...report, status: 'rejected' } : report
        ));
        Alert.alert('Rejected', data.message);
        setShowDetailsModal(false);
      } else {
        throw new Error(data.error || 'Failed to reject report');
      }
    } catch (error) {
      console.error('Error rejecting report:', error);
      Alert.alert('Error', 'Failed to reject report. Please try again.');
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedReport(null);
  };

  const handleViewImage = async (report) => {
    try {
      setIsImageLoading(true);
      // Get dynamic API endpoints
      const apiEndpoints = await getAPIEndpoints();
      const imageUrl = apiEndpoints.GET_IMAGE(report._id || report.id);
      
      console.log('Image URL:', imageUrl);
      console.log('Report object:', report);
      
      // Test the image URL first
      const response = await fetch(imageUrl);
      console.log('Image response status:', response.status);
      console.log('Image response headers:', response.headers);
      
      if (!response.ok) {
        console.log('Image not found or error:', response.statusText);
        // Show a more user-friendly message
        Alert.alert(
          'Image Not Available', 
          'The image for this report is not available. This may be due to server deployment changes.',
          [
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      } else {
        console.log('Image URL is accessible - loading from MongoDB');
        // Image is available, show it
        setSelectedImage({
          url: imageUrl,
          type: report.type || 'Garbage Report'
        });
        setShowImageModal(true);
      }
    } catch (error) {
      console.log('Image fetch error:', error);
      Alert.alert(
        'Image Error', 
        'Cannot load the image for this report. The image may not be available.',
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
    } finally {
      setIsImageLoading(false);
    }
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
    setIsImageLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const FilterButton = ({ title, value, isActive }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Municipal Dashboard</Text>
        <TouchableOpacity onPress={loadReports} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reports.filter(r => r.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reports.filter(r => r.status === 'approved').length}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{reports.filter(r => r.status === 'rejected').length}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <FilterButton title="All" value="all" isActive={filter === 'all'} />
          <FilterButton title="Pending" value="pending" isActive={filter === 'pending'} />
          <FilterButton title="Approved" value="approved" isActive={filter === 'approved'} />
          <FilterButton title="Rejected" value="rejected" isActive={filter === 'rejected'} />
        </View>

        {/* Reports */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading reports...</Text>
          </View>
        ) : filteredReports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No reports found' : `No ${filter} reports`}
            </Text>
          </View>
        ) : (
          <View style={styles.reportsContainer}>
            {filteredReports.map((report) => (
              <View key={report.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <Text style={styles.reportType}>{report.type || 'Garbage Report'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                    <Text style={styles.statusText}>{report.status.toUpperCase()}</Text>
                  </View>
                </View>
                
                <View style={styles.reportContent}>
                  {/* Image Thumbnail */}
                  <View style={styles.imageThumbnailContainer}>
                    <View style={styles.imageThumbnailWrapper}>
                                             <Image
                         source={{
                           uri: `${apiEndpoints?.BASE_URL || 'https://waste-segregation-production.up.railway.app'}/api/requests/${report._id || report.id}/image`
                         }}
                         style={styles.imageThumbnail}
                         resizeMode="cover"
                         onLoadStart={() => setImageLoading(prev => ({ ...prev, [report._id || report.id]: true }))}
                         onLoadEnd={() => setImageLoading(prev => ({ ...prev, [report._id || report.id]: false }))}
                         onError={(error) => {
                           console.log('Thumbnail loading error:', error);
                           setImageLoading(prev => ({ ...prev, [report._id || report.id]: false }));
                         }}
                       />
                      {imageLoading[report._id || report.id] && (
                        <View style={styles.imageLoadingOverlay}>
                          <ActivityIndicator size="small" color="#3b82f6" />
                        </View>
                      )}
                    </View>
                    <TouchableOpacity 
                      style={styles.viewPhotoButton}
                      onPress={() => handleViewImage(report)}
                    >
                      <Feather name="eye" size={12} color="#FFFFFF" />
                      <Text style={styles.viewPhotoText}>View</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.locationContainer}>
                    <Feather name="map-pin" size={14} color="#6b7280" />
                    <Text style={styles.locationText}>{report.location}</Text>
                  </View>
                  
                  {report.description && (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {report.description}
                    </Text>
                  )}
                  
                  <Text style={styles.dateText}>
                    {report.createdAt ? formatDate(report.createdAt) : 'Unknown date'}
                  </Text>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.viewDetailsButton}
                      onPress={() => handleViewDetails(report)}
                    >
                      <Feather name="eye" size={16} color="#3b82f6" />
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                    
                    {report.status === 'pending' && (
                      <>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.approveButton]} 
                          onPress={() => handleApprove(report._id || report.id)}
                        >
                          <Feather name="check" size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.rejectButton]} 
                          onPress={() => handleReject(report._id || report.id)}
                        >
                          <Feather name="x" size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detailed Report Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeDetailsModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDetailsModal} style={styles.closeButton}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📋 Detailed Report</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedReport && (
              <>
                {/* Status Badge */}
                <View style={styles.modalStatusContainer}>
                  <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedReport.status) }]}>
                    <Text style={styles.modalStatusText}>{selectedReport.status.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Report Image */}
                <View style={styles.modalImageContainer}>
                  <Text style={styles.modalSectionTitle}>Report Photo</Text>
                  <TouchableOpacity 
                    style={styles.modalImage}
                    onPress={() => handleViewImage(selectedReport)}
                  >
                                         <Image
                       source={{
                         uri: `${apiEndpoints?.BASE_URL || 'https://waste-segregation-production.up.railway.app'}/api/requests/${selectedReport._id || selectedReport.id}/image`
                       }}
                       style={styles.modalImageContent}
                       resizeMode="cover"
                       onError={(error) => {
                         console.log('Image loading error:', error);
                       }}
                     />
                    <View style={styles.modalImageOverlay}>
                      <Feather name="zoom-in" size={24} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.modalImageHint}>Tap to view full size</Text>
                </View>

                {/* Report Details */}
                <View style={styles.modalDetailsContainer}>
                  {/* Location */}
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Location</Text>
                    <View style={styles.modalDetailContent}>
                      <Feather name="map-pin" size={16} color="#3b82f6" />
                      <Text style={styles.modalDetailText}>{selectedReport.location}</Text>
                    </View>
                  </View>

                  {/* Reporter */}
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Reported By</Text>
                    <View style={styles.modalDetailContent}>
                      <Feather name="user" size={16} color="#10b981" />
                      <Text style={styles.modalDetailText}>
                        {selectedReport.submittedBy || 'Mobile App User'}
                      </Text>
                    </View>
                  </View>

                  {/* Date & Time */}
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Reported On</Text>
                    <View style={styles.modalDetailContent}>
                      <Feather name="calendar" size={16} color="#8b5cf6" />
                      <Text style={styles.modalDetailText}>
                        {selectedReport.createdAt ? formatDateTime(selectedReport.createdAt) : 'Unknown date'}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Description</Text>
                    <View style={styles.modalDescriptionBox}>
                      <Text style={styles.modalDescriptionText}>
                        {selectedReport.description || 'No description provided'}
                      </Text>
                    </View>
                  </View>

                  {/* Report ID */}
                  <View style={styles.modalDetailItem}>
                    <Text style={styles.modalDetailLabel}>Report ID</Text>
                    <Text style={styles.modalReportId}>
                      {selectedReport._id || selectedReport.id}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.modalViewPhotoButton}
              onPress={() => handleViewImage(selectedReport)}
            >
              <Feather name="eye" size={16} color="#FFFFFF" />
              <Text style={styles.modalViewPhotoText}>View Full Photo</Text>
            </TouchableOpacity>

            {selectedReport?.status === 'pending' && (
              <View style={styles.modalActionButtons}>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalApproveButton]}
                  onPress={() => handleApprove(selectedReport._id || selectedReport.id)}
                >
                  <Feather name="check" size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalActionButton, styles.modalRejectButton]}
                  onPress={() => handleReject(selectedReport._id || selectedReport.id)}
                >
                  <Feather name="x" size={16} color="#FFFFFF" />
                  <Text style={styles.modalActionButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={closeDetailsModal}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeImageModal}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalCloseButton}
            onPress={closeImageModal}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
                     {isImageLoading ? (
                       <View style={styles.imageLoadingContainer}>
                         <ActivityIndicator size="large" color="#3b82f6" />
                         <Text style={styles.imageLoadingText}>Loading image...</Text>
                       </View>
                     ) : selectedImage && (
                       <View style={styles.fullScreenImageContainer}>
                         <Image
                           source={{ uri: selectedImage.url }}
                           style={styles.fullScreenImage}
                           resizeMode="contain"
                           onLoadStart={() => console.log('Image loading started')}
                           onLoadEnd={() => console.log('Image loading ended')}
                           onError={(error) => {
                             console.log('Full screen image loading error:', error);
                             Alert.alert(
                               'Image Error', 
                               'Failed to load image. The image may not be available or there might be a network issue.',
                               [
                                 { 
                                   text: 'OK', 
                                   onPress: () => closeImageModal() 
                                 }
                               ]
                             );
                           }}
                         />
                         <Text style={styles.imageUrlText}>{selectedImage.type || 'Garbage Report'}</Text>
                       </View>
                     )}
        </View>
      </Modal>
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
    flex: 1,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#CCCCCC',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  reportsContainer: {
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportContent: {
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
  },
  descriptionText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imageThumbnailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  imageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  imageThumbnailWrapper: {
    position: 'relative',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  viewPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  viewPhotoText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalStatusContainer: {
    marginBottom: 20,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalImageContainer: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  modalImage: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalImageContent: {
    width: '100%',
    height: 200,
  },
  modalImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modalDetailsContainer: {
    gap: 16,
  },
  modalDetailItem: {
    gap: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CCCCCC',
  },
  modalDetailContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  modalDescriptionBox: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  modalReportId: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 12,
  },
  modalViewPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  modalViewPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  modalApproveButton: {
    backgroundColor: '#10b981',
  },
  modalRejectButton: {
    backgroundColor: '#ef4444',
  },
  modalActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    backgroundColor: '#4b5563',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUrlText: {
    color: '#FFFFFF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  imageLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
});

export default MunicipalDashboard; 