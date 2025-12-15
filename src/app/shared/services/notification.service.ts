import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

const BACKEND_URL = environment.apiUrl + 'notification';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient) {}

  acceptFollowRequest(senderId: string, currentUserId: string) {
    return this.http.put(BACKEND_URL + '/accept', {
      senderId: senderId,
      currentUserId: currentUserId,
    });
  }

  followBackRequest(senderId: string, currentUserId: string) {
    return this.http.put(BACKEND_URL + '/followBack', {
      recipientId: senderId,
      senderId: currentUserId,
    });
  }

  deleteNotification(notId: string, senderId: string) {
    return this.http.delete(BACKEND_URL + `/${notId}`, {
      body: { senderId: senderId },
    });
  }

  declineFollowBackRequest(recipientId: string) {
    return this.http.delete(BACKEND_URL + `/decline/${recipientId}`);
  }

  markAllAsRead() {
    return this.http.put(BACKEND_URL + '/mark-all-read', {});
  }
}
