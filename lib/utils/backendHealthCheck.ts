import { pushNotificationApi } from '@/config/backend';

/**
 * Check if the backend service is accessible
 */
export async function checkBackendHealth(): Promise<{
  isAccessible: boolean;
  error?: string;
  details?: any;
}> {
  try {
    console.log('Checking backend health...');
    
    // Try to make a simple request to see if the backend is responding
    // We'll use the test notification endpoint with minimal data
    const testData = {
      userId: 'health-check',
      deviceToken: 'health-check-token',
      platform: 'ios' as const,
      isActive: true,
      createdAt: new Date(),
      deviceTokenId: '',
      notification: {
        notificationType: 'COMMENTED' as any,
        entityType: 'POST' as any,
        notificationMessage: 'Health check',
        notificationTitle: 'Health check',
        userId: 'health-check',
      },
    };

    console.log('Sending health check request to backend...');
    
    const response = await pushNotificationApi.testPushNotification({
      pushNotification: testData,
    });

    console.log('Backend health check successful:', response);
    
    return {
      isAccessible: true,
      details: response,
    };
  } catch (error: any) {
    console.error('Backend health check failed:', error);
    
    let errorMessage = 'Unknown error';
    let details = {};
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    if (error.response) {
      details = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      };
    }
    
    return {
      isAccessible: false,
      error: errorMessage,
      details,
    };
  }
}

/**
 * Get backend configuration info
 */
export function getBackendConfig() {
  const config = {
    baseUrl: process.env.EXPO_PUBLIC_BACKEND || "https://chachingsocial-615685871214.us-central1.run.app",
    isDevelopment: process.env.NODE_ENV === 'development' || __DEV__,
  };
  
  console.log('Backend configuration:', config);
  return config;
} 