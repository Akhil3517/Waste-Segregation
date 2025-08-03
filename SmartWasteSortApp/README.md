# Smart Waste Segregation - React Native App

A mobile application for waste detection and garbage reporting, built with React Native.

## 🚀 Features

### 📱 **Complete Mobile App**
- **Landing Page** - Beautiful "WASTE SORT" design with glitch effect
- **Dashboard Selection** - Choose between Citizen and Municipal dashboards
- **Waste Detection** - AI-powered waste type detection with camera/gallery upload
- **Report Garbage** - Submit garbage reports with photos and location
- **Municipal Dashboard** - Authorities can review and manage reports

### 🔧 **Technical Features**
- **React Native** - Cross-platform mobile development
- **Navigation** - Stack-based navigation with smooth transitions
- **Camera Integration** - Photo capture and gallery selection
- **API Integration** - Connected to Flask backend
- **Dark Theme** - Consistent dark UI throughout the app
- **Error Handling** - Comprehensive error handling and user feedback

## 📋 Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Python 3.8+ (for backend)
- MongoDB (optional, falls back to file storage)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd SmartWasteSortApp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Expo CLI (if not already installed)
```bash
npm install -g @expo/cli
```

### 4. Install Expo Image Picker
```bash
npx expo install expo-image-picker
```

## 🔧 Configuration

### API Configuration
Edit `src/config/api.js` to set the correct backend URL:

```javascript
// For Android Emulator
BASE_URL: 'http://10.0.2.2:5000'

// For iOS Simulator
BASE_URL: 'http://localhost:5000'

// For Physical Device (replace with your computer's IP)
BASE_URL: 'http://192.168.1.100:5000'
```

### Backend Setup
Make sure your Flask backend is running on port 5000:

```bash
cd ../backend
python main.py
```

## 🚀 Running the App

### Android
```bash
# Start Metro bundler
npx react-native start

# Run on Android
npx react-native run-android
```

### iOS (macOS only)
```bash
# Install iOS dependencies
cd ios && pod install && cd ..

# Run on iOS
npx react-native run-ios
```

### Expo (Alternative)
```bash
npx expo start
```

## 📱 App Structure

```
SmartWasteSortApp/
├── src/
│   ├── screens/
│   │   ├── LandingPage.js          # Welcome screen
│   │   ├── DashboardSelection.js   # Dashboard choice
│   │   ├── Features.js             # Feature selection
│   │   ├── WasteDetection.js       # AI waste detection
│   │   ├── ReportGarbage.js        # Garbage reporting
│   │   └── MunicipalDashboard.js   # Admin dashboard
│   └── config/
│       └── api.js                  # API configuration
├── App.js                          # Main app component
└── package.json
```

## 🔌 API Endpoints

The app connects to these backend endpoints:

- `GET /api/health` - Health check
- `POST /api/mobile/detect` - Waste detection
- `POST /api/mobile/report-garbage` - Submit garbage report
- `GET /api/mobile/dashboard` - Get dashboard data
- `PUT /api/mobile/update-status` - Update report status

## 📸 Features in Detail

### 🎯 **Waste Detection**
- Take photos with camera
- Select images from gallery
- AI-powered waste type detection
- Recycling tips and recommendations
- Confidence scores for each detection

### 📍 **Report Garbage**
- Photo capture/upload
- Location detection (manual or GPS)
- Description input
- Form validation
- Submission to authorities

### 🏛️ **Municipal Dashboard**
- View all submitted reports
- Approve/reject reports
- Statistics overview
- Real-time updates

## 🔒 Permissions

The app requires these permissions:

- **Camera** - For taking photos
- **Photo Library** - For selecting images
- **Location** - For GPS coordinates (optional)

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler not starting**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build fails**
   ```bash
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

3. **iOS build fails**
   ```bash
   cd ios && pod install && cd ..
   npx react-native run-ios
   ```

4. **API connection fails**
   - Check if backend is running on port 5000
   - Verify API URL in `src/config/api.js`
   - For physical device, use computer's IP address

### Network Configuration

For physical device testing:

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

2. Update `src/config/api.js`:
   ```javascript
   BASE_URL: 'http://YOUR_IP_ADDRESS:5000'
   ```

3. Ensure both device and computer are on the same network

## 📱 Testing

### Manual Testing Checklist

- [ ] App launches and shows landing page
- [ ] Navigation between screens works
- [ ] Camera permissions are requested
- [ ] Photo capture works
- [ ] Gallery selection works
- [ ] Waste detection API calls work
- [ ] Report submission works
- [ ] Dashboard loads reports
- [ ] Approve/reject functionality works

### Backend Integration Testing

1. **Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Waste Detection**
   ```bash
   curl -X POST -F "image=@test_image.jpg" http://localhost:5000/api/mobile/detect
   ```

3. **Dashboard Data**
   ```bash
   curl http://localhost:5000/api/mobile/dashboard
   ```

## 🚀 Deployment

### Android APK
```bash
cd android
./gradlew assembleRelease
```

### iOS Archive
Use Xcode to archive and distribute the app.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Verify backend is running correctly

---

**Happy coding! 🎉**
