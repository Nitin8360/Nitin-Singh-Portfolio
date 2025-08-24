// WORKING FIREBASE CONFIG
console.log('🔥 firebase-config.js script is loading...');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhvt4uDRD6iTyLGPnsCkdzViK4zS0nUbM",
  authDomain: "portfolio-cb6ec.firebaseapp.com",
  projectId: "portfolio-cb6ec",
  storageBucket: "portfolio-cb6ec.firebasestorage.app",
  messagingSenderId: "8604173060",
  appId: "1:8604173060:web:62f7a77e2c791bfc350651",
  measurementId: "G-EJRXKFEVJF"
};

console.log('⚙️ Firebase config loaded');

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized');
}

const db = firebase.firestore();
console.log('🗄️ Firestore connected');

// Create working Firebase manager
window.firebaseManager = {
    isInitialized: true,
    db: db,
    userId: 'portfolio-user',
    
    async saveToFirebase(data) {
        console.log('💾 Real Firebase save:', data);
        try {
            const docRef = db.collection('portfolios').doc(this.userId);
            const saveData = {
                ...data,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                timestamp: Date.now(),
                authorized: true,
                portfolioId: this.userId,
                source: 'admin-panel'
            };
            
            await docRef.set(saveData);
            console.log('🎉 Data saved to Firebase successfully!');
            return true;
        } catch (error) {
            console.error('❌ Firebase save error:', error);
            return false;
        }
    },
    
    async loadFromFirebase() {
        console.log('📥 Real Firebase load');
        try {
            const docRef = db.collection('portfolios').doc(this.userId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                const firebaseData = doc.data();
                console.log('✅ Data loaded from Firebase');
                
                // Clean the data
                const cleanData = { ...firebaseData };
                delete cleanData.lastUpdated;
                delete cleanData.authorized;
                delete cleanData.portfolioId;
                delete cleanData.source;
                delete cleanData.timestamp;
                
                return cleanData;
            } else {
                console.log('📁 No data found in Firebase');
                return null;
            }
        } catch (error) {
            console.error('❌ Firebase load error:', error);
            return null;
        }
    },
    
    async loadAdminData() {
        console.log('🔄 Real Firebase loadAdminData');
        return await this.loadFromFirebase();
    }
};

window.portfolioDataManager = window.firebaseManager;
console.log('✅ Real Firebase manager created successfully');
