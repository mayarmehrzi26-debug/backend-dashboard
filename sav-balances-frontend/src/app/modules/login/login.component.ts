// src/app/modules/login/login.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/app/dashboard']);
    }
  }

  onSubmit() {
    // Réinitialiser
    this.errorMessage = '';
    this.cdr.detectChanges();

    if (!this.username || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    console.log('🔐 Tentative de connexion pour:', this.username);

    this.authService.login({ 
      username: this.username, 
      password: this.password 
    }).subscribe({
      next: (response) => {
        this.loading = false;
        this.errorMessage = '';
        this.cdr.detectChanges();
        console.log('✅ Connexion réussie:', response);
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Erreur de connexion:', err);
        
        // Extraire le message d'erreur
        let message = 'Nom d\'utilisateur ou mot de passe incorrect';
        
        if (err.error && typeof err.error === 'object') {
          if (err.error.message) {
            message = err.error.message;
          } else if (err.error.error) {
            message = err.error.error;
          }
        } else if (err.status === 0) {
          message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else if (err.status === 400) {
          message = 'Nom d\'utilisateur ou mot de passe incorrect';
        } else if (err.status === 401) {
          message = 'Session expirée. Veuillez vous reconnecter.';
        } else if (err.status === 500) {
          message = 'Erreur serveur. Veuillez réessayer plus tard.';
        }
        
        this.errorMessage = message;
        this.cdr.detectChanges(); // FORCER LA MISE À JOUR
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }
}