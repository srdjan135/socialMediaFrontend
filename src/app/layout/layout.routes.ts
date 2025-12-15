import { Routes } from '@angular/router';
import { AuthGuard } from '../shared/guards/auth.guard';

export const layoutRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'chats',
        loadComponent: () =>
          import('../chats/chats.component').then((m) => m.ChatsComponent),
      },
      {
        path: 'create-post',
        loadComponent: () =>
          import('../posts/create-post/create-post.component').then(
            (m) => m.CreatePostComponent
          ),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('../notifications/notifications.component').then(
            (m) => m.NotificationsComponent
          ),
      },
      {
        path: 'edit/:userId',
        loadComponent: () =>
          import('../profile/edit-profile/edit-profile.component').then(
            (m) => m.EditProfileComponent
          ),
      },
      {
        path: ':username',
        loadComponent: () =>
          import('../profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
    ],
  },
];
