
import { Notification } from '@/_sdk';

type NotificationCardProps = {
  notification: Notification;
  showDate?: boolean;
};

export const NotificationCard = ({ notification, showDate = true }: NotificationCardProps) => {
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'PRODUCT_SHIPPED':
      case 'PRODUCT_DELIVERED':
      case 'FOLLOWED':
      case 'SUBSCRIBED':
        return 'bg-green-100 border-green-200 text-green-700';
      case 'PRODUCT_RETURNED':
      case 'EVENT_CANCELLED':
        return 'bg-red-100 border-red-200 text-red-700';
      case 'EVENT_REMINDER':
      case 'EVENT_STARTED':
        return 'bg-yellow-100 border-yellow-200 text-yellow-700';
      default:
        return 'bg-white';
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKED':
      case 'COMMENT_LIKED':
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.00059 3.01934C9.56659 1.61334 11.9866 1.66 13.4953 3.17134C15.0033 4.68334 15.0553 7.09133 13.6526 8.662L7.99926 14.3233L2.34726 8.662C0.944589 7.09133 0.997256 4.67934 2.50459 3.17134C4.01459 1.662 6.42992 1.61134 8.00059 3.01934Z"
              fill="#EF4444"
            />
          </svg>
        );
      // ... include all other icon cases from your original code
      default:
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.00059 3.01934C9.56659 1.61334 11.9866 1.66 13.4953 3.17134C15.0033 4.68334 15.0553 7.09133 13.6526 8.662L7.99926 14.3233L2.34726 8.662C0.944589 7.09133 0.997256 4.67934 2.50459 3.17134C4.01459 1.662 6.42992 1.61134 8.00059 3.01934Z"
              fill="#EF4444"
            />
          </svg>
        );
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <Link href={notification.notificationLink || '#'}>
      <div
        className={`w-full p-3 mt-4 rounded flex ${getNotificationColor(notification.notificationType)}`}
      >
        <div
          aria-label="notification icon"
          role="img"
          className={`focus:outline-none w-8 h-8 border rounded-full flex items-center justify-center ${
            notification.notificationType === 'PRODUCT_SHIPPED' ||
            notification.notificationType === 'PRODUCT_DELIVERED' ||
            notification.notificationType === 'FOLLOWED' ||
            notification.notificationType === 'SUBSCRIBED'
              ? 'border-green-200'
              : notification.notificationType === 'PRODUCT_RETURNED' ||
                  notification.notificationType === 'EVENT_CANCELLED'
                ? 'border-red-200'
                : notification.notificationType === 'EVENT_REMINDER' ||
                    notification.notificationType === 'EVENT_STARTED'
                  ? 'border-yellow-200'
                  : 'border-gray-200'
          }`}
        >
          {renderNotificationIcon(notification.notificationType)}
        </div>
        <div className="pl-3">
          <p className="focus:outline-none text-sm leading-none">
            {notification.notificationMessage || 'New notification'}
          </p>
          {showDate && (
            <p className="focus:outline-none text-xs leading-3 pt-1 text-gray-500">
              {getTimeAgo(notification.createdAt || '')}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};
