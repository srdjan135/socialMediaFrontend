import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Comment } from '../../models/comment.model';
import { HttpClient } from '@angular/common/http';
import { SocketService } from './socket.service';
import { environment } from '../../../environments/environment';

const BACKEND_URL = environment.apiUrl + 'comments';

@Injectable({
  providedIn: 'root',
})
export class CommentsService {
  private comments: Comment[] = [];
  private commentsUpdate$ = new BehaviorSubject<Comment[]>([]);
  commentsUpdate = this.commentsUpdate$.asObservable();

  constructor(private http: HttpClient, private socketService: SocketService) {
    const socket = this.socketService.connection;

    socket.on('comments', (data) => {
      if (data.action === 'create') {
        this.comments.push(data.comment);
        this.emitUpdates();
      }

      if (data.action === 'delete') {
        this.comments = this.comments.filter((c) => c._id !== data.commentId);
        this.emitUpdates();
      }
    });
  }

  private emitUpdates() {
    this.commentsUpdate$.next([...this.comments]);
  }

  getComments(postId: string) {
    this.http
      .get<{ comments: Comment[] }>(BACKEND_URL + `?postId=${postId}`)
      .subscribe((res) => {
        this.comments = res.comments;
        this.emitUpdates();
      });
  }

  addComment(postId: string, content: string, recipientId: string) {
    return this.http.post<{ comment: Comment }>(BACKEND_URL, {
      postId,
      content,
      recipientId,
    });
  }

  likeComment(commentId: string, recipientId: string) {
    return this.http.put<{ message: string; updatedComment: Comment }>(
      BACKEND_URL + `/${commentId}/like`,
      { recipientId }
    );
  }

  deleteComment(commentId: string) {
    return this.http.delete(BACKEND_URL + `/${commentId}`);
  }
}
