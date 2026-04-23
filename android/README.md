# SmartKhata Android App

This is a hybrid Android application that loads the SmartKhata web application in a WebView with native capabilities for contact synchronization.

## Features

- WebView integration to load the web app
- Native contacts access and synchronization
- JavaScript bridge for communication between web and native layers
- WhatsApp integration for sending reminders

## Prerequisites

- Android Studio installed
- Android SDK (API 21+)
- Java 8 or higher

## Setup Instructions

### 1. Configure Web App URL

Edit `MainActivity.java` and update the `WEB_APP_URL` constant:

```java
// For Android Emulator
private static final String WEB_APP_URL = "http://10.0.2.2:3000";

// For Real Device (replace with your computer's IP)
private static final String WEB_APP_URL = "http://YOUR_IP_ADDRESS:3000";
```

### 2. Find Your IP Address

On Windows:
```bash
ipconfig
```

On Mac/Linux:
```bash
ifconfig
```

Use your local IP address (e.g., 192.168.1.100)

### 3. Build the APK

1. Open this folder in Android Studio
2. Wait for Gradle sync to complete
3. Build → Build Bundle(s) / APK(s) → Build APK(s)
4. The APK will be in `app/build/outputs/apk/debug/app-debug.apk`

### 4. Install on Device

- Connect your Android device via USB
- Enable USB debugging in Developer Options
- Run the app from Android Studio, or
- Transfer the APK file and install manually

## Permissions

The app requires the following permissions:
- `INTERNET` - To load the web app
- `READ_CONTACTS` - To sync device contacts
- `ACCESS_NETWORK_STATE` - To check network connectivity

## JavaScript Bridge

The app exposes the following JavaScript methods to the web app:

### `AndroidInterface.syncContacts()`
Requests contacts permission and syncs device contacts to the backend.

### `AndroidInterface.sendWhatsAppMessage(phone, message)`
Opens WhatsApp with a pre-filled message to the specified phone number.

### `AndroidInterface.showToast(message)`
Displays a toast message on the Android device.

### `AndroidInterface.isAndroidApp()`
Returns `true` if running inside the Android app.

## Usage in Web App

```javascript
// Check if running in Android app
if (window.AndroidInterface && window.AndroidInterface.isAndroidApp()) {
  // Sync contacts
  window.AndroidInterface.syncContacts();
  
  // Send WhatsApp message
  window.AndroidInterface.sendWhatsAppMessage('1234567890', 'Your balance is ₹1000');
}
```

## Troubleshooting

### WebView not loading content
- Check that your web app is running
- Verify the IP address in MainActivity.java
- Ensure both device and computer are on the same network
- Check firewall settings

### Contacts sync not working
- Verify READ_CONTACTS permission is granted
- Check browser console for JavaScript errors
- Verify backend API is accessible

### Build errors
- Ensure Android SDK is properly installed
- Update Gradle and Android Studio to latest versions
- Clean and rebuild the project

## Future Enhancements

- Push notifications
- Offline support
- Native payment integration
- Biometric authentication
