import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { getUserNotifications } from '@/lib/api/notifications';
import { getCurrentUser } from '@/lib/api/auth';
import { NotificationSection } from './NotificationSection';
import { Notification } from '@/_sdk';

export default function NotificationMenu() {
  const CookieUserInfo = Cookies.get('chaching-user');
  const currentUser = CookieUserInfo ? JSON.parse(CookieUserInfo) : getCurrentUser();
  const userId = currentUser.uid;

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    try {
      if (userId) {
        const res = await getUserNotifications(userId);
        setNotifications(res);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const groupNotificationsByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const lastTwoDaysNotifications = notifications.filter(({ createdAt }) => {
      const notificationDate = createdAt ? new Date(createdAt) : new Date(0);
      return notificationDate >= twoDaysAgo;
    });

    const thisWeekNotifications = notifications.filter(({ createdAt }) => {
      const notificationDate = createdAt ? new Date(createdAt) : new Date(0);
      return notificationDate >= startOfWeek && notificationDate < twoDaysAgo;
    });

    const olderNotifications = notifications.filter(({ createdAt }) => {
      const notificationDate = createdAt ? new Date(createdAt) : new Date(0);
      return notificationDate < startOfWeek;
    });

    return {
      lastTwoDays: lastTwoDaysNotifications,
      thisWeek: thisWeekNotifications,
      older: olderNotifications,
    };
  };

  const groupedNotifications = groupNotificationsByDate();

  return (
    <div className="w-full bg-gray-50 p-4 md:p-6 mx-auto">
      <div className="flex items-center justify-between">
        <p
          className="focus:outline-none text-2xl font-semibold leading-6 text-gray-800"
        >
          Notifications
        </p>
      </div>

      <NotificationSection title="New" notifications={groupedNotifications.lastTwoDays} />
      <NotificationSection title="This week" notifications={groupedNotifications.thisWeek} />
      <NotificationSection title="Earlier" notifications={groupedNotifications.older} />

      {notifications.length === 0 && (
        <div className="flex items-center justify-between">
          <hr className="w-full" />
          <p className="focus:outline-none text-sm flex flex-shrink-0 leading-normal px-3 py-16 text-gray-500">
            No notifications yet
          </p>
          <hr className="w-full" />
        </div>
      )}

      {notifications.length > 0 && (
        <div className="flex items-center justify-between">
          <hr className="w-full" />
          <p className="focus:outline-none text-sm flex flex-shrink-0 leading-normal px-3 py-16 text-gray-500">
            That&apos;s it for now :)
          </p>
          <hr className="w-full" />
        </div>
      )}
    </div>
  );
}
