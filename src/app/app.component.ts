import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { SocketService } from './shared/services/socket.service';
import { UserService } from './shared/services/user.service';
import { User } from './models/user.model';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  user!: User;
  constructor(
    private auth: AuthService,
    private userService: UserService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.auth.autoAuthUser();

    this.auth.authReady$.subscribe(() => {
      if (!this.auth.isAuth()) return;

      this.userService.getUser().subscribe((res) => {
        this.user = res.user;
        this.socketService.registerOnline(this.user._id);
      });
    });
  }
}
