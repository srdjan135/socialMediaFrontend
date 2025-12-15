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
  selector: 'app-signup',
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
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignupComponent {
  hide = signal(true);
  errorMessages: {
    type: string;
    msg: string;
    path: string;
    location: string;
  }[] = [];

  errorMessage = '';

  clickEvent(event: MouseEvent) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }

  constructor(private auth: AuthService) {}

  onSignup(form: NgForm) {
    if (form.invalid) {
      return;
    }
    const formData = new FormData();
    formData.append('email', form.value.email);
    formData.append('password', form.value.password);
    formData.append('username', form.value.username);

    this.auth.createUser(formData).subscribe({
      next: (user) => {
        console.log('Logged in user:', user);
      },
      error: (err) => {
        this.errorMessages = err.error?.errors;
        this.errorMessage = err.error?.message;
        console.log(err);
      },
    });
  }
}
