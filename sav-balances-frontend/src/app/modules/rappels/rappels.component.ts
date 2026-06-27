import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RappelService, RappelPoinconnage } from '../../core/services/rappel.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-rappels',
  templateUrl: './rappels.component.html',
  styleUrls: ['./rappels.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RappelsComponent implements OnInit {
  rappels: RappelPoinconnage[] = [];
  filteredRappels: RappelPoinconnage[] = [];
  rappelsImminents: RappelPoinconnage[] = [];
  rappelsExpires: RappelPoinconnage[] = [];
  isGenerating = false;
  loading = true;
  searchTerm = '';
  selectedStatut: string = 'tous';
  showRappelModal = false;
  selectedRappel: RappelPoinconnage | null = null;
  
  // Statistiques
  totalRappels = 0;
  rappelsActifs = 0;
  rappelsEnCours = 0;
  rappelsExpiresCount = 0;
  
  // Couleurs par statut
  statutColors: {[key: string]: string} = {
    'ACTIF': 'badge-success',
    'EN_COURS': 'badge-warning',
    'EXPIRE': 'badge-danger',
    'TRAITE': 'badge-secondary'
  };
  
  statutLabels: {[key: string]: string} = {
    'ACTIF': '✅ Actif',
    'EN_COURS': '⚠️ En cours',
    'EXPIRE': '🚨 Expiré',
    'TRAITE': '📌 Traité'
  };
  
  statutIcons: {[key: string]: string} = {
    'ACTIF': 'bi-check-circle',
    'EN_COURS': 'bi-exclamation-triangle',
    'EXPIRE': 'bi-x-circle',
    'TRAITE': 'bi-check-circle-fill'
  };

  constructor(
    private rappelService: RappelService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRappels();
  }

  loadRappels() {
    this.loading = true;
    console.log('🔄 Chargement des rappels...');
    this.cdr.detectChanges();
    
    this.rappelService.getRappelsActifs().subscribe({
      next: (response: any) => {
        console.log('📋 Réponse API:', response);
        
        // ✅ Gérer les deux formats de réponse
        if (response && response.success === true && response.data) {
          this.rappels = response.data || [];
        } else if (Array.isArray(response)) {
          this.rappels = response;
        } else {
          this.rappels = [];
        }
        
        console.log('📋 Nombre de rappels chargés:', this.rappels.length);
        
        this.filteredRappels = [...this.rappels];
        this.updateStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur chargement rappels:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateStats() {
    this.totalRappels = this.rappels.length;
    this.rappelsActifs = this.rappels.filter(r => r.statut === 'ACTIF').length;
    this.rappelsEnCours = this.rappels.filter(r => r.statut === 'EN_COURS').length;
    this.rappelsExpiresCount = this.rappels.filter(r => r.statut === 'EXPIRE').length;
    console.log('📊 Stats:', {
      total: this.totalRappels,
      actifs: this.rappelsActifs,
      enCours: this.rappelsEnCours,
      expires: this.rappelsExpiresCount
    });
  }

  filterRappels() {
    let filtered = [...this.rappels];
    
    // Filtre par recherche
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r =>
        r.societe?.toLowerCase().includes(term) ||
        r.equipement?.toLowerCase().includes(term) ||
        r.numeroOrdre?.toLowerCase().includes(term) ||
        r.responsable?.toLowerCase().includes(term)
      );
    }
    
    // Filtre par statut
    if (this.selectedStatut !== 'tous') {
      filtered = filtered.filter(r => r.statut === this.selectedStatut);
    }
    
    // Trier par jours restants (les plus urgents d'abord)
    filtered.sort((a, b) => (a.joursRestants || 999) - (b.joursRestants || 999));
    
    this.filteredRappels = filtered;
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchTerm = '';
    this.selectedStatut = 'tous';
    this.filterRappels();
  }

  getJoursColor(jours: number): string {
    if (jours <= 0) return '#dc3545';
    if (jours <= 7) return '#ff6b6b';
    if (jours <= 15) return '#ffc107';
    if (jours <= 30) return '#17a2b8';
    if (jours <= 60) return '#28a745';
    return '#0d3e23';
  }

  getJoursIcon(jours: number): string {
    if (jours <= 0) return 'bi-exclamation-octagon-fill';
    if (jours <= 7) return 'bi-exclamation-triangle-fill';
    if (jours <= 15) return 'bi-clock-fill';
    if (jours <= 30) return 'bi-hourglass-split';
    if (jours <= 60) return 'bi-calendar-check';
    return 'bi-check-circle';
  }

  getJoursText(jours: number): string {
    if (jours <= 0) return '⚠️ DÉPASSÉ';
    if (jours === 1) return `${jours} jour restant`;
    if (jours < 7) return `${jours} jours restants - URGENT !`;
    if (jours < 15) return `${jours} jours restants - À venir`;
    if (jours < 30) return `${jours} jours restants`;
    if (jours < 60) return `${jours} jours restants - OK`;
    if (jours < 180) return `${jours} jours restants - Planifié`;
    return `📅 ${jours} jours restants (${Math.round(jours/30)} mois)`;
  }

  openRappelDetails(rappel: RappelPoinconnage) {
    this.selectedRappel = rappel;
    this.showRappelModal = true;
    this.cdr.detectChanges();
  }

  closeRappelModal() {
    this.showRappelModal = false;
    this.selectedRappel = null;
    this.cdr.detectChanges();
  }

  genererRappels() {
    if (confirm('⚠️ Voulez-vous générer tous les rappels de poinçonnage ?')) {
      this.isGenerating = true;
      this.cdr.detectChanges();
      
      this.rappelService.genererTousLesRappels().subscribe({
        next: (response: any) => {
          console.log('✅ Rappels générés:', response);
          const message = response && response.message ? response.message : 'Rappels générés avec succès !';
          alert('✅ ' + message);
          this.isGenerating = false;
          this.loadRappels();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Erreur:', err);
          alert('❌ Erreur lors de la génération des rappels');
          this.isGenerating = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  marquerNotifie(rappel: RappelPoinconnage) {
    if (rappel.id) {
      this.rappelService.marquerNotifie(rappel.id).subscribe({
        next: (response: any) => {
          console.log('✅ Rappel notifié:', response);
          rappel.notifie = true;
          rappel.dateNotification = new Date().toISOString();
          this.cdr.detectChanges();
          alert('✅ Rappel marqué comme notifié');
        },
        error: (err) => {
          console.error('❌ Erreur:', err);
          alert('❌ Erreur lors du marquage');
        }
      });
    }
  }

  getProgressPercentage(joursRestants: number): number {
    const maxDays = 365;
    const progress = ((maxDays - Math.max(0, joursRestants)) / maxDays) * 100;
    return Math.min(100, Math.max(0, progress));
  }
}