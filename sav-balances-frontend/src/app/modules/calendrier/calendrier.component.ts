// src/app/modules/calendrier/calendrier.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ApiService, Intervention } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-calendrier',
  templateUrl: './calendrier.component.html',
  styleUrls: ['./calendrier.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule
  ]
})
export class CalendrierComponent implements OnInit {
  interventions: Intervention[] = [];
  filteredInterventions: Intervention[] = [];
  interventionsSansDate: Intervention[] = [];
  interventionsAvecDate: Intervention[] = [];
  loading = true;
  isAdmin = false;
  isTechnicien = false;
  isUser = false;
  currentUserNom: string = '';
  techniciens: User[] = [];
  
  // Modales
  showDetailsModal = false;
  showPlanificationModal = false;
  showConfirmationModal = false;
  
  selectedIntervention: Intervention | null = null;
  selectedDate: string = '';
  selectedTime: string = '';
  selectedTechnicien: string = '';
  
  // Variables pour la vérification de conflit
  conflictMessage: string = '';
  hasConflict: boolean = false;
  
  // Date minimum pour le template
  todayDate: string = new Date().toISOString().split('T')[0];
  
  // Filtres
  filterTechnicien = '';
  filterStatus = '';
  filterType = '';
  techniciensList: string[] = [];
  statusOptions = ['TOUS', 'EN_ATTENTE', 'CONFIRME', 'TERMINE', 'ANNULE'];
  typeOptions = ['TOUS', 'INTERNE', 'EXTERNE'];
  
  // Événements du calendrier
  calendarEvents: EventInput[] = [];
  
  // Options du calendrier
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    locale: 'fr',
    firstDay: 1,
    weekends: true,
    height: 'auto',
    selectable: false,
    selectMirror: true,
    eventClick: this.handleEventClick.bind(this),
    eventDidMount: this.handleEventDidMount.bind(this),
    businessHours: {
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '18:00'
    },
    slotMinTime: '08:00',
    slotMaxTime: '19:00',
    allDaySlot: false,
    nowIndicator: true,
    dayMaxEvents: true
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
    
