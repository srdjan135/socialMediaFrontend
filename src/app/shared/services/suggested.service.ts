import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserNotification } from '../../models/user-notification.model';
import { environment } from '../../../environments/environment';

const BACKEND_URL = environment.apiUrl + 'user';

@Injectable({ providedIn: 'root' })
export class SuggestedService {
  constructor(private http: HttpClient) {}

  followUser(recipientId: string) {
    return this.http.post(BACKEND_URL + `/${recipientId}/follow`, {});
  }

  sentFollowRequest(followedUserId: string) {
    return this.http.post<{
      message: string;
      notification: UserNotification;
      isRequested: boolean;
    }>(BACKEND_URL + `/${followedUserId}/followRequest`, {});
  }

  removeSentFollowRequest(unfollowedUserId: string) {
    return this.http.delete(BACKEND_URL + `/${unfollowedUserId}/removeRequest`);
  }

  removeFollower(followerId: string) {
    return this.http.delete<{ message: string }>(
      BACKEND_URL + `/${followerId}/removeFollower`
    );
  }

  unfollowUser(followingId: string) {
    return this.http.delete<{ message: string }>(
      BACKEND_URL + `/${followingId}/unfollow`
    );
  }
}
