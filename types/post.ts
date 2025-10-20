import { Timestamp } from "firebase/firestore";
import { Goal } from "./goal";
import { Product } from "./product";

export type Post = {
  id?: string;
  posterUserId: string;
  posterName: string;
  createdAt: Timestamp | Date;
  modifiedAt: Timestamp | Date;
  posterPic?: string;
  title?: string;
  post: string;
  likes?: Like[];
  tags?: string[];
  comments?: Comment[];
  pictures?: Picture[];
  documents?: Document[];
  videos?: (string | { url: string })[];
  linkPreview?: LinkPreview | null;
  product?: Product | null;
  category: string;
  newsfeedId?: string;
  advert?: AdvertType | null;
  event?: PostEventType | null;
  presentation?: string | null;
  goal?: Goal | null;
  podcast?: string | null;
  pinPost?: { id: string; order: number };
  featured?: boolean;
  mentions?: { id: string; label: string }[];
  taggedUsers?: { id: string; label: string }[];
};

export type AdvertType = {
  advertId: string;
  title: string;
  commentable: boolean;
  description: string;
  images: string[];
  finfluencerUserId: string;
  pricePerClick: number;
  clicks: number;
  impressions: number;
  startTimeDate: Date;
  endTimeDate: string;
  content: string;
  link?: string;
};

export type PostEventType = {
  address?: { address: string };
  address2?: Address;
  commentsEnabled: boolean;
  description: string;
  startTimeDate: Date;
  endTimeDate?: Date;
  eventId?: string;
  eventType: string;
  finfluencerUserId: string;
  images?: string[];
  link1?: string;
  link2?: string;
  link3?: string;
  lumaWidget?: string;
  moderators: string[];
  price: number;
  privacy: string;
  recorded: boolean;
  rsvps: {
    localId: string;
    email: string;
    displayName: string;
    photoUrl: string;
  }[];
  timezone: string;
  title: string;
  video?:
    | {
        uri: string;
        name: string;
        type: string;
      }
    | string;
};

export type Address = {
  city: string;
  street: string;
  street2: string;
  state: string;
  country: string;
  zipcode: string;
};

export type Like = {
  userId: string;
  reaction: string;
  timestamp: Date;
};

export type Comment = {
  comments: Comment[];
  communityId: string;
  id: string;
  likes: Like[];
  message: { message: string; mentions: string[] };
  postReference?: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userPic: string;
  commentReference?: string;
};

export type Picture = {
  id: string;
  url: string;
  description: string;
  createdAt: Date;
  modifiedAt: Date;
  type?: string;
};

export type Document = {
  id: string;
  url: string;
  description: string;
};

export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  publisher: string;
  publisherPicUrl: string;
};

export type AdPostData = {
  title: string;
  description: string;
  selectedFiles: File[];
  startTimeDate: string;
  endTimeDate: string;
  pricePerClick: string;
  commentable: boolean;
  finfluencerUserId: string | undefined;
  clicks: number;
  impressions: number;
};

export type SpotifyEmbed = {
  html: string;
  iframe_url: string;
  width: number;
  height: number;
  version: string;
  provider_name: string;
  provider_url: string;
  type: string;
  title: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
};
