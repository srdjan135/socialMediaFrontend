import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Post } from '../../models/post.model';
import { Subject } from 'rxjs';

import { environment } from '../../../environments/environment';

const BACKEND_URL = environment.apiUrl + 'posts';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  posts: Post[] = [];
  private postsUpdated$ = new Subject<Post[]>();
  postsUpdate = this.postsUpdated$.asObservable();

  constructor(private http: HttpClient) {}

  getPosts() {
    this.http
      .get<{ message: string; posts: Post[] }>(BACKEND_URL)
      .subscribe((res) => {
        if (res.posts) {
          this.posts = res.posts;
          this.postsUpdated$.next([...this.posts]);
        }
      });
  }

  addPost(formData: FormData) {
    this.http.post<Post>(BACKEND_URL, formData).subscribe((res) => {
      this.posts.push(res);
      this.postsUpdated$.next([...this.posts]);
    });
  }

  likePost(postId: string, recipientId: string) {
    return this.http.put<{ message: string; updatedPost: Post }>(
      BACKEND_URL + `/${postId}/like`,
      { recipientId: recipientId }
    );
  }

  deletePost(postId: string) {
    return this.http.delete(BACKEND_URL + `/${postId}`);
  }
}
