# 🗑️ Smart Waste Segregation System

A comprehensive waste management system with mobile app and backend API for intelligent waste detection and municipal dashboard.

## 📱 Mobile App (React Native)

### Features
- **Waste Detection**: AI-powered waste classification
- **Report Garbage**: Submit waste reports with location and photos
- **Municipal Dashboard**: Authorities can approve/reject reports
- **Location Services**: GPS-based location tracking
- **Image Upload**: Photo capture and upload functionality

### Tech Stack
- React Native
- React Navigation
- React Native Vector Icons
- Geolocation API
- Image Picker

## 🖥️ Backend API (Flask)

### Features
- **RESTful API**: Complete backend for mobile app
- **Image Processing**: AI-powered waste detection
- **Database**: MongoDB integration
- **File Upload**: Image storage and retrieval
- **Municipal Dashboard**: Report management system

### Tech Stack
- Python Flask
- MongoDB
- Google Gemini AI
- Image processing
- CORS enabled

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Mobile App Setup
```bash
cd SmartWasteSortApp
npm install
npx react-native run-android
```

## 🌐 Deployment

### Railway Deployment (Backend)
1. Go to [Railway.app](https://railway.app)
2. Connect GitHub repository
3. Select `backend` folder
4. Deploy automatically

### Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/
DB_NAME=smart_waste_segregation
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
```

## 📁 Project Structure

```
├── backend/                 # Flask API server
│   ├── main.py             # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile           # Railway deployment
│   └── uploads/           # Image storage
├── SmartWasteSortApp/     # React Native mobile app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── config/        # API configuration
│   │   └── components/    # Reusable components
│   ├── android/           # Android configuration
│   └── ios/              # iOS configuration
└── README.md             # This file
```

## 🔧 API Endpoints

### Mobile Endpoints
- `POST /api/mobile/detect` - Waste detection
- `POST /api/mobile/report-garbage` - Submit report
- `GET /api/mobile/dashboard` - Get reports
- `PUT /api/mobile/update-status` - Update status

### Web Endpoints
- `GET /api/requests` - Get all requests
- `PUT /api/requests/<id>/status` - Update request status
- `GET /api/requests/<id>/image` - Get report image

## 📱 Mobile App Screens

1. **Landing Page** - Welcome screen
2. **Features** - App features overview
3. **Waste Detection** - AI waste classification
4. **Report Garbage** - Submit waste reports
5. **Municipal Dashboard** - Authority management
6. **Recycle Me** - Educational content

## 🎯 Key Features

- ✅ **AI Waste Detection** using Google Gemini
- ✅ **GPS Location** tracking
- ✅ **Image Upload** with compression
- ✅ **Municipal Dashboard** for authorities
- ✅ **Real-time Status** updates
- ✅ **Responsive Design** for all devices
- ✅ **Offline Support** with local storage

## 🚀 Deployment Status

- ✅ **Backend**: Ready for Railway deployment
- ✅ **Mobile App**: Ready for APK build
- ✅ **Database**: MongoDB integration complete
- ✅ **API**: All endpoints functional

## 📞 Support

For issues and questions:
- Check the deployment guides in each folder
- Review the API documentation
- Test endpoints with Postman

---

**Built with ❤️ for Smart Waste Management** 