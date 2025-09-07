# Smart Waste Sort App

A comprehensive mobile application that helps users identify, sort, and report waste using AI-powered detection and location services.

## 🌟 Features

### Core Functionality
- **AI-Powered Waste Detection**: Uses machine learning to identify different types of waste from photos
- **Smart Waste Sorting**: Provides recommendations for proper waste disposal and recycling
- **Location-Based Reporting**: Automatically captures GPS coordinates and converts them to readable addresses
- **Municipal Dashboard**: Real-time dashboard for waste management authorities to view and manage reports
- **YouTube Integration**: Provides educational recycling videos and tutorials

### Technical Features
- **Dynamic Network Detection**: Automatically switches between local development and production servers
- **Cross-Platform Compatibility**: Works on both WiFi and mobile data networks
- **Real-Time Image Processing**: Upload and analyze waste images instantly
- **Persistent Data Storage**: All reports and images stored securely in MongoDB
- **Offline-Ready Architecture**: Graceful handling of network connectivity issues

## 🏗️ Architecture

### Frontend (React Native)
- **Framework**: React Native with Expo
- **State Management**: React Hooks and Context API
- **Navigation**: React Navigation
- **UI Components**: Custom components with Tailwind CSS styling
- **Camera Integration**: react-native-image-picker for photo capture
- **Location Services**: @react-native-community/geolocation for GPS
- **Network Detection**: react-native-network-info for dynamic server selection

### Backend (Flask)
- **Framework**: Python Flask
- **Database**: MongoDB Atlas for data persistence
- **Image Storage**: Binary data storage in MongoDB (no ephemeral file system)
- **API Design**: RESTful endpoints with CORS support
- **Deployment**: Railway cloud platform
- **AI Integration**: Machine learning models for waste classification

### Key Components
- **ReportGarbage**: Photo capture, location detection, and report submission
- **WasteDetection**: AI-powered waste identification and classification
- **MunicipalDashboard**: Administrative interface for waste management
- **RecycleMe**: Educational content and YouTube integration
- **Scanner**: Camera interface for waste scanning

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB Atlas account
- Railway account (for deployment)
- Android Studio (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-sort
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Frontend Setup**
   ```bash
   cd SmartWasteSortApp
   npm install
   npx expo start
   ```

### Environment Configuration

1. **MongoDB Atlas**: Set up your database and get connection string
2. **Railway Deployment**: Deploy backend to Railway for production
3. **API Configuration**: Update `src/config/api.js` with your endpoints

## 📱 Usage

### For Citizens
1. **Report Waste**: Take a photo of waste, add location, and submit report
2. **Get AI Analysis**: Receive instant waste classification and disposal recommendations
3. **Learn Recycling**: Access educational videos and tutorials
4. **Track Reports**: View your submitted reports and their status

### For Municipal Authorities
1. **Dashboard Access**: View all submitted waste reports in real-time
2. **Image Management**: View photos associated with each report
3. **Location Tracking**: See exact locations of reported waste
4. **Report Management**: Update report status and assign cleanup tasks

## 🔧 Technical Implementation

### Dynamic Network Detection
The app automatically detects the best available server:
- **Production Mode**: Uses Railway deployment (works from anywhere)
- **Development Mode**: Uses local development server (same network)
- **Automatic Fallback**: Switches between servers based on connectivity

### Image Processing Pipeline
1. **Capture**: User takes photo using device camera
2. **Upload**: Image sent to backend as binary data
3. **Storage**: Stored in MongoDB as binary data (no file system dependency)
4. **Retrieval**: Served directly from database to frontend
5. **Display**: Rendered in municipal dashboard with loading states

### Location Services
1. **Permission Request**: Native Android permission dialog
2. **GPS Capture**: Get current coordinates
3. **Reverse Geocoding**: Convert coordinates to readable address using Nominatim API
4. **Fallback Handling**: Graceful degradation if location unavailable


## 🔒 Security & Privacy

- **Data Encryption**: All data transmitted over HTTPS
- **Image Privacy**: Images stored securely in MongoDB
- **Location Privacy**: GPS coordinates only used for waste reporting
- **No Personal Data**: App doesn't collect personal information

## 📊 Performance

- **Image Upload**: Optimized for mobile networks
- **Server Response**: 2-second timeout for quick feedback
- **Caching**: Network detection results cached for performance
- **Loading States**: Visual feedback during all operations

**Smart Waste Sort App** - Making waste management smarter, one report at a time.
