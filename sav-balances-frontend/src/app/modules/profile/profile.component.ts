// src/app/modules/profile/profile.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  saving = false;
  passwordLoading = false;
  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  showPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.createProfileForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit() {
    console.log('📱 ProfileComponent - ngOnInit');
    // Vérifier que l'utilisateur est connecté avant de charger
    if (!this.authService.isLoggedIn()) {
      console.log('❌ Utilisateur non connecté, redirection vers login');
      this.router.navigate(['/login']);
      return;
    }
    this.loadProfile();
  }

  createProfileForm(): FormGroup {
    return this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['']
    });
  }

  createPasswordForm(): FormGroup {
    return this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): any {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  loadProfile() {
    console.log('📱 loadProfile - Début');
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const currentUser = this.authService.getCurrentUser();
    console.log('📱 currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('❌ Aucun utilisateur connecté');
      this.errorMessage = 'Vous devez être connecté pour accéder à votre profil.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    console.log(`📱 Chargement du profil pour: ${currentUser.username}`);
    
    // Vérifier que le username est valide
    if (!currentUser.username || currentUser.username.trim() === '') {
      console.log('❌ Nom d\'utilisateur invalide');
      this.errorMessage = 'Nom d\'utilisateur invalide. Veuillez vous reconnecter.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.profileService.getProfile(currentUser.username).subscribe({
      next: (data) => {
        console.log('✅ Profil reçu:', data);
        if (data) {
          this.user = data;
          this.profileForm.patchValue({
            fullName: data.fullName || '',
            email: data.email || '',
            telephone: data.telephone || ''
          });
          this.loading = false;
          this.errorMessage = '';
          this.cdr.detectChanges();
          console.log('✅ Profil chargé avec succès');
        } else {
          console.log('❌ Données de profil vides');
          this.errorMessage = 'Aucune donnée de profil disponible.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('❌ Erreur chargement profil:', err);
        console.error('❌ Détails erreur:', err.error);
        
        if (err.status === 401) {
          this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          // Rediriger vers login après un court délai
          setTimeout(() => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }, 2000);
        } else if (err.status === 404) {
          this.errorMessage = 'Profil non trouvé. Veuillez contacter l\'administrateur.';
        } else if (err.status === 0) {
          this.errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else {
          this.errorMessage = err.error?.message || 'Erreur lors du chargement du profil';
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Veuillez remplir correctement tous les champs';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'Utilisateur non connecté';
      this.saving = false;
      this.cdr.detectChanges();
      return;
    }

    const formValue = this.profileForm.value;
    const updatedUser: Partial<User> = {
      fullName: formValue.fullName,
      email: formValue.email,
      telephone: formValue.telephone || ''
    };

    console.log('📝 Mise à jour du profil:', updatedUser);

    this.profileService.updateProfile(currentUser.username, updatedUser).subscribe({
      next: (data) => {
        console.log('✅ Profil mis à jour:', data);
        this.user = data;
        this.successMessage = '✅ Profil mis à jour avec succès';
        this.saving = false;
        
        // Mettre à jour le localStorage
        localStorage.setItem('fullName', data.fullName || '');
        this.authService.refreshCurrentUser();
        
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 5000);
      },
      error: (err) => {
        console.error('❌ Erreur mise à jour:', err);
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du profil';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.errors?.['mismatch']) {
        this.passwordErrorMessage = 'Les mots de passe ne correspondent pas';
      } else {
        this.passwordErrorMessage = 'Veuillez remplir tous les champs correctement';
      }
      this.cdr.detectChanges();
      return;
    }

    this.passwordLoading = true;
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';
    this.cdr.detectChanges();

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.passwordErrorMessage = 'Utilisateur non connecté';
      this.passwordLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const formValue = this.passwordForm.value;

    console.log('🔑 Changement de mot de passe pour:', currentUser.username);

    this.profileService.changePassword(
      currentUser.username,
      formValue.oldPassword,
      formValue.newPassword
    ).subscribe({
      next: (response) => {
        console.log('✅ Mot de passe changé:', response);
        this.passwordSuccessMessage = '✅ ' + (response.message || 'Mot de passe modifié avec succès');
        this.passwordLoading = false;
        this.passwordForm.reset();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.passwordSuccessMessage = '';
          this.cdr.detectChanges();
        }, 5000);
      },
      error: (err) => {
        console.error('❌ Erreur changement mot de passe:', err);
        this.passwordErrorMessage = err.error?.message || 'Erreur lors du changement de mot de passe';
        this.passwordLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getRoleLabel(role: string): string {
    const labels: {[key: string]: string} = {
      'ADMIN': '👑 Administrateur',
      'TECHNICIEN': '🔧 Technicien',
      'USER': '👤 Utilisateur'
    };
    return labels[role] || role;
  }

  getRoleClass(role: string): string {
    const classes: {[key: string]: string} = {
      'ADMIN': 'badge-danger',
      'TECHNICIEN': 'badge-primary',
      'USER': 'badge-info'
    };
    return classes[role] || 'badge-secondary';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  }

  // Méthode pour rafraîchir manuellement
  refresh() {
    this.loadProfile();
  }
}