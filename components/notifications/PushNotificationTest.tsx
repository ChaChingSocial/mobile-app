import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text as GluestackText } from '@/components/ui/text';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationTestProps {
  userId: string;
}

export default function PushNotificationTest({ userId }: PushNotificationTestProps) {
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test push notification');
  const [isSending, setIsSending] = useState(false);

  const {
    isInitialized,
    isInitializing,
    error,
    initialize,
    sendTestNotification,
  } = usePushNotifications({
    userId,
    autoInitialize: false,
  });

  const handleSendTestNotification = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Push notifications not initialized');
      return;
    }

    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Please enter both title and body');
      return;
    }

    setIsSending(true);
    try {
      await sendTestNotification(title, body);
      Alert.alert('Success', 'Test notification sent successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setIsSending(false);
    }
  };

  const handleInitialize = async () => {
    try {
      await initialize();
      Alert.alert('Success', 'Push notifications initialized successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize push notifications');
    }
  };

  return (
    <View style={{ padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, margin: 16 }}>
      <GluestackText size="lg" bold className="mb-4">
        Push Notification Test
      </GluestackText>

      <VStack space="md">
        {/* Status */}
        <View style={{ padding: 12, backgroundColor: '#fff', borderRadius: 6 }}>
          <GluestackText size="sm" bold className="mb-2">
            Status:
          </GluestackText>
          <HStack space="sm" className="items-center">
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: isInitialized ? '#10b981' : isInitializing ? '#f59e0b' : '#ef4444',
              }}
            />
            <GluestackText size="sm">
              {isInitializing
                ? 'Initializing...'
                : isInitialized
                ? 'Initialized'
                : 'Not Initialized'}
            </GluestackText>
          </HStack>
          {error && (
            <GluestackText size="sm" className="text-red-500 mt-1">
              Error: {error}
            </GluestackText>
          )}
        </View>

        {/* Initialize Button */}
        {!isInitialized && !isInitializing && (
          <Button
            onPress={handleInitialize}
            disabled={isInitializing}
            size="sm"
            variant="solid"
            action="primary"
          >
            <ButtonText>Initialize Push Notifications</ButtonText>
          </Button>
        )}

        {/* Test Form */}
        {isInitialized && (
          <VStack space="md">
            <GluestackText size="sm" bold>
              Send Test Notification:
            </GluestackText>
            
            <Input size="sm" variant="outline">
              <InputField
                placeholder="Notification Title"
                value={title}
                onChangeText={setTitle}
              />
            </Input>

            <Input size="sm" variant="outline">
              <InputField
                placeholder="Notification Body"
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={3}
              />
            </Input>

            <Button
              onPress={handleSendTestNotification}
              disabled={isSending}
              size="sm"
              variant="solid"
              action="secondary"
            >
              <ButtonText>
                {isSending ? 'Sending...' : 'Send Test Notification'}
              </ButtonText>
            </Button>
          </VStack>
        )}

        {/* User ID Display */}
        <View style={{ padding: 8, backgroundColor: '#e5e7eb', borderRadius: 4 }}>
          <GluestackText size="xs" className="text-gray-600">
            User ID: {userId}
          </GluestackText>
        </View>
      </VStack>
    </View>
  );
} 