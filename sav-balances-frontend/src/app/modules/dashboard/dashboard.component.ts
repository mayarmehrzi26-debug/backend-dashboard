import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  montantRestant?: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = { 
    totalClients: 0, 
    totalInterventionsExternes: 0, 
    totalInterventionsInternes: 0,
    totalUsers: 0,
    totalMesInterventions: 0
  };

  // ===== RENTABILITÉ =====
  rentabilite = {
    totalChiffreAffaire: 0,
    totalPaye: 0,
    totalRestant: 0,
    tauxRecouvrement: 0,
    nombreInterventionsPayees: 0,
    nombreInterventionsNonPayees: 0,
    totalInterventions: 0,
    moyenneParIntervention: 0
  };

  // ===== FILTRES =====
  filtres = {
    type: 'tous',
    statut: 'tous',
    dateDebut: '',
    dateFin: '',
    societe: '',
    technicien: '',
    minMontant: null as number | null,
    maxMontant: null as number | null
  };
  showFilters: boolean = false;
  filteredInterventions: InterventionDisplay[] = [];
  allInterventions: InterventionDisplay[] = [];

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

  // Options de filtres
  typeOptions = [
    { value: 'tous', label: '📊 Tous' },
    { value: 'INTERNE', label: '🏠 Interne' },
    { value: 'EXTERNE', label: '🌍 Externe' }
  ];

  statutOptions = [
    { value: 'tous', label: '📊 Tous' },
    { value: 'EN_ATTENTE', label: '🔵 En attente' },
    { value: 'CONFIRME', label: '🟡 En cours' },
    { value: 'ANNULE', label: '🔴 Annulé' },
    { value: 'TERMINE', label: '🟢 Terminé' }
  ];

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

  // ==================== FILTRES ====================
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  resetFilters() {
    this.filtres = {
      type: 'tous',
      statut: 'tous',
      dateDebut: '',
      dateFin: '',
      societe: '',
      technicien: '',
      minMontant: null,
      maxMontant: null
    };
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allInterventions];
    
    // Filtre par type
    if (this.filtres.type !== 'tous') {
      filtered = filtered.filter(i => i.type === this.filtres.type);
    }
    
    // Filtre par statut
    if (this.filtres.statut !== 'tous') {
      filtered = filtered.filter(i => i.statutIntervention === this.filtres.statut);
    }
    
    // Filtre par société
    if (this.filtres.societe && this.filtres.societe.trim() !== '') {
      const societe = this.filtres.societe.toLowerCase().trim();
      filtered = filtered.filter(i => i.societe?.toLowerCase().includes(societe));
    }
    
    // Filtre par technicien
    if (this.filtres.technicien && this.filtres.technicien.trim() !== '') {
      const technicien = this.filtres.technicien.toLowerCase().trim();
      filtered = filtered.filter(i => i.technicien?.toLowerCase().includes(technicien));
    }
    
    // Filtre par date
    if (this.filtres.dateDebut) {
      const debut = new Date(this.filtres.dateDebut);
      debut.setHours(0, 0, 0, 0);
      filtered = filtered.filter(i => {
        if (!i.dateReclamation) return false;
        return new Date(i.dateReclamation) >= debut;
      });
    }
    
    if (this.filtres.dateFin) {
      const fin = new Date(this.filtres.dateFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(i => {
        if (!i.dateReclamation) return false;
        return new Date(i.dateReclamation) <= fin;
      });
    }
    
    // Filtre par montant
    if (this.filtres.minMontant !== null && this.filtres.minMontant > 0) {
      filtered = filtered.filter(i => (i.montantTotal || 0) >= this.filtres.minMontant!);
    }
    
    if (this.filtres.maxMontant !== null && this.filtres.maxMontant > 0) {
      filtered = filtered.filter(i => (i.montantTotal || 0) <= this.filtres.maxMontant!);
    }
    
    this.filteredInterventions = filtered;
    this.cdr.detectChanges();
  }

  // ==================== CALCUL DE LA RENTABILITÉ ====================
  calculerRentabilite(interventions: InterventionDisplay[]) {
    const total = interventions.length;
    const payees = interventions.filter(i => 
      (i.montantTotal || 0) > 0 && (i.montantPaye || 0) >= (i.montantTotal || 0)
    );
    const nonPayees = interventions.filter(i => 
      (i.montantTotal || 0) > 0 && (i.montantPaye || 0) < (i.montantTotal || 0)
    );
    
    const totalCA = interventions.reduce((sum, i) => sum + (i.montantTotal || 0), 0);
    const totalPaye = interventions.reduce((sum, i) => sum + (i.montantPaye || 0), 0);
    const totalRestant = totalCA - totalPaye;
    
    this.rentabilite = {
      totalChiffreAffaire: totalCA,
      totalPaye: totalPaye,
      totalRestant: totalRestant,
      tauxRecouvrement: totalCA > 0 ? Math.round((totalPaye / totalCA) * 100) : 0,
      nombreInterventionsPayees: payees.length,
      nombreInterventionsNonPayees: nonPayees.length,
      totalInterventions: total,
      moyenneParIntervention: total > 0 ? Math.round(totalCA / total) : 0
    };
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
    const montantTotal = interv.montantTotal || 0;
    const montantPaye = interv.montantPaye || 0;
    
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
      montantTotal: montantTotal,
      montantPaye: montantPaye,
      montantRestant: Math.max(0, montantTotal - montantPaye)
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

      const interventionsExternes$ = this.apiService.getInterventionsByType('EXTERNE').pipe(
        timeout(TIMEOUT_MS),
        catchError((err: HttpErrorResponse) => {
          console.warn('⚠️ Erreur chargement interventions externes:', err.message);
          return of<Intervention[]>([]);
        })
      );

      const interventionsInternes$ = this.apiService.getInterventionsByType('INTERNE').pipe(
        timeout(TIMEOUT_MS),
        catchError((err: HttpErrorResponse) => {
          console.warn('⚠️ Erreur chargement interventions internes:', err.message);
          return of<Intervention[]>([]);
        })
      );

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

          // ===== TOUTES LES INTERVENTIONS POUR LES FILTRES =====
          const toutesInterventions = [...safeExternes, ...safeInternes];
          this.allInterventions = toutesInterventions.map(i => this.formaterIntervention(i));
          
          // Appliquer les filtres
          this.applyFilters();

          // ===== STATISTIQUES =====
          this.stats.totalClients = safeClients.length;
          this.stats.totalUsers = safeUsers.length;
          
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

          // ===== CALCUL DE LA RENTABILITÉ =====
          const toutesFiltrees = [...externesFiltrees, ...internesFiltrees];
          this.calculerRentabilite(toutesFiltrees.map(i => this.formaterIntervention(i)));

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