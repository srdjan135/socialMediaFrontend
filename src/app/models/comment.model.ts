export interface Comment {
  _id: string;
  content: string;
  postId: string;
  userId: string;
  isUserLiked?: boolean;
  likes?: string[];
}
