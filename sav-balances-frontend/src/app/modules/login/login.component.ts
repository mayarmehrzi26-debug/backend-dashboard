// login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  errorMessage = '';
  loading = false;
  showPassword = false;
  rememberMe = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Si déjà connecté, rediriger vers le dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/app/dashboard']); // Notez le '/app/'
    }
  }

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.loading = false;
        if (this.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        this.router.navigate(['/app/dashboard']); // Notez le '/app/'
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Nom d\'utilisateur ou mot de passe incorrect';
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}