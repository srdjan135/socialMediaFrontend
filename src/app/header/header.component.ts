import {
  Component,
  HostListener,
  OnInit,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../shared/services/auth.service';
import { UserService } from '../shared/services/user.service';
import { SocketService } from '../shared/services/socket.service';
import { User } from '../models/user.model';

import { MatToolbar } from '@angular/material/toolbar';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatInput } from '@angular/material/input';
import { MatFormField } from '@angular/material/form-field';
import { MatMenu, MatMenuTrigger, MatMenuItem } from '@angular/material/menu';
import {
  MatAutocomplete,
  MatAutocompleteTrigger,
  MatOption,
} from '@angular/material/autocomplete';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatToolbar,
    MatSlideToggle,
    MatInput,
    MatFormField,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    MatIcon,
    MatAutocomplete,
    MatOption,
    MatAutocompleteTrigger,
    MatIconButton,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  currentUser!: User;

  readonly searchControl = new FormControl('');
  filteredUsers: User[] = [];

  isSearchOpen = true;
  isBigSearchOpen = false;
  isDarkMode = true;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
    private socketService: SocketService
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.updateSearchVisibility();
  }

  ngOnInit(): void {
    this.updateSearchVisibility();
    this.initTheme();
    this.loadCurrentUser();
    this.initUserSearch();
  }

  openSearch() {
    this.isBigSearchOpen = true;
  }

  closeSearch() {
    this.isBigSearchOpen = false;
  }

  selectUser(user: User) {
    this.router.navigate(['/', user.username]);
    this.closeSearch();
  }

  private initUserSearch() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        filter((term): term is string => !!term?.trim()),
        distinctUntilChanged(),
        switchMap((term) => this.userService.searchUsers(term)),
        tap((users) => (this.filteredUsers = users)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private loadCurrentUser() {
    this.userService
      .getUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => (this.currentUser = res.user));
  }

  onLogout() {
    this.socketService.connection.emit('user_offline', this.currentUser._id);
    this.socketService.disconnect();
    this.auth.logout();
  }

  onDeleteProfile() {
    this.userService
      .deleteProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.auth.logout());
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('isDarkMode', String(this.isDarkMode));
  }

  private initTheme() {
    const savedTheme = localStorage.getItem('isDarkMode');
    this.isDarkMode = savedTheme === null ? true : savedTheme === 'true';
    this.applyTheme();
    localStorage.setItem('isDarkMode', String(this.isDarkMode));
  }

  private applyTheme() {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
    document.body.classList.toggle('light-theme', !this.isDarkMode);
  }

  private updateSearchVisibility() {
    const isDesktop = window.innerWidth > 768;
    this.isSearchOpen = isDesktop;
    if (isDesktop) {
      this.isBigSearchOpen = false;
    }
  }
}
