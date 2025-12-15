import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../../models/user.model';
import { BehaviorSubject, map, Observable, of, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const BACKEND_URL = environment.apiUrl;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isAuthenticated = false;
  private tokenTimer: any;
  private token!: string;
  private authReady = new BehaviorSubject<boolean>(false);
  authReady$ = this.authReady.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  getToken() {
    return this.token;
  }

  isAuth(): boolean {
    return !!this.getToken();
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  createUser(userData: FormData) {
    return this.http
      .post<{
        message: string;
        user: User;
        token?: string;
        expiresIn?: number;
      }>(BACKEND_URL + 'signup', userData)
      .pipe(
        switchMap((res) => {
          if (res.token) {
            this.handleAuth(res.token, res.expiresIn!);
            return of(res.user);
          }
          const loginData = new FormData();
          loginData.append('email', userData.get('email') as string);
          loginData.append('password', userData.get('password') as string);
          return this.login(loginData);
        })
      );
  }

  login(userData: FormData): Observable<User> {
    return this.http
      .post<{ token: string; expiresIn: number; user?: User }>(
        BACKEND_URL + 'login',
        userData
      )
      .pipe(
        tap((res) => this.handleAuth(res.token, res.expiresIn)),
        map((res) => res.user!)
      );
  }

  private handleAuth(token: string, expiresIn: number) {
    this.token = token;
    this.isAuthenticated = true;
    const now = new Date();
    const expirationDate = new Date(now.getTime() + expiresIn * 1000);
    this.setAuthTime(expiresIn);
    this.saveAuthData(token, expirationDate);
    this.authReady.next(true);
    this.router.navigate(['/']);
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) {
      this.authReady.next(true);
      return;
    }
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInformation.token;
      this.isAuthenticated = true;
      this.setAuthTime(expiresIn / 1000);
    }
    this.authReady.next(true);
  }

  logout() {
    this.token = '';
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
    this.clearAuthData();
  }

  private setAuthTime(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  private saveAuthData(token: string, expirationDate: Date) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiration');
    localStorage.removeItem('isDarkMode');
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expiration');
    if (!token || !expirationDate) {
      return null;
    }

    return {
      token: token,
      expirationDate: new Date(expirationDate),
    };
  }
}
