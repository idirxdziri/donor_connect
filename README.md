# DonorConnect Mobile App

A React Native mobile application built with Expo for the DonorConnect blood donation platform. This app provides a complete mobile experience with 100% feature parity with the Next.js web application.

## 🩸 Overview

DonorConnect Mobile is a comprehensive blood donation platform that connects donors, hospitals, and blood banks. The app enables users to find nearby blood donation requests, manage their donation history, receive notifications, and make pledges to save lives.

## ✨ Features

### Core Functionality

- **User Authentication** - Secure login and registration with JWT tokens
- **Dashboard** - Personalized overview with statistics and recent activity
- **Blood Donation Requests** - Browse and respond to nearby donation requests
- **Donors Directory** - Find compatible blood donors in your area
- **Hospitals Network** - Access to participating hospitals and blood banks
- **Profile Management** - Update personal information and medical details

### Advanced Features

- **Donation History** - Track your donation journey and impact
- **Smart Notifications** - Real-time alerts for urgent requests and updates
- **Pledge System** - Commit to future donations and build trust
- **Blood Type Matching** - Intelligent compatibility checking
- **Location Services** - Find nearby donation centers and requests
- **Secure Data Storage** - Encrypted storage for sensitive information

## 🏗️ Architecture

### Technology Stack

- **Framework**: Expo SDK 53
- **Language**: TypeScript
- **UI Library**: React Native Paper (Material Design)
- **Navigation**: React Navigation 7
- **State Management**: React Context API
- **Authentication**: JWT with Expo SecureStore
- **HTTP Client**: Fetch API with custom service layer
- **Icons**: Expo Vector Icons & React Native Vector Icons

### Project Structure

```
mobile/
├── App.tsx                 # Main app component
├── app.config.js          # Expo configuration
├── index.ts               # Entry point
├── screens/               # Application screens
│   ├── DashboardScreen.tsx
│   ├── DonationsScreen.tsx
│   ├── NotificationsScreen.tsx
│   ├── PledgesScreen.tsx
│   ├── ProfileScreen.tsx
│   └── ...
├── navigation/            # Navigation configuration
│   └── AppNavigator.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx
├── services/              # API and external services
│   └── api.ts
├── types/                 # TypeScript type definitions
│   ├── auth.ts
│   └── data.ts
└── assets/               # Images, icons, and static files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mobile
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npx expo start
   ```

4. **Run on specific platforms**

   ```bash
   # iOS Simulator (macOS only)
   npx expo run:ios
   
   # Android Emulator
   npx expo run:android
   
   # Web browser
   npx expo start --web
   ```

### Development Setup

1. **iOS Setup (macOS only)**
   - Install Xcode from the Mac App Store
   - Install iOS Simulator
   - Accept Xcode license: `sudo xcodebuild -license accept`

2. **Android Setup**
   - Install Android Studio
   - Create an Android Virtual Device (AVD)
   - Ensure ANDROID_HOME environment variable is set

3. **Physical Device Testing**
   - Install Expo Go from App Store/Play Store
   - Scan QR code from development server

## 📱 Screens & Navigation

### Tab Navigation

- **Dashboard** - Overview and statistics
- **Requests** - Blood donation requests
- **Donors** - Donor directory
- **Hospitals** - Hospital network
- **More** - Additional features

### More Screen Features

- **Donations** - Personal donation history
- **Notifications** - Alert management
- **Pledges** - Commitment tracking
- **Profile** - Account settings

## 🔐 Authentication & Security

### Authentication Flow

- JWT-based authentication
- Secure token storage using Expo SecureStore
- Automatic token refresh
- Biometric authentication support (future)

### Data Security

- Encrypted local storage
- HTTPS-only API communication
- Input validation and sanitization
- Secure handling of medical information

## 🌐 API Integration

### Base Configuration

- **Base URL**: Configurable API endpoint
- **Authentication**: Bearer token authentication
- **Error Handling**: Centralized error management
- **Request/Response**: JSON format with TypeScript interfaces

