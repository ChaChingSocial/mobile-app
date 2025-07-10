import {
  BlogApi,
  CommunityApi,
  Configuration,
  NewsfeedApi,
  NotificationApi,
  PushNotificationApi,
  ScoreApi,
  UserApi,
} from "@/_sdk";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND || "https://chachingsocial-615685871214.us-central1.run.app";
console.log('Using backend URL:', BACKEND_URL);

const config = new Configuration({
  basePath: BACKEND_URL,
});

export const userApi = new UserApi(config);
export const communityApi = new CommunityApi(config);
export const notificationApi = new NotificationApi(config);
export const scoreApi = new ScoreApi(config);
export const newsfeedApi = new NewsfeedApi(config);
export const blogApi = new BlogApi(config);
export const pushNotificationApi = new PushNotificationApi(config);