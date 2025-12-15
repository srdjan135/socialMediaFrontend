export interface UserNotification {
  _id: string;
  recipientId: string;
  senderId: string;
  type:
    | 'likePost'
    | 'likeComment'
    | 'comment'
    | 'follow'
    | 'followRequest'
    | 'acceptRequest';
  postId?: string;
  commentId?: string;
  isRead?: boolean;
}
