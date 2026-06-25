import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User, getRoleLabel, getRoleClass } from '../../models/user.model';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  showForm = false;
  isEditing = false;
  selectedUser: User | null = null;
  userForm: FormGroup;
  loading = true;
  searchTerm = '';
  isAdmin = false;

  showDeleteModal = false;
  private pendingDeleteId: number | null = null;

  roles = [
    { value: 'ADMIN', label: '👑 Administrateur' },
    { value: 'TECHNICIEN', label: '🔧 Technicien' },
    { value: 'USER', label: '👤 Utilisateur' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadUsers();
  }

  createForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      role: ['USER', Validators.required],
      fullName: ['', Validators.required],
      telephone: [''], // ← AJOUTÉ
      enabled: [true]
    });
  }

  loadUsers() {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.filteredUsers = [...data];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterUsers() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredUsers = [...this.users];
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredUsers = this.users.filter(user => {
      return (
        user.username.toLowerCase().includes(term) ||
        user.fullName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.telephone?.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    });
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredUsers = [...this.users];
    this.cdr.detectChanges();
  }

  openForm() {
    this.isEditing = false;
    this.selectedUser = null;
    this.userForm.reset({
      username: '',
      password: '',
      email: '',
      role: 'USER',
      fullName: '',
      telephone: '', // ← AJOUTÉ
      enabled: true
    });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
    this.cdr.detectChanges();
  }

  editUser(user: User) {
    this.isEditing = true;
    this.selectedUser = user;
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      telephone: user.telephone || '', // ← AJOUTÉ
      enabled: user.enabled
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.showForm = true;
    this.cdr.detectChanges();
  }

  closeForm() {
    this.showForm = false;
    this.userForm.reset();
    this.cdr.detectChanges();
  }

  saveUser() {
    if (this.userForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.userForm.value;
    
    console.log('📞 Données du formulaire:', formValue);
    
    if (this.isEditing && this.selectedUser) {
      const updatedUser: User = {
        ...this.selectedUser,
        username: formValue.username,
        email: formValue.email,
        role: formValue.role,
        fullName: formValue.fullName,
        telephone: formValue.telephone || '', // ← AJOUTÉ
        enabled: formValue.enabled
      };

      if (formValue.password) {
        updatedUser.password = formValue.password;
      }

      console.log('📞 Mise à jour utilisateur avec téléphone:', updatedUser.telephone);

      this.loading = true;
      this.userService.updateUser(this.selectedUser.id!, updatedUser).subscribe({
        next: (response) => {
          console.log('✅ Utilisateur mis à jour:', response);
          this.loadUsers();
          this.closeForm();
          this.loading = false;
          alert('✅ Utilisateur modifié avec succès');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Erreur:', err);
          this.loading = false;
          alert('❌ Erreur lors de la modification');
          this.cdr.detectChanges();
        }
      });
    } else {
      const newUser: User = {
        username: formValue.username,
        password: formValue.password,
        email: formValue.email,
        role: formValue.role,
        fullName: formValue.fullName,
        telephone: formValue.telephone || '', // ← AJOUTÉ
        enabled: true
      };

      console.log('📞 Création utilisateur avec téléphone:', newUser.telephone);

      this.loading = true;
      this.userService.createUser(newUser).subscribe({
        next: (response) => {
          console.log('✅ Utilisateur créé:', response);
          this.loadUsers();
          this.closeForm();
          this.loading = false;
          alert('✅ Utilisateur créé avec succès');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Erreur:', err);
          this.loading = false;
          alert('❌ Erreur lors de la création: ' + (err.error?.message || err.message));
          this.cdr.detectChanges();
        }
      });
    }
  }
  openDeleteModal(id: number) {
    this.pendingDeleteId = id;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.pendingDeleteId = null;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (this.pendingDeleteId === null) return;

    const user = this.users.find(u => u.id === this.pendingDeleteId);
    if (user?.username === 'admin') {
      alert('❌ Impossible de supprimer l\'administrateur principal');
      this.closeDeleteModal();
      return;
    }

    this.loading = true;
    this.userService.deleteUser(this.pendingDeleteId).subscribe({
      next: () => {
        this.loadUsers();
        this.closeDeleteModal();
        this.loading = false;
        alert('✅ Utilisateur supprimé avec succès');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        alert('❌ Erreur lors de la suppression');
        this.cdr.detectChanges();
      }
    });
  }

  toggleEnabled(user: User) {
    if (user.username === 'admin') {
      alert('❌ Impossible de désactiver l\'administrateur principal');
      return;
    }

    this.loading = true;
    this.userService.toggleUserEnabled(user.id!).subscribe({
      next: () => {
        this.loadUsers();
        this.loading = false;
        alert(`✅ Utilisateur ${user.enabled ? 'désactivé' : 'activé'} avec succès`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        alert('❌ Erreur lors du changement de statut');
        this.cdr.detectChanges();
      }
    });
  }

  getRoleLabel(role: string): string {
    return role === 'ADMIN' ? '👑 Administrateur' : '👤 Utilisateur';
  }

  getRoleClass(role: string): string {
    return role === 'ADMIN' ? 'badge-danger' : 'badge-info';
  }

  getStatusLabel(enabled: boolean): string {
    return enabled ? '✅ Actif' : '❌ Inactif';
  }

  getStatusClass(enabled: boolean): string {
    return enabled ? 'badge-success' : 'badge-secondary';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}