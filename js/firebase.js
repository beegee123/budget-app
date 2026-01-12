// firebase.js - Firebase Cloud Sync

const FirebaseSync = {
    db: null,
    userId: null,
    isInitialized: false,
    
    // Initialize Firebase
    init() {
        if (this.isInitialized) return;
        
        const firebaseConfig = {
            apiKey: "AIzaSyDUB6wKyO6joQiZ7o2EGUEJ24nw-3y1giw",
            authDomain: "budget-app-12d78.firebaseapp.com",
            projectId: "budget-app-12d78",
            storageBucket: "budget-app-12d78.firebasestorage.app",
            messagingSenderId: "492829529342",
            appId: "1:492829529342:web:0a29989a930d52807281af"
        };
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        this.db = firebase.firestore();
        
        // Get or create user ID
        this.userId = this.getUserId();
        
        this.isInitialized = true;
        console.log('🔥 Firebase initialized! User ID:', this.userId);
    },
    
    // Get or generate unique user ID
    getUserId() {
        let userId = localStorage.getItem('firebase_userId');
        if (!userId) {
            userId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
            localStorage.setItem('firebase_userId', userId);
            console.log('🆕 New user ID created:', userId);
        }
        return userId;
    },
    
    // Save all data to cloud
    async saveToCloud() {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return false;
        }
        
        try {
            // Get all data from localStorage
            const data = Storage.exportData();
            
            // Save to Firestore
            await this.db.collection('users').doc(this.userId).set({
                ...data,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('☁️ Data saved to cloud');
            return true;
        } catch (error) {
            console.error('Error saving to cloud:', error);
            return false;
        }
    },
    
    // Load data from cloud
    async loadFromCloud() {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return null;
        }
        
        try {
            const doc = await this.db.collection('users').doc(this.userId).get();
            
            if (doc.exists) {
                console.log('☁️ Data loaded from cloud');
                return doc.data();
            } else {
                console.log('📭 No cloud data found');
                return null;
            }
        } catch (error) {
            console.error('Error loading from cloud:', error);
            return null;
        }
    },
    
    // Enable real-time sync
    enableRealTimeSync() {
        if (!this.isInitialized) {
            console.error('Firebase not initialized');
            return;
        }
        
        // Listen for changes from other devices
        this.db.collection('users').doc(this.userId).onSnapshot((doc) => {
            if (doc.exists) {
                const cloudData = doc.data();
                const localExportDate = Storage.exportData().exportDate;
                
                // Only sync if cloud is newer
                if (cloudData.exportDate && cloudData.exportDate > localExportDate) {
                    console.log('🔄 Syncing from cloud...');
                    Storage.importData(cloudData);
                    
                    // Refresh UI
                    if (typeof updateBudgetDropdown === 'function') updateBudgetDropdown();
                    if (typeof updateDashboard === 'function') updateDashboard();
                    if (typeof renderEnvelopes === 'function') renderEnvelopes();
                    if (typeof renderCategoryFilters === 'function') renderCategoryFilters();
                }
            }
        });
        
        console.log('🔄 Real-time sync enabled');
    }
};

// Auto-initialize when page loads
if (typeof firebase !== 'undefined') {
    FirebaseSync.init();
}