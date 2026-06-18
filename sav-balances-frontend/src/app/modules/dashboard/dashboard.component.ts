import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { forkJoin, Subscription, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

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
    totalBalances: 0 
  };
  recentInterventionsExternes: any[] = [];
  recentInterventionsInternes: any[] = [];
  loading = true;
  errorMessage = '';
  private dashboardSubscription?: Subscription;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading = true;
    this.errorMessage = '';
    this.recentInterventionsExternes = [];
    this.recentInterventionsInternes = [];
    this.cdr.detectChanges();

    if (this.dashboardSubscription) {
      this.dashboardSubscription.unsubscribe();
    }

    try {
      const clients$ = this.apiService.getClients().pipe(
        timeout(3000),
        catchError(err => { console.error('Erreur Clients:', err); return of([]); })
      );

      const interventionsExternes$ = this.apiService.getInterventionsByType('EXTERNE').pipe(
        timeout(3000),
        catchError(err => { console.error('Erreur Interventions Externes:', err); return of([]); })
      );

      const interventionsInternes$ = this.apiService.getInterventionsByType('INTERNE').pipe(
        timeout(3000),
        catchError(err => { console.error('Erreur Interventions Internes:', err); return of([]); })
      );

      const balances$ = this.apiService.getBalances().pipe(
        timeout(3000),
        catchError(err => { console.error('Erreur Balances:', err); return of([]); })
      );

      this.dashboardSubscription = forkJoin({
        clients: clients$,
        interventionsExternes: interventionsExternes$,
        interventionsInternes: interventionsInternes$,
        balances: balances$
      }).subscribe({
        next: ({ clients, interventionsExternes, interventionsInternes, balances }) => {
          const safeClients = clients || [];
          const safeInterventionsExternes = interventionsExternes || [];
          const safeInterventionsInternes = interventionsInternes || [];
          const safeBalances = balances || [];

          this.stats.totalClients = safeClients.length;
          this.stats.totalInterventionsExternes = safeInterventionsExternes.length;
          this.stats.totalInterventionsInternes = safeInterventionsInternes.length;
          this.stats.totalBalances = safeBalances.length;

          // Trier les interventions externes par date (plus récentes d'abord)
          if (safeInterventionsExternes.length > 0) {
            this.recentInterventionsExternes = [...safeInterventionsExternes]
              .sort((a, b) => {
                const dateA = a?.dateOrdre ? new Date(a.dateOrdre).getTime() : 0;
                const dateB = b?.dateOrdre ? new Date(b.dateOrdre).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 5);
          }

          // Trier les interventions internes par date (plus récentes d'abord)
          if (safeInterventionsInternes.length > 0) {
            this.recentInterventionsInternes = [...safeInterventionsInternes]
              .sort((a, b) => {
                const dateA = a?.dateOrdre ? new Date(a.dateOrdre).getTime() : 0;
                const dateB = b?.dateOrdre ? new Date(b.dateOrdre).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, 5);
          }

          if (safeClients.length === 0 && 
              safeInterventionsExternes.length === 0 && 
              safeInterventionsInternes.length === 0 && 
              safeBalances.length === 0) {
            this.errorMessage = "Impossible de joindre le serveur (Timeout). Vérifiez votre Backend.";
          }

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (globalError) => {
          console.error('Erreur critique globale:', globalError);
          this.errorMessage = 'Une erreur critique est survenue.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });

    } catch (crash) {
      console.error('Le code TypeScript a crashé avant la requête:', crash);
      this.errorMessage = 'Erreur interne de l\'application.';
      this.loading = false;
      this.cdr.detectChanges();
    }
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