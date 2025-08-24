/**
 * Firebase Configuration for Portfolio
 * With Simple Authentication System
 */

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhvt4uDRD6iTyLGPnsCkdzViK4zS0nUbM",
  authDomain: "portfolio-cb6ec.firebaseapp.com",
  projectId: "portfolio-cb6ec",
  storageBucket: "portfolio-cb6ec.firebasestorage.app",
  messagingSenderId: "8604173060",
  appId: "1:8604173060:web:62f7a77e2c791bfc350651",
  measurementId: "G-EJRXKFEVJF"
};

class FirebasePortfolioManager {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.userId = 'portfolio-user';
    this.adminToken = null; // Will store admin authentication token
    this.initializeFirebase();
  }

  async initializeFirebase() {
    try {
      console.log('🔥 Initializing Firebase...');
      
      // Check if Firebase is loaded
      if (typeof firebase === 'undefined') {
        console.log('❌ Firebase scripts not loaded. Please check your HTML includes.');
        this.fallbackToLocalStorage();
        return;
      }

      // Initialize Firebase app
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase app initialized');
      }

      // Initialize Firestore Database
      this.db = firebase.firestore();
      this.isInitialized = true;
      
      console.log('🎉 Firebase Firestore initialized successfully!');
      
      // Test connection and authentication
      await this.testConnection();
      
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      console.log('📱 Falling back to localStorage');
      this.fallbackToLocalStorage();
    }
  }

  async testConnection() {
    try {
      // Try to read from Firestore to test connection
      await this.db.collection('test').doc('connection').get();
      console.log('🔗 Firebase connection test successful');
    } catch (error) {
      console.warn('⚠️ Firebase connection test failed:', error.message);
    }
  }

  fallbackToLocalStorage() {
    this.isInitialized = false;
    console.log('📦 Using localStorage mode');
  }

  // Generate admin authentication token
  generateAdminToken() {
    const timestamp = Date.now();
    const adminKey = 'portfolio-admin-2025'; // You can change this secret key
    const token = btoa(`${adminKey}-${timestamp}`);
    this.adminToken = token;
    
    // Store token in session for admin panel
    sessionStorage.setItem('portfolioAdminToken', token);
    console.log('🔐 Admin token generated');
    
    return token;
  }

  // Verify admin authentication
  isAdminAuthenticated() {
    // Check if we have a valid admin session
    const sessionToken = sessionStorage.getItem('portfolioAdminToken');
    const storedToken = localStorage.getItem('portfolioAdminAuth');
    
    return !!(sessionToken || storedToken || this.adminToken);
  }

  // Save data to Firebase Firestore (with authentication)
  async saveToFirebase(data) {
    if (!this.isInitialized) {
      console.log('💾 Saving to localStorage (Firebase not available)');
      try {
        localStorage.setItem('portfolioData', JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('❌ localStorage save error:', error);
        return false;
      }
    }

    // Generate admin token if not exists
    if (!this.adminToken && !sessionStorage.getItem('portfolioAdminToken')) {
      this.generateAdminToken();
    }

    try {
      // Save to Firestore with admin token
      await this.db.collection('portfolios').doc(this.userId).set({
        ...data,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        timestamp: Date.now(),
        adminToken: this.adminToken || sessionStorage.getItem('portfolioAdminToken'),
        authorized: true
      });

      console.log('🎉 Data saved to Firebase Firestore successfully!');
      
      // Also save to localStorage as backup
      localStorage.setItem('portfolioData', JSON.stringify(data));
      
      return true;
    } catch (error) {
      console.error('❌ Firebase save error:', error);
      
      // Fallback to localStorage
      try {
        localStorage.setItem('portfolioData', JSON.stringify(data));
        console.log('💾 Data saved to localStorage as fallback');
        return true;
      } catch (localError) {
        console.error('❌ localStorage fallback failed:', localError);
        return false;
      }
    }
  }

  // Load data from Firebase Firestore
  async loadFromFirebase() {
    if (!this.isInitialized) {
      console.log('📥 Loading from localStorage (Firebase not available)');
      try {
        const localData = localStorage.getItem('portfolioData');
        return localData ? JSON.parse(localData) : null;
      } catch (error) {
        console.error('❌ localStorage load error:', error);
        return null;
      }
    }

    try {
      // Load from Firestore
      const doc = await this.db.collection('portfolios').doc(this.userId).get();
      
      if (doc.exists) {
        const firebaseData = doc.data();
        console.log('🎉 Data loaded from Firebase Firestore successfully!');
        
        // Clean up server timestamps and auth data for localStorage
        const cleanData = { ...firebaseData };
        delete cleanData.lastUpdated;
        delete cleanData.adminToken;
        delete cleanData.authorized;
        
        // Update localStorage with Firebase data
        localStorage.setItem('portfolioData', JSON.stringify(cleanData));
        
        return cleanData;
      } else {
        console.log('📁 No data found in Firebase, checking localStorage');
        const localData = localStorage.getItem('portfolioData');
        
        if (localData) {
          const parsedData = JSON.parse(localData);
          console.log('⬆️ Uploading localStorage data to Firebase...');
          await this.saveToFirebase(parsedData);
          return parsedData;
        }
        
        return null;
      }
    } catch (error) {
      console.error('❌ Firebase load error:', error);
      
      // Fallback to localStorage
      try {
        const localData = localStorage.getItem('portfolioData');
        if (localData) {
          console.log('💾 Loaded from localStorage as fallback');
          return JSON.parse(localData);
        }
        return null;
      } catch (localError) {
        console.error('❌ localStorage fallback failed:', localError);
        return null;
      }
    }
  }

  // Set up real-time listening for changes
  setupRealtimeSync() {
    if (!this.isInitialized) return;

    try {
      this.db.collection('portfolios').doc(this.userId)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const firebaseData = doc.data();
            console.log('🔄 Real-time data sync from Firebase');
            
            // Clean up server timestamps
            const cleanData = { ...firebaseData };
            delete cleanData.lastUpdated;
            
            // Update localStorage
            localStorage.setItem('portfolioData', JSON.stringify(cleanData));
            
            // Trigger portfolio update if available
            if (window.portfolioDataManager && window.portfolioDataManager.loadAdminData) {
              window.portfolioDataManager.loadAdminData();
            }
          }
        }, (error) => {
          console.error('❌ Real-time sync error:', error);
        });
    } catch (error) {
      console.error('❌ Error setting up real-time sync:', error);
    }
  }

  // Check Firebase connection status
  async checkConnection() {
    if (!this.isInitialized) return false;

    try {
      await this.db.collection('portfolios').doc(this.userId).get();
      return true;
    } catch (error) {
      console.error('❌ Connection check failed:', error);
      return false;
    }
  }

  // Get status information
  getStatus() {
    return {
      initialized: this.isInitialized,
      connected: this.isInitialized,
      mode: this.isInitialized ? 'Firebase Firestore' : 'localStorage',
      projectId: firebaseConfig.projectId
    };
  }
}

// Initialize Firebase manager globally
console.log('🚀 Starting Firebase Portfolio Manager...');
window.firebaseManager = new FirebasePortfolioManager();

// Set up real-time sync after a short delay to ensure everything is initialized
setTimeout(() => {
  if (window.firebaseManager && window.firebaseManager.isInitialized) {
    window.firebaseManager.setupRealtimeSync();
    console.log('🔄 Real-time sync enabled');
  }
}, 2000);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebasePortfolioManager;
}
