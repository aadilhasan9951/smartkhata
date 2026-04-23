// Contact synchronization utility for Android app

export const syncContacts = async () => {
  // Check if running in Android app
  if (window.AndroidInterface && window.AndroidInterface.syncContacts) {
    window.AndroidInterface.syncContacts();
    return true;
  }
  
  console.warn('Contacts sync only available in Android app');
  return false;
};

// Global function to receive contacts from Android
window.receiveContacts = async (contacts) => {
  try {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    
    await fetch(`${API_URL}/contacts/sync`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contacts }),
    });
    
    console.log('Contacts synced successfully');
    return true;
  } catch (error) {
    console.error('Failed to sync contacts:', error);
    return false;
  }
};

export const isAndroidApp = () => {
  return window.AndroidInterface && window.AndroidInterface.isAndroidApp();
};
