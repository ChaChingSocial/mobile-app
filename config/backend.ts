import {
  BlogApi,
  CommunityApi,
  Configuration,
  NewsfeedApi,
  NotificationApi,
  ScoreApi,
  UserApi,
} from "@/_sdk";

const config = new Configuration({
  // basePath: 'https://chachingsocial-615685871214.us-central1.run.app',
  basePath: `${process.env.EXPO_PUBLIC_BACKEND}`,
});

export const userApi = new UserApi(config);
export const communityApi = new CommunityApi(config);
export const notificationApi = new NotificationApi(config);
export const scoreApi = new ScoreApi(config);
export const newsfeedApi = new NewsfeedApi(config);
export const blogApi = new BlogApi(config);
