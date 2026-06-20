// src/app/modules/interventions-externes/interventions-externes.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService, Intervention, Client, Balance } from '../../core/services/api.service';
import { PrestationService } from '../../core/services/prestation.service';
import { Prestation } from '../../models/prestation.model';
import { 
  Transaction, 
  InterventionPaiement,
  StatutPaiement,
  getStatutLabel,
  getStatutClass,
  getPaymentProgress,
  calculateMontantRestant,
  getMethodeLabel
} from '../../models/transaction.model';

@Component({
  selector: 'app-interventions-externes',
  templateUrl: './interventions-externes.component.html',
  styleUrls: ['./interventions-externes.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule
  ]
})
export class InterventionsExternesComponent implements OnInit {
  interventions: InterventionPaiement[] = [];
  filteredInterventions: InterventionPaiement[] = [];
  clients: Client[] = [];
  balances: Balance[] = [];
  filteredClients: Client[] = [];
  prestations: Prestation[] = [];
  showForm = false;
  showDetailsModal = false;
  showPaymentModal = false;
  showStatusModal = false;  // ← NOUVEAU : Modal pour changer le statut
  isEditing = false;
  selectedIntervention: InterventionPaiement | null = null;
  interventionDetails: InterventionPaiement | null = null;
  interventionForm: FormGroup;
  paymentForm: FormGroup;
  statusForm: FormGroup;  // ← NOUVEAU
  loading = true;
  detailsLoading = false;
  private dataLoaded = false;
  searchTerm: string = '';
  searchInterventionsTerm: string = '';
  selectedBalanceId: number | null = null;
  prixCalcule: number = 0;
  
  balanceMap: Map<number, Balance> = new Map();
  
  // Helpers
  getStatutLabel = getStatutLabel;
  getStatutClass = getStatutClass;
  getPaymentProgress = getPaymentProgress;
  calculateMontantRestant = calculateMontantRestant;
  getMethodeLabel = getMethodeLabel;

  methodesPaiement = [
    { value: 'ESPECES', label: '💰 Espèces' },
    { value: 'CHEQUE', label: '📝 Chèque' },
    { value: 'VIREMENT', label: '🏦 Virement' },
    { value: 'CARTE', label: '💳 Carte' }
  ];

  // Statuts d'intervention (pour la modal de changement)
  statutsIntervention = [
    { value: 'EN_ATTENTE', label: '🔵 En attente' },
    { value: 'ANNULE', label: '🔴 Annulé' },
    { value: 'TERMINE', label: '🟢 Terminé' }
  ];

  // Helpers pour les statuts
  getStatutInterventionLabel(statut?: string): string {
    const labels: {[key: string]: string} = {
      'EN_ATTENTE': '🔵 En attente',
      'CONFIRME': '🟡 Confirmé',
      'ANNULE': '🔴 Annulé',
      'TERMINE': '🟢 Terminé'
    };
    return statut ? labels[statut] || statut : 'Non défini';
  }