### Available Services

- `authApi` - User authentication
- `donationsApi` - Donation management
- `notificationsApi` - Notification system
- `usersApi` - User profile management
- `requestsApi` - Blood request handling

## 🎨 UI/UX Design

### Design System

- **Material Design 3** principles
- **Consistent color palette** with blood donation theme
- **Accessible typography** and contrast ratios
- **Responsive layout** for different screen sizes
- **Dark/Light mode** support

### Color Scheme

- **Primary**: #d32f2f (Blood red)
- **Secondary**: Complementary accent colors
- **Surface**: Material Design surface colors
- **Error/Success/Warning**: Standard semantic colors

## 🧪 Testing

### Available Scripts

```bash
# Type checking
npx tsc --noEmit

# Linting (if configured)
npm run lint

# Testing (if configured)
npm test
```

### Testing Strategy

- Unit tests for utility functions
- Integration tests for API services
- E2E tests for critical user flows
- Manual testing on multiple devices

## 📦 Building & Deployment

### Development Build

```bash
# Create development build
npx expo build:android
npx expo build:ios
```

### Production Build

```bash
# Create production build
npx expo build:android --release-channel production
npx expo build:ios --release-channel production
```

### App Store Deployment

1. **iOS App Store**
   - Build with Expo or EAS Build
   - Submit via App Store Connect
   - Follow Apple's review guidelines

2. **Google Play Store**
   - Generate signed APK/AAB
   - Upload via Google Play Console
   - Follow Google Play policies

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
API_BASE_URL=https://your-api-endpoint.com
APP_ENV=development
```

### App Configuration

Key settings in `app.config.js`:

- App name and slug
- Bundle identifiers
- Permissions
- Splash screen and icons
- Build configurations

## 🤝 Contributing

### Development Guidelines

1. Follow TypeScript best practices
2. Use React Native and Expo conventions
3. Maintain consistent code formatting
4. Write descriptive commit messages
5. Test on both iOS and Android

### Code Style

- Use TypeScript for type safety
- Follow React hooks patterns
- Implement proper error boundaries
- Use meaningful component and variable names
- Comment complex logic

## 📄 API Documentation

### Authentication Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

### Core Endpoints

- `GET /dashboard/stats` - Dashboard statistics
- `GET /requests` - Blood donation requests
- `GET /donors` - Donor directory
- `GET /hospitals` - Hospital network
- `POST /donations` - Record donation
- `GET /notifications` - User notifications

## 🚨 Troubleshooting

### Common Issues

1. **Metro bundler issues**

   ```bash
   npx expo start --clear
   ```

2. **iOS Simulator not opening**

   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

3. **Android emulator not found**
   - Ensure Android Studio is installed
   - Create and start an AVD
   - Check ANDROID_HOME path

4. **Network issues**
   - Check API endpoint configuration
   - Verify network connectivity
   - Review CORS settings

## 📊 Performance

### Optimization Strategies

- Image optimization and lazy loading
- Efficient list rendering with FlatList
- Proper component memoization
- Bundle size optimization
- Network request caching

### Monitoring

- Performance monitoring with Flipper
- Crash reporting (configurable)
- Analytics integration (optional)
- User feedback collection

## 📚 Resources

### Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://reactnativepaper.com/)

### Community

- [Expo Discord](https://discord.gg/expo)
- [React Native Community](https://reactnative.dev/community/overview)

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 👥 Team

- **Development Team** - Mobile app development and maintenance
- **Design Team** - UI/UX design and user experience
- **Backend Team** - API development and integration
- **QA Team** - Testing and quality assurance

## 🔄 Version History

### v1.0.0 (Current)

- Initial release with complete feature parity
- Full authentication system
- Core donation management features
- Real-time notifications
- Comprehensive donor and hospital networks
- Profile management and donation history

---

**DonorConnect Mobile** - Connecting donors, saving lives. 🩸❤️
