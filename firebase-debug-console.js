// Debug Firebase Initialization
// Run this in the browser console to test Firebase

console.log('🔍 Firebase Debug Test Starting...');

// Check Firebase availability
console.log('📦 Firebase Global Check:');
console.log('  - typeof firebase:', typeof firebase);
console.log('  - window.firebase:', !!window.firebase);

// Check if Firebase scripts are loaded
console.log('📜 Firebase Script Status:');
console.log('  - firebase.app:', typeof firebase?.app);
console.log('  - firebase.firestore:', typeof firebase?.firestore);

// Check our Firebase manager
console.log('🏗️ Firebase Manager Status:');
console.log('  - window.firebaseManager exists:', !!window.firebaseManager);
console.log('  - window.portfolioDataManager exists:', !!window.portfolioDataManager);

if (window.firebaseManager) {
    console.log('  - firebaseManager.isInitialized:', window.firebaseManager.isInitialized);
    console.log('  - firebaseManager status:', window.firebaseManager.getStatus());
} else {
    console.log('  - firebaseManager: NOT FOUND');
}

// Try manual initialization
if (window.initializeFirebaseManager) {
    console.log('🔧 Attempting manual initialization...');
    const success = window.initializeFirebaseManager();
    console.log('  - Manual init result:', success);
    
    if (window.firebaseManager) {
        console.log('  - After manual init - isInitialized:', window.firebaseManager.isInitialized);
    }
} else {
    console.log('🔧 Manual initialization function not available');
}

console.log('🏁 Debug test complete!');
