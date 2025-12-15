import { Chat } from './chat.model';
import { Comment } from './comment.model';
import { Message } from './message.model';
import { Post } from './post.model';
import { UserNotification } from './user-notification.model';

export interface User {
  _id: string;
  email: string;
  password: string;
  username: string;
  posts?: Post[];
  comments?: Comment[];
  chats?: Chat[];
  messages?: Message[];
  notifications?: UserNotification[];
  sentFollowRequests?: string[];
  followers?: string[];
  following?: string[];
  imagePath?: string;
  biography?: string;
  isPrivate?: boolean;
}