  getStatutInterventionClass(statut?: string): string {
    const classes: {[key: string]: string} = {
      'EN_ATTENTE': 'badge-secondary',
      'CONFIRME': 'badge-warning',
      'ANNULE': 'badge-danger',
      'TERMINE': 'badge-success'
    };
    return statut ? classes[statut] || 'badge-secondary' : 'badge-secondary';
  }

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private prestationService: PrestationService
  ) {
    this.interventionForm = this.createForm();
    this.paymentForm = this.createPaymentForm();
    this.statusForm = this.createStatusForm();  // ← NOUVEAU
  }

  ngOnInit() {
    this.loadInterventions();
    this.loadClients();
    this.loadPrestations();
    this.loadBalances();
  }

  createForm(): FormGroup {
    return this.fb.group({
      numeroOrdre: [{ value: '', disabled: true }],
      type: [{ value: 'EXTERNE', disabled: true }],
      clientId: ['', Validators.required],
      societe: [{ value: '', disabled: true }],
      responsable: [{ value: '', disabled: true }],
      telephone: [{ value: '', disabled: true }],
      adresse: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      // ========== SAISIE MANUELLE ==========
      nomEquipement: ['', Validators.required],
      referenceEquipement: ['', Validators.required],
      typeReclamation: ['', Validators.required],
      technicien: [''],
      dateReclamation: [new Date().toISOString().slice(0, 16)],
      dateOrdre: [new Date().toISOString().slice(0, 16)],
      rapportIntervention: [''],
      prixEstime: [{ value: '', disabled: true }],
      prixReel: ['']
    });
  }

  createPaymentForm(): FormGroup {
    return this.fb.group({
      montant: ['', [Validators.required, Validators.min(0.01)]],
      methode: ['', Validators.required],
      reference: [''],
      notes: ['']
    });
  }

  // ========== NOUVEAU : Formulaire de statut ==========
  createStatusForm(): FormGroup {
    return this.fb.group({
      statut: ['', Validators.required],
      notes: ['']
    });
  }

  // ==================== MÉTHODE DE RECHERCHE ====================
  
  filterInterventions() {
    if (!this.searchInterventionsTerm || this.searchInterventionsTerm.trim() === '') {
      this.filteredInterventions = [...this.interventions];
      return;
    }

    const term = this.searchInterventionsTerm.toLowerCase().trim();
    this.filteredInterventions = this.interventions.filter(interv => {
      return (
        interv.numeroOrdre?.toLowerCase().includes(term) ||
        interv.societe?.toLowerCase().includes(term) ||
        interv.reclamation?.toLowerCase().includes(term) ||
        interv.technicien?.toLowerCase().includes(term) ||
        interv.bascule?.toLowerCase().includes(term) ||
        interv.reference?.toLowerCase().includes(term)
      );
    });
    this.cdr.detectChanges();
  }

  clearInterventionsSearch() {
    this.searchInterventionsTerm = '';
    this.filteredInterventions = [...this.interventions];
    this.cdr.detectChanges();
  }

  private convertToStatutPaiement(value: string | undefined): StatutPaiement | undefined {
    if (!value) return 'EN_ATTENTE';
    const validStatuses: StatutPaiement[] = ['EN_ATTENTE', 'PARTIEL', 'PAYE', 'EN_RETARD', 'ANNULE'];
    return validStatuses.includes(value as StatutPaiement) ? value as StatutPaiement : 'EN_ATTENTE';
  }

  loadInterventions() {
    if (this.dataLoaded) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.apiService.getInterventionsByType('EXTERNE').subscribe({
      next: (data) => {
        const promises = data.map(interv => {
          return this.apiService.getTransactionsByIntervention(interv.id!).toPromise()
            .then(transactions => {
              const totalPaye = (transactions || [])
                .filter(t => t.statut === 'VALIDE')
                .reduce((sum, t) => sum + t.montant, 0);
              
              const montantTotal = interv.montantTotal || interv.prixEstime || 0;
              const montantPaye = interv.montantPaye || totalPaye;
              const montantRestant = interv.montantRestant || (montantTotal - totalPaye);
              
              return {
                ...interv,
                montantTotal: montantTotal,
                montantPaye: montantPaye,
                montantRestant: montantRestant < 0 ? 0 : montantRestant,
                statutPaiement: this.convertToStatutPaiement(interv.statutPaiement || this.calculateStatut(montantTotal, totalPaye)),
                statutIntervention: interv.statutIntervention || 'EN_ATTENTE',
                transactions: transactions || []
              } as InterventionPaiement;
            })
            .catch(() => {
              const montantTotal = interv.montantTotal || interv.prixEstime || 0;
              return {
                ...interv,
                montantTotal: montantTotal,
                montantPaye: interv.montantPaye || 0,
                montantRestant: interv.montantRestant || montantTotal,
                statutPaiement: this.convertToStatutPaiement(interv.statutPaiement || 'EN_ATTENTE'),
                statutIntervention: interv.statutIntervention || 'EN_ATTENTE',
                transactions: []
              } as InterventionPaiement;
            });
        });
        
        Promise.all(promises).then(results => {
          this.interventions = results;
          this.filteredInterventions = [...results];
          this.loading = false;
          this.dataLoaded = true;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.interventions = [];
        this.filteredInterventions = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private calculateStatut(montantTotal: number, totalPaye: number): StatutPaiement {
    if (montantTotal === 0) return 'PAYE';
    if (totalPaye === 0) return 'EN_ATTENTE';
    if (totalPaye >= montantTotal) return 'PAYE';
    return 'PARTIEL';
  }

  loadClients() {
    this.apiService.getClients().subscribe({
      next: (data) => {
        this.clients = data || [];
        this.filteredClients = [...this.clients];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement clients:', err)
    });
  }

  loadPrestations() {
    this.prestationService.getPrestations().subscribe({
      next: (data) => {
        this.prestations = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement prestations:', err)
    });
  }

  loadBalances() {
    this.apiService.getBalances().subscribe({
      next: (data) => {
        this.balances = data || [];
        this.balanceMap = new Map();
        this.balances.forEach(balance => {
          if (balance.id) {
            this.balanceMap.set(balance.id, balance);
          }
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement balances:', err)
    });
  }

  // ==================== MÉTHODES DE BALANCE ====================

  getBalanceName(balanceId: number | undefined): string {
    if (!balanceId) return '-';
    const balance = this.balanceMap.get(balanceId);
    return balance ? balance.categorie || '-' : '-';
  }

  getBalanceReference(balanceId: number | undefined): string {
    if (!balanceId) return '-';
    const balance = this.balanceMap.get(balanceId);
    return balance ? balance.reference || '-' : '-';
  }

  getBalanceDisplay(balanceId: number | undefined): string {
    if (!balanceId) return '-';
    const balance = this.balanceMap.get(balanceId);
    return balance ? balance.categorie || balance.reference || '-' : '-';
  }

  // ==================== MÉTHODES DE FORMULAIRE ====================

  generateNumeroOrdre(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EXT-${random}`;
  }

  selectClient(client: Client) {
    this.interventionForm.patchValue({
      clientId: client.id,
      societe: client.societe,
      responsable: client.responsable,
      telephone: client.telephone,
      adresse: client.adresse,
      email: client.email
    });
    this.searchTerm = client.societe;
    this.filteredClients = [];
    this.cdr.detectChanges();
  }

  filterClients(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase();
    this.searchTerm = value;
    
    if (value.length > 0) {
      this.filteredClients = this.clients.filter(client => 
        client.societe.toLowerCase().includes(value) || 
        client.responsable?.toLowerCase().includes(value)
      );
    } else {
      this.filteredClients = [];
    }
    this.cdr.detectChanges();
  }

  // ==================== MÉTHODES STATUT ====================

  openStatusModal(intervention: InterventionPaiement | null) {
    if (!intervention) return;
    this.selectedIntervention = intervention;
    this.statusForm.reset({
      statut: intervention.statutIntervention || 'EN_ATTENTE',
      notes: ''
    });
    this.showStatusModal = true;
    this.cdr.detectChanges();
  }

  closeStatusModal() {
    this.showStatusModal = false;
    this.selectedIntervention = null;
    this.cdr.detectChanges();
  }

  saveStatus() {
    if (this.statusForm.invalid) {
      alert('Veuillez sélectionner un statut');
      return;
    }

    if (!this.selectedIntervention || !this.selectedIntervention.id) return;

    const formValue = this.statusForm.value;
    const updatedIntervention: any = {
      statutIntervention: formValue.statut,
      rapportIntervention: formValue.notes || 'Statut modifié manuellement'
    };

    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.updateIntervention(this.selectedIntervention.id, updatedIntervention).subscribe({
      next: () => {
        this.dataLoaded = false;
        this.loadInterventions();
        this.loading = false;
        this.closeStatusModal();
        alert('✅ Statut mis à jour avec succès');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('❌ Erreur lors de la mise à jour du statut');
      }
    });
  }

  // ==================== MÉTHODES PAIEMENT ====================

  openPaymentModal(intervention: InterventionPaiement | null) {
    if (!intervention) return;
    this.selectedIntervention = intervention;
    this.paymentForm.reset({
      montant: '',
      methode: '',
      reference: '',
      notes: ''
    });
    this.showPaymentModal = true;
    this.cdr.detectChanges();
  }

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedIntervention = null;
    this.cdr.detectChanges();
  }

savePayment() {
  if (this.paymentForm.invalid) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }

  if (!this.selectedIntervention || !this.selectedIntervention.id) return;

  const formValue = this.paymentForm.value;
  const transaction: Transaction = {
    montant: formValue.montant,
    methode: formValue.methode,
    reference: formValue.reference || '',
    notes: formValue.notes || '',
    statut: 'VALIDE',
    dateTransaction: new Date().toISOString()
  };

  this.loading = true;
  this.cdr.detectChanges();

  this.apiService.ajouterPaiement(this.selectedIntervention.id, transaction).subscribe({
    next: () => {
      // ✅ Récupérer l'intervention complète mise à jour
      this.apiService.getIntervention(this.selectedIntervention!.id!).subscribe({
        next: (intervention) => {
          const montantRestant = intervention.montantRestant ?? 0;
          const montantTotal = intervention.montantTotal ?? 0;
          
          if (montantTotal > 0 && montantRestant <= 0) {
            // ✅ Mettre à jour avec l'intervention complète et cast de type
            const updatedIntervention: Intervention = {
              ...intervention,
              statutIntervention: 'TERMINE' as 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE',  // ← Cast de type
              rapportIntervention: 'Intervention terminée - paiement complet'
            };
            
            this.apiService.updateIntervention(this.selectedIntervention!.id!, updatedIntervention).subscribe({
              next: () => {
                this.dataLoaded = false;
                this.loadInterventions();
                this.loading = false;
                this.closePaymentModal();
                alert('✅ Paiement enregistré et intervention marquée comme terminée');
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error('Erreur mise à jour statut:', err);
                this.loading = false;
                this.closePaymentModal();
                alert('✅ Paiement enregistré avec succès');
                this.cdr.detectChanges();
              }
            });
          } else {
            this.loading = false;
            this.closePaymentModal();
            alert('✅ Paiement enregistré avec succès');
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Erreur récupération intervention:', err);
          this.loading = false;
          this.closePaymentModal();
          this.dataLoaded = false;
          this.loadInterventions();
          alert('✅ Paiement enregistré avec succès');
          this.cdr.detectChanges();
        }
      });
    },
    error: (err) => {
      console.error('Erreur:', err);
      this.loading = false;
      this.cdr.detectChanges();
      alert('❌ Erreur: ' + (err.error || 'Impossible d\'enregistrer le paiement'));
    }
  });
}

  loadTransactions(interventionId: number) {
    this.apiService.getTransactionsByIntervention(interventionId).subscribe({
      next: (transactions) => {
        if (this.interventionDetails) {
          this.interventionDetails.transactions = transactions;
          
          const totalPaye = transactions
            .filter(t => t.statut === 'VALIDE')
            .reduce((sum, t) => sum + t.montant, 0);
          
          const montantTotal = this.interventionDetails.montantTotal || 
                              this.interventionDetails.prixEstime || 0;
          
          this.interventionDetails.montantPaye = totalPaye;
          this.interventionDetails.montantRestant = Math.max(0, montantTotal - totalPaye);
          
          this.interventionDetails.statutPaiement = this.convertToStatutPaiement(
            this.calculateStatut(montantTotal, totalPaye)
          );
          
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erreur chargement transactions:', err)
    });
  }

  getMontantRestant(intervention: InterventionPaiement | null): number {
    if (!intervention) return 0;
    const total = intervention.montantTotal || intervention.prixEstime || 0;
    const paye = intervention.montantPaye || 0;
    return Math.max(0, total - paye);
  }

  // ==================== MÉTHODES DE MODAL ====================

  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.selectedIntervention = null;
    this.searchTerm = '';
    this.filteredClients = [];
    this.selectedBalanceId = null;
    this.prixCalcule = 0;
    
    const newNumeroOrdre = this.generateNumeroOrdre();
    
    this.interventionForm.reset({
      numeroOrdre: newNumeroOrdre,
      type: 'EXTERNE',
      clientId: '',
      societe: '',
      responsable: '',
      telephone: '',
      adresse: '',
      email: '',
      nomEquipement: '',
      referenceEquipement: '',
      typeReclamation: '',
      technicien: '',
      dateReclamation: new Date().toISOString().slice(0, 16),
      dateOrdre: new Date().toISOString().slice(0, 16),
      rapportIntervention: '',
      prixEstime: '',
      prixReel: ''
    });
    this.cdr.detectChanges();
  }

  closeForm() {
    this.showForm = false;
    this.interventionForm.reset();
    this.filteredClients = [];
    this.searchTerm = '';
    this.selectedBalanceId = null;
    this.prixCalcule = 0;
    this.cdr.detectChanges();
  }

  viewInterventionDetails(intervention: InterventionPaiement) {
    this.detailsLoading = true;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
    
    this.apiService.getIntervention(intervention.id!).subscribe({
      next: (data) => {
        this.interventionDetails = {
          ...data,
          montantTotal: data.montantTotal || data.prixEstime || 0,
          montantPaye: data.montantPaye || 0,
          montantRestant: data.montantRestant || 0,
          statutPaiement: this.convertToStatutPaiement(data.statutPaiement || 'EN_ATTENTE'),
          statutIntervention: data.statutIntervention || 'EN_ATTENTE'
        };
        if (intervention.id) {
          this.loadTransactions(intervention.id);
        }
        this.detailsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement détails:', err);
        this.detailsLoading = false;
        this.cdr.detectChanges();
        alert('Erreur lors du chargement des détails');
      }
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.interventionDetails = null;
    this.cdr.detectChanges();
  }

  editIntervention(intervention: InterventionPaiement) {
    this.isEditing = true;
    this.selectedIntervention = intervention;
    
    const client = this.clients.find(c => c.societe === intervention.societe);
    
    this.interventionForm.patchValue({
      numeroOrdre: intervention.numeroOrdre,
      type: 'EXTERNE',
      clientId: client?.id,
      societe: intervention.societe,
      responsable: intervention.responsable,
      telephone: intervention.telephone,
      adresse: intervention.adresse,
      email: intervention.email,
      nomEquipement: intervention.bascule || '',
      referenceEquipement: intervention.reference || '',
      typeReclamation: intervention.reclamation || '',
      technicien: intervention.technicien,
      dateReclamation: intervention.dateReclamation?.slice(0, 16),
      dateOrdre: intervention.dateOrdre?.slice(0, 16),
      rapportIntervention: intervention.rapportIntervention,
      prixEstime: intervention.prixEstime,
      prixReel: intervention.prixReel
    });
    this.searchTerm = intervention.societe;
    this.showForm = true;
    this.cdr.detectChanges();
  }

  saveIntervention() {
    if (this.interventionForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.interventionForm.getRawValue();
    const intervention: Intervention = {
      numeroOrdre: formValue.numeroOrdre,
      type: 'EXTERNE',
      societe: formValue.societe,
      bascule: formValue.nomEquipement,
      reference: formValue.referenceEquipement,
      responsable: formValue.responsable,
      adresse: formValue.adresse,
      telephone: formValue.telephone,
      email: formValue.email,
      reclamation: formValue.typeReclamation,
      technicien: formValue.technicien,
      dateReclamation: formValue.dateReclamation,
      dateOrdre: formValue.dateOrdre,
      rapportIntervention: formValue.rapportIntervention,
      prixEstime: this.prixCalcule,
      prixReel: formValue.prixReel,
      statutIntervention: 'EN_ATTENTE',  // ← STATUT INITIALISÉ À EN_ATTENTE
      montantTotal: this.prixCalcule || 0,
      montantPaye: 0,
      montantRestant: this.prixCalcule || 0,
      statutPaiement: 'EN_ATTENTE'
    };

    this.loading = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.selectedIntervention) {
      this.apiService.updateIntervention(this.selectedIntervention.id!, intervention).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          this.closeForm();
          alert('Intervention modifiée avec succès');
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la modification');
        }
      });
    } else {
      this.apiService.createIntervention(intervention).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          this.closeForm();
          alert('Intervention créée avec succès');
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la création');
        }
      });
    }
  }

  deleteIntervention(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      this.loading = true;
      this.cdr.detectChanges();
      
      this.apiService.deleteIntervention(id).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          alert('Intervention supprimée');
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  exportFormulaire(id: number) {
    this.apiService.exportFormulairePdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `formulaire_intervention_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('✅ Formulaire PDF téléchargé avec succès');
      },
      error: (err) => {
        console.error('Erreur export:', err);
        alert('❌ Erreur lors de l\'export du PDF');
      }
    });
  }

  refresh() {
    this.dataLoaded = false;
    this.loadInterventions();
    this.loadPrestations();
    this.loadBalances();
  }
  
  formatDate(date: string | undefined | null): string {
    if (!date) return 'Non renseigné';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Date invalide';
    }
  }

  refreshIntervention(interventionId: number): void {
    this.apiService.getIntervention(interventionId).subscribe({
      next: (updatedIntervention) => {
        const index = this.interventions.findIndex(i => i.id === updatedIntervention.id);
        if (index !== -1) {
          this.interventions[index] = {
            ...updatedIntervention,
            montantTotal: updatedIntervention.montantTotal || updatedIntervention.prixEstime || 0,
            montantPaye: updatedIntervention.montantPaye || 0,
            montantRestant: updatedIntervention.montantRestant || 0,
            statutPaiement: this.convertToStatutPaiement(updatedIntervention.statutPaiement || 'EN_ATTENTE'),
            statutIntervention: updatedIntervention.statutIntervention || 'EN_ATTENTE'
          };
          this.filteredInterventions = [...this.interventions];
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erreur refresh:', err)
    });
  }
}