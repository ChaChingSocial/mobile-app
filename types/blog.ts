import { Like } from '@/types/post';

export type Blog = {
  id: string
  title: string;
  slug: string;
  content: string;
  subtitle?: string;
  tags: string[];
  createdAt: Date;
  modifiedAt: Date;
  authorId: string;
  coverPhoto?: string;
  likes: Like[];
  draft: boolean;
  communityId: string;
  postId: string;
};
