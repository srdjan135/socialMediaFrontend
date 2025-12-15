import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../../models/user.model';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

const BACKEND_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<{ message: string; users: User[] }>(
      BACKEND_URL + 'users'
    );
  }

  getUser() {
    return this.http.get<{ user: User }>(BACKEND_URL + 'user');
  }

  getProfileUser(username: string) {
    return this.http.get<{ user: User }>(
      BACKEND_URL + `profileUser/${username}`
    );
  }

  getFollowersList(username: string) {
    return this.http.get<{ followers: User[] }>(
      BACKEND_URL + `profileUser/${username}/followers`
    );
  }

  getFollowingList(username: string) {
    return this.http.get<{ following: User[] }>(
      BACKEND_URL + `profileUser/${username}/following`
    );
  }

  searchUsers(username: string) {
    if (!username) return of([]);
    return this.http.get<User[]>(
      BACKEND_URL + `users/search?username=${username}`
    );
  }

  updateUser(data: FormData) {
    return this.http.put<{ message: string; user: User }>(
      BACKEND_URL + 'user/update',
      data
    );
  }

  deleteProfile() {
    return this.http.delete(BACKEND_URL + 'user/delete');
  }
}
