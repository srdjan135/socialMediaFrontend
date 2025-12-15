import { Comment } from './comment.model';

export interface Post {
  _id: string;
  imagePath?: string;
  description: string;
  comments?: Comment[];
  isUserLiked?: boolean;
  likes?: string[];
  userId: string;
}
