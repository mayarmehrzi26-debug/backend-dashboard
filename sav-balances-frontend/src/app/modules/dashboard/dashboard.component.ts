// src/app/modules/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Intervention, Client, Balance } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/user.model';
import { forkJoin, Subscription, of, timeout, catchError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

type StatutIntervention = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';

interface InterventionDisplay {
  id?: number;
  numeroOrdre: string;
  societe: string;
  bascule?: string;
  reference?: string;
  reclamation: string;
  technicien: string;
  dateReclamation: string;
  dateOrdre: string;
  statutIntervention?: StatutIntervention;
  type?: string;
  montantTotal?: number;
  montantPaye?: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = { 
    totalClients: 0, 
    totalInterventionsExternes: 0, 
    totalInterventionsInternes: 0,
    totalUsers: 0,
    totalMesInterventions: 0
  };
  recentInterventionsExternes: InterventionDisplay[] = [];
  recentInterventionsInternes: InterventionDisplay[] = [];
  mesInterventions: InterventionDisplay[] = [];
  users: User[] = [];
  loading = true;
  errorMessage = '';
  private dashboardSubscription?: Subscription;
  
  // Rôles
  isAdmin = false;
  isTechnicien = false;
  isUser = false;
  currentUserNom = '';

  // Labels des statuts
  statutLabels: {[key: string]: string} = {
    'EN_ATTENTE': '🔵 En attente',
    'CONFIRME': '🟡 En cours',
    'ANNULE': '🔴 Annulé',
    'TERMINE': '🟢 Terminé'
  };

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.isTechnicien = this.authService.isTechnicien();
    this.isUser = this.authService.isUser();
    
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserNom = currentUser.fullName || currentUser.username;
    }
    
    this.loadDashboard();
  }

  private determinerStatut(interv: Intervention): StatutIntervention {
    let statut: StatutIntervention = 'EN_ATTENTE';
    
    if (interv.statutIntervention === 'ANNULE') {
      return 'ANNULE';
    }
    
    const montantTotal = interv.montantTotal || 0;
    const montantPaye = interv.montantPaye || 0;
    if (montantTotal > 0 && montantPaye >= montantTotal) {
      return 'TERMINE';
    }
    
    if (interv.dateOrdre) {
      return 'CONFIRME';
    }
    
    return 'EN_ATTENTE';
  }

  private formaterIntervention(interv: Intervention): InterventionDisplay {
    const statut = this.determinerStatut(interv);
    
    return {
      id: interv.id,
      numeroOrdre: interv.numeroOrdre || '-',
      societe: interv.societe || '-',
      bascule: interv.bascule || '-',
      reference: interv.reference || '-',
      reclamation: interv.reclamation || '-',
      technicien: interv.technicien || '-',
      dateReclamation: interv.dateReclamation || '',
      dateOrdre: interv.dateOrdre || '',
      statutIntervention: statut,
      type: interv.type || 'INTERNE',
      montantTotal: interv.montantTotal || 0,
      montantPaye: interv.montantPaye || 0
    };
  }

  loadDashboard() {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    if (this.dashboardSubscription) {
      this.dashboardSubscription.unsubscribe();
    }

    try {
      const TIMEOUT_MS = 30000;

      // ===== GESTION DES APPELS SELON LE RÔLE =====
      // Clients : visible pour ADMIN et USER seulement
      let clients$ = of<Client[]>([]);
      if (this.isAdmin || this.isUser) {
        clients$ = this.apiService.getClients().pipe(
          timeout(TIMEOUT_MS),
          catchError((err: HttpErrorResponse) => {
            console.warn('⚠️ Erreur chargement clients:', err.message);
            return of<Client[]>([]);
          })
        );
      }

      // Interventions Externes : visible pour tous
      const interventionsExternes$ = this.apiService.getInterventionsByType('EXTERNE').pipe(
        timeout(TIMEOUT_MS),
        catchError((err: HttpErrorResponse) => {
          console.warn('⚠️ Erreur chargement interventions externes:', err.message);
          return of<Intervention[]>([]);
        })
      );

      // Interventions Internes : visible pour tous
      const interventionsInternes$ = this.apiService.getInterventionsByType('INTERNE').pipe(
        timeout(TIMEOUT_MS),
        catchError((err: HttpErrorResponse) => {
          console.warn('⚠️ Erreur chargement interventions internes:', err.message);
          return of<Intervention[]>([]);
        })
      );

      // Utilisateurs : visible uniquement pour ADMIN
      let users$ = of<User[]>([]);
      if (this.isAdmin) {
        users$ = this.userService.getUsers().pipe(
          timeout(TIMEOUT_MS),
          catchError((err: HttpErrorResponse) => {
            console.warn('⚠️ Erreur chargement utilisateurs:', err.message);
            return of<User[]>([]);
          })
        );
      }

      this.dashboardSubscription = forkJoin({
        clients: clients$,
        interventionsExternes: interventionsExternes$,
        interventionsInternes: interventionsInternes$,
        users: users$
      }).subscribe({
        next: ({ clients, interventionsExternes, interventionsInternes, users }) => {
          console.log('✅ Données chargées avec succès');
          
          const safeClients = clients || [];
          const safeExternes = interventionsExternes || [];
          const safeInternes = interventionsInternes || [];
          const safeUsers = users || [];

          // ===== STATISTIQUES =====
          this.stats.totalClients = safeClients.length;
          this.stats.totalUsers = safeUsers.length;
          
          // ===== FILTRAGE POUR TECHNICIEN =====
          let externesFiltrees = safeExternes;
          let internesFiltrees = safeInternes;
          
          if (this.isTechnicien && this.currentUserNom) {
            externesFiltrees = safeExternes.filter(i => 
              i.technicien === this.currentUserNom || 
              i.technicien === this.authService.getCurrentUser()?.username
            );
            internesFiltrees = safeInternes.filter(i => 
              i.technicien === this.currentUserNom || 
              i.technicien === this.authService.getCurrentUser()?.username
            );
          }
          
          this.stats.totalInterventionsExternes = safeExternes.length;
          this.stats.totalInterventionsInternes = safeInternes.length;
          this.stats.totalMesInterventions = externesFiltrees.length + internesFiltrees.length;

          // ===== INTERVENTIONS EXTERNES =====
          this.recentInterventionsExternes = externesFiltrees
            .map(i => this.formaterIntervention(i))
            .sort((a, b) => {
              const dateA = a.dateReclamation ? new Date(a.dateReclamation).getTime() : 0;
              const dateB = b.dateReclamation ? new Date(b.dateReclamation).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5);

          // ===== INTERVENTIONS INTERNES =====
          this.recentInterventionsInternes = internesFiltrees
            .map(i => this.formaterIntervention(i))
            .sort((a, b) => {
              const dateA = a.dateReclamation ? new Date(a.dateReclamation).getTime() : 0;
              const dateB = b.dateReclamation ? new Date(b.dateReclamation).getTime() : 0;
              return dateB - dateA;
            })
            .slice(0, 5);

          // ===== MES INTERVENTIONS (pour technicien) =====
          if (this.isTechnicien) {
            this.mesInterventions = [...externesFiltrees, ...internesFiltrees]
              .map(i => this.formaterIntervention(i))
              .sort((a, b) => {
                const dateA = a.dateReclamation ? new Date(a.dateReclamation).getTime() : 0;
                const dateB = b.dateReclamation ? new Date(b.dateReclamation).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 10);
          }

          // ===== UTILISATEURS (pour ADMIN) =====
          if (this.isAdmin) {
            this.users = safeUsers;
          }

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (globalError) => {
          console.error('❌ Erreur globale:', globalError);
          
          if (globalError.name === 'TimeoutError') {
            this.errorMessage = '⚠️ Le serveur met trop de temps à répondre. Veuillez réessayer.';
          } else {
            this.errorMessage = 'Une erreur est survenue lors du chargement des données.';
          }
          
          this.loading = false;
          this.cdr.detectChanges();
        }
      });

    } catch (crash) {
      console.error('❌ Erreur interne:', crash);
      this.errorMessage = 'Erreur interne de l\'application.';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  getStatutLabel(statut?: string): string {
    return this.statutLabels[statut || ''] || statut || 'Non défini';
  }

  getStatutClass(statut?: string): string {
    const classes: {[key: string]: string} = {
      'EN_ATTENTE': 'badge-secondary',
      'CONFIRME': 'badge-warning',
      'ANNULE': 'badge-danger',
      'TERMINE': 'badge-success'
    };
    return classes[statut || ''] || 'badge-secondary';
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

  getStatusLabel(enabled: boolean): string {
    return enabled ? '✅ Actif' : '❌ Inactif';
  }

  getStatusClass(enabled: boolean): string {
    return enabled ? 'badge-success' : 'badge-secondary';
  }

  isTechnicienAssigne(intervention: InterventionDisplay): boolean {
    if (!this.isTechnicien) return false;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return intervention.technicien === currentUser.fullName || 
           intervention.technicien === currentUser.username;
  }

  refresh() {
    this.loadDashboard();
  }

  ngOnDestroy() {
    if (this.dashboardSubscription) {
      this.dashboardSubscription.unsubscribe();
    }
  }
}