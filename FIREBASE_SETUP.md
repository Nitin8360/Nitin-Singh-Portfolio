# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "my-portfolio-db")
4. Follow the setup steps (you can disable Google Analytics if not needed)

## 2. Set up Firestore Database

1. In your Firebase project console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for now)
4. Select a location closest to your users

## 3. Get Your Firebase Configuration

1. In the Firebase console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click on the web icon (</>) to add a web app
4. Register your app with a name (e.g., "Portfolio Admin")
5. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 4. Update the Firebase Config File

1. Open `assets/js/firebase-config.js`
2. Replace the placeholder config with your actual Firebase configuration
3. Save the file

## 5. Set Up Security Rules (Important!)

1. In Firestore Database, go to the "Rules" tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to the portfolio document
    match /portfolio/data {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Note**: These rules allow anyone to read/write your data. For production, you should implement proper authentication and more restrictive rules.

## 6. Test the Integration

1. Open your admin panel and add some data
2. Check the browser console for Firebase connection messages
3. Open your portfolio in a different browser/device to see if data syncs

## Troubleshooting

- **Firebase not connecting**: Check the browser console for errors
- **Data not syncing**: Ensure Firestore rules allow read/write access
- **Config errors**: Double-check your Firebase configuration object

## Optional: Enable Authentication

If you want to secure your admin panel:

1. Go to Authentication in Firebase console
2. Enable your preferred sign-in method
3. Update the security rules to require authentication
4. Modify the admin panel to include login functionality

## Production Recommendations

1. **Security Rules**: Implement proper authentication and restrictive rules
2. **Domain Restrictions**: Restrict your Firebase app to specific domains
3. **Monitoring**: Enable Firebase monitoring and alerts
4. **Backup**: Set up automated Firestore backups
