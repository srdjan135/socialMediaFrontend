import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
    MatIcon,
    RouterLink,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninComponent {
  hide = signal(true);
  errorMessage = '';
  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  constructor(private auth: AuthService) {}

  onLogin(form: NgForm) {
    const formData = new FormData();
    formData.append('email', form.value.email);
    formData.append('password', form.value.password);
    this.auth.login(formData).subscribe({
      next: (user) => {
        console.log('Logged in user:', user);
      },
      error: (err) => {
        this.errorMessage = err.error?.message;
        console.log(err);
      },
    });
  }
}
