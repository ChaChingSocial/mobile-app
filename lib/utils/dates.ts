import { Timestamp } from "firebase/firestore";

export const months = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

export const convertFirestoreTimestampToDate = (timestamp: Timestamp) => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

export const getMonthName = (month: string) =>
  months.find((m) => m.value === month)?.label || "";

export function formatTimestamp(timestamp: Timestamp | Date | number): string {
  if (timestamp.seconds && typeof timestamp === Timestamp) {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    return date.toLocaleString("en-US", { hour12: true });
  } else {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}

export function formatDate(dateString: Timestamp | Date) {
  const date =
    dateString instanceof Timestamp
      ? dateString.toDate()
      : new Date(dateString);
  const options = {
    year: "numeric" as const,
    month: "long" as const,
    day: "numeric" as const,
  };
  return date.toLocaleDateString(undefined, options);
}

export function calculateDaysLeft(deadline) {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const timeDifference = deadlineDate - now; // difference in milliseconds
  const daysLeft = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)); // convert to days
  return daysLeft;
}

export function formatPostDate(dateString: Timestamp | Date) {
  const date =
    dateString instanceof Timestamp
      ? dateString.toDate()
      : new Date(dateString);
  const options = {
    year: "numeric" as const,
    month: "long" as const,
    day: "numeric" as const,
  };
  return date.toLocaleDateString(undefined, options);
}