    this.loadTechniciens();
    this.loadInterventions();
  }

  // ==================== CHARGEMENT DES TECHNICIENS ====================
  loadTechniciens() {
    this.userService.getTechniciensActifs().subscribe({
      next: (data) => {
        this.techniciens = data;
        this.techniciensList = data.map(t => t.fullName || t.username);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement techniciens:', err);
      }
    });
  }

  // ==================== CHARGEMENT DES INTERVENTIONS ====================
  loadInterventions() {
    this.loading = true;
    
    this.apiService.getInterventionsByType('EXTERNE').subscribe({
      next: (externeData) => {
        this.apiService.getInterventionsByType('INTERNE').subscribe({
          next: (interneData) => {
            const allData = [...externeData, ...interneData];
            
            const promises = allData.map(interv => {
              return this.apiService.getTransactionsByIntervention(interv.id!).toPromise()
                .then(transactions => {
                  const totalPaye = (transactions || [])
                    .filter(t => t.statut === 'VALIDE')
                    .reduce((sum, t) => sum + t.montant, 0);
                  
                  const montantTotal = interv.montantTotal || interv.prixEstime || 0;
                  const montantPaye = interv.montantPaye || totalPaye || 0;
                  
                  let currentStatut = interv.statutIntervention || 'EN_ATTENTE';
                  let nouveauStatut = currentStatut;
                  
                  if (currentStatut !== 'ANNULE') {
                    if (montantTotal > 0 && montantPaye >= montantTotal) {
                      nouveauStatut = 'TERMINE';
                    } else if (interv.dateOrdre && currentStatut !== 'TERMINE') {
                      nouveauStatut = 'CONFIRME';
                    }
                  }
                  
                  let statutPaiement = interv.statutPaiement || 'EN_ATTENTE';
                  if (montantTotal > 0) {
                    if (montantPaye >= montantTotal) {
                      statutPaiement = 'PAYE';
                    } else if (montantPaye > 0) {
                      statutPaiement = 'PARTIEL';
                    } else {
                      statutPaiement = 'EN_ATTENTE';
                    }
                  }
                  
                  return {
                    ...interv,
                    montantTotal: montantTotal,
                    montantPaye: montantPaye,
                    montantRestant: Math.max(0, montantTotal - montantPaye),
                    statutPaiement: statutPaiement,
                    statutIntervention: nouveauStatut,
                    transactions: transactions || []
                  };
                })
                .catch(() => {
                  const montantTotal = interv.montantTotal || interv.prixEstime || 0;
                  const montantPaye = interv.montantPaye || 0;
                  
                  let currentStatut = interv.statutIntervention || 'EN_ATTENTE';
                  let nouveauStatut = currentStatut;
                  
                  if (currentStatut !== 'ANNULE') {
                    if (montantTotal > 0 && montantPaye >= montantTotal) {
                      nouveauStatut = 'TERMINE';
                    } else if (interv.dateOrdre && currentStatut !== 'TERMINE') {
                      nouveauStatut = 'CONFIRME';
                    }
                  }
                  
                  return {
                    ...interv,
                    montantTotal: montantTotal,
                    montantPaye: montantPaye,
                    montantRestant: Math.max(0, montantTotal - montantPaye),
                    statutPaiement: interv.statutPaiement || 'EN_ATTENTE',
                    statutIntervention: nouveauStatut,
                    transactions: []
                  };
                });
            });
            
            Promise.all(promises).then(results => {
              // ===== FILTRAGE POUR TECHNICIEN =====
              let finalResults = results;
              if (this.isTechnicien && this.currentUserNom) {
                finalResults = results.filter(interv => 
                  interv.technicien === this.currentUserNom || 
                  interv.technicien === this.authService.getCurrentUser()?.username
                );
                console.log(`🔧 Technicien ${this.currentUserNom}: ${finalResults.length} interventions dans le calendrier`);
              }
              
              this.interventions = finalResults;
              this.filteredInterventions = [...this.interventions];
              this.updateLists();
              this.extractTechniciens();
              this.updateCalendarEvents();
              this.loading = false;
              this.cdr.detectChanges();
            });
          },
          error: () => {
            const promises = externeData.map(interv => {
              return this.apiService.getTransactionsByIntervention(interv.id!).toPromise()
                .then(transactions => {
                  const totalPaye = (transactions || [])
                    .filter(t => t.statut === 'VALIDE')
                    .reduce((sum, t) => sum + t.montant, 0);
                  
                  const montantTotal = interv.montantTotal || interv.prixEstime || 0;
                  const montantPaye = interv.montantPaye || totalPaye || 0;
                  
                  let currentStatut = interv.statutIntervention || 'EN_ATTENTE';
                  let nouveauStatut = currentStatut;
                  
                  if (currentStatut !== 'ANNULE') {
                    if (montantTotal > 0 && montantPaye >= montantTotal) {
                      nouveauStatut = 'TERMINE';
                    } else if (interv.dateOrdre && currentStatut !== 'TERMINE') {
                      nouveauStatut = 'CONFIRME';
                    }
                  }
                  
                  let statutPaiement = interv.statutPaiement || 'EN_ATTENTE';
                  if (montantTotal > 0) {
                    if (montantPaye >= montantTotal) {
                      statutPaiement = 'PAYE';
                    } else if (montantPaye > 0) {
                      statutPaiement = 'PARTIEL';
                    } else {
                      statutPaiement = 'EN_ATTENTE';
                    }
                  }
                  
                  return {
                    ...interv,
                    montantTotal: montantTotal,
                    montantPaye: montantPaye,
                    montantRestant: Math.max(0, montantTotal - montantPaye),
                    statutPaiement: statutPaiement,
                    statutIntervention: nouveauStatut,
                    transactions: transactions || []
                  };
                })
                .catch(() => {
                  const montantTotal = interv.montantTotal || interv.prixEstime || 0;
                  const montantPaye = interv.montantPaye || 0;
                  
                  let currentStatut = interv.statutIntervention || 'EN_ATTENTE';
                  let nouveauStatut = currentStatut;
                  
                  if (currentStatut !== 'ANNULE') {
                    if (montantTotal > 0 && montantPaye >= montantTotal) {
                      nouveauStatut = 'TERMINE';
                    } else if (interv.dateOrdre && currentStatut !== 'TERMINE') {
                      nouveauStatut = 'CONFIRME';
                    }
                  }
                  
                  return {
                    ...interv,
                    montantTotal: montantTotal,
                    montantPaye: montantPaye,
                    montantRestant: Math.max(0, montantTotal - montantPaye),
                    statutPaiement: interv.statutPaiement || 'EN_ATTENTE',
                    statutIntervention: nouveauStatut,
                    transactions: []
                  };
                });
            });
            
            Promise.all(promises).then(results => {
              let finalResults = results;
              if (this.isTechnicien && this.currentUserNom) {
                finalResults = results.filter(interv => 
                  interv.technicien === this.currentUserNom || 
                  interv.technicien === this.authService.getCurrentUser()?.username
                );
              }
              
              this.interventions = finalResults;
              this.filteredInterventions = [...this.interventions];
              this.updateLists();
              this.extractTechniciens();
              this.updateCalendarEvents();
              this.loading = false;
              this.cdr.detectChanges();
            });
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement interventions:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateLists() {
    this.interventionsSansDate = this.filteredInterventions.filter(i => 
      !i.dateOrdre && this.isInterventionPlanifiable(i)
    );
    this.interventionsAvecDate = this.filteredInterventions.filter(i => 
      i.dateOrdre
    );
  }

  extractTechniciens() {
    const techSet = new Set<string>();
    this.interventions.forEach(i => {
      if (i.technicien) {
        techSet.add(i.technicien);
      }
    });
    this.techniciensList = Array.from(techSet).sort();
  }

  // ===== VÉRIFICATION SI L'INTERVENTION EST PLANIFIABLE =====
  isInterventionPlanifiable(intervention: Intervention): boolean {
    return !intervention.dateOrdre && 
           intervention.statutIntervention === 'EN_ATTENTE' &&
           (this.isAdmin || this.isTechnicien || this.isUser);
  }

  // ===== CLIC SUR UNE INTERVENTION DANS LE CALENDRIER =====
  handleEventClick(clickInfo: EventClickArg) {
    const intervention = clickInfo.event.extendedProps['intervention'];
    if (intervention) {
      this.selectedIntervention = intervention;
      
      // Si l'intervention a déjà une date → Afficher les détails
      if (intervention.dateOrdre) {
        this.showDetailsModal = true;
      } 
      // Si l'intervention n'a pas de date et est planifiable → Ouvrir planification
      else if (this.isInterventionPlanifiable(intervention)) {
        this.ouvrirPlanification(intervention);
      }
      // Sinon → Afficher les détails
      else {
        this.showDetailsModal = true;
      }
      
      this.cdr.detectChanges();
    }
  }

  // ===== OUVRIR LA PLANIFICATION =====
  ouvrirPlanification(intervention: Intervention) {
    if (!this.isInterventionPlanifiable(intervention)) {
      if (intervention.statutIntervention === 'TERMINE') {
        alert('❌ Cette intervention est déjà terminée.');
      } else if (intervention.statutIntervention === 'ANNULE') {
        alert('❌ Cette intervention est annulée.');
      } else if (intervention.statutIntervention === 'CONFIRME') {
        alert('❌ Cette intervention est déjà en cours.');
      } else {
        alert('❌ Cette intervention ne peut pas être planifiée.');
      }
      return;
    }
    
    this.selectedIntervention = intervention;
    this.selectedDate = new Date().toISOString().split('T')[0];
    this.selectedTime = '09:00';
    this.conflictMessage = '';
    this.hasConflict = false;
    
    if (this.isTechnicien) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && this.techniciensList.includes(currentUser.fullName || '')) {
        this.selectedTechnicien = currentUser.fullName || '';
        this.checkConflictAndUpdate();
      }
    }
    
    this.showPlanificationModal = true;
    this.cdr.detectChanges();
  }

  // ===== PLANIFIER L'INTERVENTION =====
  planifierIntervention() {
    if (!this.selectedIntervention) {
      alert('❌ Veuillez sélectionner une intervention à planifier.');
      return;
    }

    if (!this.selectedDate) {
      alert('❌ Veuillez sélectionner une date.');
      return;
    }

    if (!this.selectedTechnicien) {
      alert('❌ Veuillez sélectionner un technicien.');
      return;
    }

    if (!this.isInterventionPlanifiable(this.selectedIntervention)) {
      alert('❌ Cette intervention ne peut plus être planifiée.');
      return;
    }

    const dateTime = new Date(`${this.selectedDate}T${this.selectedTime}`);
    const hasConflict = this.checkConflict(dateTime, this.selectedTechnicien);
    
    if (hasConflict) {
      if (!confirm('⚠️ Ce technicien a déjà une intervention à cette heure. Voulez-vous quand même planifier ?')) {
        return;
      }
    }

    const updated: Intervention = {
      ...this.selectedIntervention,
      dateOrdre: dateTime.toISOString(),
      technicien: this.selectedTechnicien,
      statutIntervention: 'CONFIRME'
    };

    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.updateIntervention(this.selectedIntervention.id!, updated).subscribe({
      next: () => {
        this.loadInterventions();
        this.loading = false;
        this.closePlanificationModal();
        alert('✅ Intervention planifiée avec succès !\n\n' +
              `📅 Date: ${this.formatDate(dateTime.toISOString())}\n` +
              `👨‍🔧 Technicien: ${this.selectedTechnicien}\n` +
              `📍 Adresse: ${this.selectedIntervention?.adresse || 'Non spécifiée'}\n` +
              `📌 Statut: CONFIRMÉ`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        alert('❌ Erreur lors de la planification: ' + (err.error?.message || err.message));
        this.cdr.detectChanges();
      }
    });
  }

  checkConflictAndUpdate(): void {
    if (this.selectedDate && this.selectedTime && this.selectedTechnicien) {
      const dateTime = new Date(`${this.selectedDate}T${this.selectedTime}`);
      this.hasConflict = this.checkConflict(dateTime, this.selectedTechnicien);
      this.conflictMessage = this.hasConflict 
        ? `⚠️ ${this.selectedTechnicien} a déjà une intervention à cette heure`
        : `✅ Ce créneau est disponible pour ${this.selectedTechnicien}`;
    } else {
      this.hasConflict = false;
      this.conflictMessage = '';
    }
    this.cdr.detectChanges();
  }

  onDateChange(): void {
    this.checkConflictAndUpdate();
  }

  onTimeChange(): void {
    this.checkConflictAndUpdate();
  }

  onTechnicienChange(): void {
    this.checkConflictAndUpdate();
  }

  checkConflict(dateTime: Date, technicien: string): boolean {
    const dateStr = dateTime.toISOString().split('T')[0];
    
    return this.filteredInterventions.some(i => {
      if (!i.dateOrdre || i.technicien !== technicien) return false;
      const existingDate = new Date(i.dateOrdre);
      const existingDateStr = existingDate.toISOString().split('T')[0];
      
      if (existingDateStr !== dateStr) return false;
      
      const diff = Math.abs(existingDate.getTime() - dateTime.getTime());
      return diff < 2 * 60 * 60 * 1000;
    });
  }

  handleEventDidMount(info: any) {
    const intervention = info.event.extendedProps['intervention'];
    if (intervention) {
      const statusLabels: {[key: string]: string} = {
        'EN_ATTENTE': '🔵 En attente',
        'CONFIRME': '🟡 En cours',
        'TERMINE': '🟢 Terminé',
        'ANNULE': '🔴 Annulé'
      };
      
      let tooltipText = `${intervention.numeroOrdre} - ${intervention.societe}\n`;
      tooltipText += `${intervention.reclamation}\n`;
      tooltipText += `📍 ${intervention.adresse || 'Adresse non spécifiée'}\n`;
      tooltipText += `👨‍🔧 Technicien: ${intervention.technicien || 'Non assigné'}\n`;
      tooltipText += `📌 Statut: ${statusLabels[intervention.statutIntervention || ''] || intervention.statutIntervention}`;
      
      if (!intervention.dateOrdre) {
        tooltipText += '\n⚠️ Non planifiée - Cliquez pour planifier';
      }
      
      info.el.title = tooltipText;
      
      if (!intervention.dateOrdre && this.isInterventionPlanifiable(intervention)) {
        info.el.style.border = '2px dashed #ffc107';
        info.el.style.animation = 'pulse 2s infinite';
      }
    }
  }

  applyFilters() {
    let filtered = [...this.interventions];
    
    if (this.filterTechnicien) {
      filtered = filtered.filter(i => i.technicien === this.filterTechnicien);
    }
    
    if (this.filterStatus && this.filterStatus !== 'TOUS') {
      filtered = filtered.filter(i => i.statutIntervention === this.filterStatus);
    }
    
    if (this.filterType && this.filterType !== 'TOUS') {
      filtered = filtered.filter(i => i.type === this.filterType);
    }
    
    this.filteredInterventions = filtered;
    this.updateLists();
    this.updateCalendarEvents();
  }

  filterByTechnicien() { this.applyFilters(); }
  filterByStatus() { this.applyFilters(); }
  filterByType() { this.applyFilters(); }

  updateCalendarEvents() {
    this.calendarEvents = this.filteredInterventions
      .filter(i => i.dateOrdre)
      .map(i => {
        let color = '#6c757d';
        let textColor = 'white';
        
        switch(i.statutIntervention) {
          case 'EN_ATTENTE':
            color = '#17a2b8';
            break;
          case 'CONFIRME':
            color = '#ffc107';
            textColor = 'black';
            break;
          case 'TERMINE':
            color = '#28a745';
            break;
          case 'ANNULE':
            color = '#dc3545';
            break;
          default:
            color = '#6c757d';
        }

        const typePrefix = i.type === 'INTERNE' ? '🏠' : '🌍';
        const title = `${typePrefix} ${i.numeroOrdre} - ${i.societe}`;

        return {
          id: i.id?.toString(),
          title: title,
          start: i.dateOrdre,
          backgroundColor: color,
          borderColor: color,
          textColor: textColor,
          extendedProps: {
            intervention: i,
            type: i.type,
            adresse: i.adresse
          }
        };
      });

    this.cdr.detectChanges();
  }

  resetFilters() {
    this.filterTechnicien = '';
    this.filterStatus = '';
    this.filterType = '';
    this.filteredInterventions = [...this.interventions];
    this.updateLists();
    this.updateCalendarEvents();
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedIntervention = null;
    this.cdr.detectChanges();
  }

  closePlanificationModal() {
    this.showPlanificationModal = false;
    this.selectedIntervention = null;
    this.selectedDate = '';
    this.selectedTime = '';
    this.selectedTechnicien = '';
    this.conflictMessage = '';
    this.hasConflict = false;
    this.cdr.detectChanges();
  }

  closeConfirmationModal() {
    this.showConfirmationModal = false;
    this.cdr.detectChanges();
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'Non définie';
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

  getStatusClass(statut?: string): string {
    if (!statut) return 'badge-secondary';
    const classes: {[key: string]: string} = {
      'EN_ATTENTE': 'badge-info',
      'CONFIRME': 'badge-warning',
      'TERMINE': 'badge-success',
      'ANNULE': 'badge-danger'
    };
    return classes[statut] || 'badge-secondary';
  }

  getStatusLabel(statut?: string): string {
    if (!statut) return 'Non défini';
    const labels: {[key: string]: string} = {
      'EN_ATTENTE': '🔵 En attente',
      'CONFIRME': '🟡 En cours',
      'TERMINE': '🟢 Terminé',
      'ANNULE': '🔴 Annulé'
    };
    return labels[statut] || statut;
  }

  getTypeLabel(type?: string): string {
    if (!type) return 'Non défini';
    return type === 'INTERNE' ? '🏠 Interne' : '🌍 Externe';
  }

  isEnAttente(intervention: Intervention): boolean {
    return intervention.statutIntervention === 'EN_ATTENTE' && !intervention.dateOrdre;
  }

  // ===== MÉTHODE POUR VÉRIFIER SI LE TECHNICIEN EST ASSIGNÉ =====
  isTechnicienAssigne(intervention: Intervention): boolean {
    if (!this.isTechnicien) return false;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return intervention.technicien === currentUser.fullName || 
           intervention.technicien === currentUser.username;
  }

  exportFormulaire(id: number) {
    this.apiService.exportFormulairePdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: (err) => {
        console.error('Erreur export PDF:', err);
      }
    });
  }
}