'use client';

import { Notification } from '@/_sdk';
import { NotificationCard } from './NotificationCard';

type NotificationSectionProps = {
  title: string;
  notifications: Notification[];
};

export const NotificationSection = ({ title, notifications }: NotificationSectionProps) => {
  if (notifications.length === 0) return null;

  return (
    <>
      <h2
        className="focus:outline-none font-semibold leading-normal pt-8 border-b pb-2 border-gray-300 text-gray-600"
      >
        {title}
      </h2>
      {notifications.map((notification, index) => (
        <NotificationCard key={index} notification={notification} />
      ))}
    </>
  );
};
