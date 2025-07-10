import { router } from 'expo-router';

/**
 * Navigation helper for push notifications
 * This integrates with your Expo Router navigation system
 */
export class NavigationHelper {
  /**
   * Navigate to a post
   */
  static navigateToPost(postId?: string): void {
    if (!postId) {
      console.warn('No post ID provided for navigation');
      return;
    }
    
    // Navigate to post detail screen
    // Adjust the route based on your app's routing structure
    router.push(`/post/${postId}` as any);
  }

  /**
   * Navigate to a comment
   */
  static navigateToComment(commentId?: string): void {
    if (!commentId) {
      console.warn('No comment ID provided for navigation');
      return;
    }
    
    // Navigate to comment detail or post with comment highlighted
    // Adjust the route based on your app's routing structure
    router.push(`/comment/${commentId}` as any);
  }

  /**
   * Navigate to an event
   */
  static navigateToEvent(eventId?: string): void {
    if (!eventId) {
      console.warn('No event ID provided for navigation');
      return;
    }
    
    // Navigate to event detail screen
    // Adjust the route based on your app's routing structure
    router.push(`/event/${eventId}` as any);
  }

  /**
   * Navigate to a community
   */
  static navigateToCommunity(communityId?: string): void {
    if (!communityId) {
      console.warn('No community ID provided for navigation');
      return;
    }
    
    // Navigate to community detail screen
    // Adjust the route based on your app's routing structure
    router.push(`/community/${communityId}` as any);
  }

  /**
   * Navigate to a user profile
   */
  static navigateToUserProfile(userId?: string): void {
    if (!userId) {
      console.warn('No user ID provided for navigation');
      return;
    }
    
    // Navigate to user profile screen
    // Adjust the route based on your app's routing structure
    router.push(`/profile/${userId}` as any);
  }

  /**
   * Navigate using a deep link
   */
  static navigateToDeepLink(deepLink: string): void {
    try {
      // Parse the deep link and navigate accordingly
      const url = new URL(deepLink);
      const path = url.pathname;
      
      // Handle different deep link patterns
      if (path.startsWith('/post/')) {
        const postId = path.split('/')[2];
        this.navigateToPost(postId);
      } else if (path.startsWith('/event/')) {
        const eventId = path.split('/')[2];
        this.navigateToEvent(eventId);
      } else if (path.startsWith('/community/')) {
        const communityId = path.split('/')[2];
        this.navigateToCommunity(communityId);
      } else if (path.startsWith('/profile/')) {
        const userId = path.split('/')[2];
        this.navigateToUserProfile(userId);
             } else {
         // Fallback to direct navigation
         router.push(path as any);
       }
    } catch (error) {
      console.error('Error navigating to deep link:', error);
      // Fallback to home screen
      router.push('/');
    }
  }

  /**
   * Navigate to notifications screen
   */
  static navigateToNotifications(): void {
    router.push('/notifications');
  }

  /**
   * Navigate to home screen
   */
  static navigateToHome(): void {
    router.push('/');
  }
} 