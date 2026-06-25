// src/app/modules/interventions-externes/interventions-externes.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService, Intervention, Client, Balance } from '../../core/services/api.service';
import { PrestationService } from '../../core/services/prestation.service';
import { Prestation } from '../../models/prestation.model';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/user.model';
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

type StatutIntervention = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';

const STATUT_INTERVENTION_LABELS: {[key: string]: string} = {
  'EN_ATTENTE': '🔵 En attente',
  'CONFIRME': '🟡 En cours',
  'ANNULE': '🔴 Annulé',
  'TERMINE': '🟢 Terminé'
};

const STATUT_INTERVENTION_CLASSES: {[key: string]: string} = {
  'EN_ATTENTE': 'badge-secondary',
  'CONFIRME': 'badge-warning',
  'ANNULE': 'badge-danger',
  'TERMINE': 'badge-success'
};

function getStatutInterventionLabel(statut?: string): string {
  if (!statut) return 'Non défini';
  return STATUT_INTERVENTION_LABELS[statut] || statut;
}

function getStatutInterventionClass(statut?: string): string {
  if (!statut) return 'badge-secondary';
  return STATUT_INTERVENTION_CLASSES[statut] || 'badge-secondary';
}

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
  techniciens: User[] = [];
  showForm = false;
  showDetailsModal = false;
  showPaymentModal = false;
  showDateModal = false;
  isEditing = false;
  selectedIntervention: InterventionPaiement | null = null;
  interventionDetails: InterventionPaiement | null = null;
  interventionForm: FormGroup;
  paymentForm: FormGroup;
  dateForm: FormGroup;
  loading = true;
  detailsLoading = false;
  private dataLoaded = false;
  searchTerm: string = '';
  searchInterventionsTerm: string = '';
  selectedPrestationId: number | null = null;
  selectedBalanceId: number | null = null;
  prixCalcule: number = 0;
  showPdfViewer = false;
  pdfUrl: string | null = null;
  
  balanceMap: Map<number, Balance> = new Map();
  isAdmin: boolean = false;
  isTechnicien: boolean = false;
  currentUserNom: string = '';

  // ===== MODALES D'ALERTE =====
  showSuccessModal = false;
  showErrorModal = false;
  showInfoModal = false;
  showConfirmDeleteModal = false;
  showConfirmAnnulerModal = false;
  alertMessage = '';
  private pendingDeleteId: number | null = null;
  private pendingAnnulerIntervention: InterventionPaiement | null = null;

  // Helpers
  getStatutLabel = getStatutLabel;
  getStatutClass = getStatutClass;
  getPaymentProgress = getPaymentProgress;
  calculateMontantRestant = calculateMontantRestant;
  getMethodeLabel = getMethodeLabel;
  getStatutInterventionLabel = getStatutInterventionLabel;
  getStatutInterventionClass = getStatutInterventionClass;

  methodesPaiement = [
    { value: 'ESPECES', label: '💰 Espèces' },
    { value: 'CHEQUE', label: '📝 Chèque' },
    { value: 'VIREMENT', label: '🏦 Virement' },
    { value: 'CARTE', label: '💳 Carte' }
  ];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private prestationService: PrestationService,
    private userService: UserService
  ) {
    this.interventionForm = this.createForm();
    this.paymentForm = this.createPaymentForm();
    this.dateForm = this.createDateForm();
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.isTechnicien = this.authService.isTechnicien();
    
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.currentUserNom = currentUser.fullName || currentUser.username;
    }
    
    this.loadTechniciens();
    this.loadInterventions();
    this.loadClients();
    this.loadPrestations();
    this.loadBalances();
  }

  createForm(): FormGroup {
    return this.fb.group({
      numeroOrdre: [{ value: '', disabled: true }],
      clientId: ['', Validators.required],
      societe: [{ value: '', disabled: true }],
      responsable: [{ value: '', disabled: true }],
      telephone: [{ value: '', disabled: true }],
      adresse: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      nomEquipement: ['', Validators.required],
      referenceEquipement: [''],
      typeReclamation: ['', Validators.required],
      technicien: [''],
      dateReclamation: [new Date().toISOString().slice(0, 16)],
      dateIntervention: [{ value: '', disabled: true }],
      rapportIntervention: ['']
    });
  }

  createPaymentForm(): FormGroup {
    return this.fb.group({
      montant: ['', [Validators.required, Validators.min(0.01)]],
      methode: ['', Validators.required],
      notes: [''],
      remise: [0],
      promoCode: ['']
    });
  }

  createDateForm(): FormGroup {
    return this.fb.group({
      dateIntervention: ['', Validators.required]
    });
  }

  // ==================== CHARGEMENT DES TECHNICIENS ====================
  loadTechniciens() {
    this.userService.getTechniciensActifs().subscribe({
      next: (data) => {
        this.techniciens = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement techniciens:', err);
      }
    });
  }

  // ==================== MODALES D'ALERTE ====================
  
  showSuccess(message: string) {
    this.alertMessage = message;
    this.showSuccessModal = true;
    this.cdr.detectChanges();
  }

  showError(message: string) {
    this.alertMessage = message;
    this.showErrorModal = true;
    this.cdr.detectChanges();
  }

  showInfo(message: string) {
    this.alertMessage = message;
    this.showInfoModal = true;
    this.cdr.detectChanges();
  }

  closeAlertModals() {
    this.showSuccessModal = false;
    this.showErrorModal = false;
    this.showInfoModal = false;
    this.alertMessage = '';
    this.cdr.detectChanges();
  }

  // ===== CONFIRMATION SUPPRESSION =====
  openConfirmDeleteModal(id: number) {
    this.pendingDeleteId = id;
    this.showConfirmDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeConfirmDeleteModal() {
    this.showConfirmDeleteModal = false;
    this.pendingDeleteId = null;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (this.pendingDeleteId !== null) {
      this.deleteIntervention(this.pendingDeleteId);
    }
    this.closeConfirmDeleteModal();
  }

  // ===== CONFIRMATION ANNULATION =====
  openConfirmAnnulerModal(intervention: InterventionPaiement) {
    this.pendingAnnulerIntervention = intervention;
    this.showConfirmAnnulerModal = true;
    this.cdr.detectChanges();
  }

  closeConfirmAnnulerModal() {
    this.showConfirmAnnulerModal = false;
    this.pendingAnnulerIntervention = null;
    this.cdr.detectChanges();
  }

  confirmAnnuler() {
    if (this.pendingAnnulerIntervention) {
      this.annulerIntervention(this.pendingAnnulerIntervention);
    }
    this.closeConfirmAnnulerModal();
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

  // ==================== CONVERSION DE STATUT ====================
  
  private convertToStatutPaiement(value: string | undefined): StatutPaiement | undefined {
    if (!value) return 'EN_ATTENTE';
    const validStatuses: StatutPaiement[] = ['EN_ATTENTE', 'PARTIEL', 'PAYE', 'EN_RETARD', 'ANNULE'];
    return validStatuses.includes(value as StatutPaiement) ? value as StatutPaiement : 'EN_ATTENTE';
  }

  private convertToStatutIntervention(value: string | undefined): StatutIntervention {
    if (!value) return 'EN_ATTENTE';
    const validStatuses: StatutIntervention[] = ['EN_ATTENTE', 'CONFIRME', 'ANNULE', 'TERMINE'];
    return validStatuses.includes(value as StatutIntervention) ? value as StatutIntervention : 'EN_ATTENTE';
  }

  // ==================== CHARGEMENT DES DONNÉES ====================
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
              
              const montantTotal = interv.montantTotal || 0;
              const montantPaye = interv.montantPaye || totalPaye || 0;
              
              // ===== LOGIQUE DE STATUT UNIFIÉE =====
              let currentStatut = interv.statutIntervention || 'EN_ATTENTE';
              let nouveauStatut = currentStatut;
              
              // Règle 1: Si ANNULE → garder ANNULE (priorité absolue)
              if (currentStatut === 'ANNULE') {
                nouveauStatut = 'ANNULE';
              }
              // Règle 2: Si paiement complet → TERMINE
              else if (montantTotal > 0 && montantPaye >= montantTotal) {
                nouveauStatut = 'TERMINE';
              }
              // Règle 3: Si date définie → CONFIRME
              else if (interv.dateOrdre) {
                nouveauStatut = 'CONFIRME';
              }
              // Règle 4: Sinon → EN_ATTENTE
              else {
                nouveauStatut = 'EN_ATTENTE';
              }
              
              // Statut de paiement
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
                statutPaiement: this.convertToStatutPaiement(statutPaiement),
                statutIntervention: this.convertToStatutIntervention(nouveauStatut),
                transactions: transactions || []
              } as InterventionPaiement;
            })
            .catch(() => {
              const montantTotal = interv.montantTotal || 0;
              const montantPaye = interv.montantPaye || 0;
              
              let currentStatut = interv.statutIntervention || 'EN_ATTENTE';
              let nouveauStatut = currentStatut;
              
              if (currentStatut === 'ANNULE') {
                nouveauStatut = 'ANNULE';
              } else if (montantTotal > 0 && montantPaye >= montantTotal) {
                nouveauStatut = 'TERMINE';
              } else if (interv.dateOrdre) {
                nouveauStatut = 'CONFIRME';
              } else {
                nouveauStatut = 'EN_ATTENTE';
              }
              
              return {
                ...interv,
                montantTotal: montantTotal,
                montantPaye: montantPaye,
                statutPaiement: this.convertToStatutPaiement(interv.statutPaiement || 'EN_ATTENTE'),
                statutIntervention: this.convertToStatutIntervention(nouveauStatut),
                transactions: []
              } as InterventionPaiement;
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
            console.log(`🔧 Technicien ${this.currentUserNom}: ${finalResults.length} interventions trouvées`);
          }
          
          this.interventions = finalResults;
          this.filteredInterventions = [...finalResults];
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
        this.showError('Erreur lors du chargement des interventions');
      }
    });
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

  getBalanceDetails(balanceId: number | undefined): string {
    if (!balanceId) return '-';
    const balance = this.balanceMap.get(balanceId);
    if (!balance) return '-';
    return `${balance.reference} - ${balance.categorie} (${balance.prix} DT)`;
  }

  getBalanceDisplay(balanceId: number | undefined): string {
    if (!balanceId) return '-';
    const balance = this.balanceMap.get(balanceId);
    return balance ? balance.categorie || balance.reference || '-' : '-';
  }

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

  // ==================== PAIEMENT ====================

  openPaymentModal(intervention: InterventionPaiement | null) {
    if (!intervention) return;
    
    if (intervention.statutIntervention === 'TERMINE') {
      this.showInfo('✅ Cette intervention est déjà terminée et entièrement payée');
      return;
    }
    
    if (intervention.statutIntervention === 'ANNULE') {
      this.showError('❌ Impossible d\'ajouter un paiement sur une intervention annulée');
      return;
    }
    
    const montantTotal = intervention.montantTotal || 0;
    const montantPaye = intervention.montantPaye || 0;
    const montantRestant = Math.max(0, montantTotal - montantPaye);
    
    if (montantTotal > 0 && montantRestant <= 0) {
      this.showInfo('✅ Cette intervention est déjà entièrement payée');
      return;
    }
    
    this.selectedIntervention = intervention;
    
    let montantParDefaut = '';
    if (montantTotal > 0 && montantRestant > 0) {
      montantParDefaut = montantRestant.toString();
    }
    
    this.paymentForm.reset({
      montant: montantParDefaut,
      methode: '',
      notes: '',
      remise: 0,
      promoCode: ''
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
    // Vérifier si le formulaire est valide
    if (this.paymentForm.invalid) {
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Vérifier qu'une intervention est sélectionnée
    if (!this.selectedIntervention || !this.selectedIntervention.id) {
      this.showError('Aucune intervention sélectionnée');
      return;
    }

    // Vérifier que l'intervention n'est pas déjà terminée
    if (this.selectedIntervention.statutIntervention === 'TERMINE') {
      this.showInfo('✅ Cette intervention est déjà terminée');
      this.closePaymentModal();
      return;
    }

    // Récupérer les valeurs du formulaire
    const formValue = this.paymentForm.value;
    const montant = formValue.montant;
    const remise = formValue.remise || 0;
    const promoCode = formValue.promoCode || '';
    const montantFinal = Math.max(0, montant - remise);

    // Vérifier que le montant final est valide
    if (montantFinal <= 0) {
      this.showError('❌ Le montant doit être supérieur à 0');
      return;
    }

    // Calculer le reste à payer
    const montantTotal = this.selectedIntervention.montantTotal || 0;
    const montantPaye = this.selectedIntervention.montantPaye || 0;
    const montantRestant = Math.max(0, montantTotal - montantPaye);

    // Vérifier que le montant ne dépasse pas le reste à payer
    if (montantTotal > 0 && montantFinal > montantRestant) {
      this.showError(`❌ Le montant (${montantFinal} DT) dépasse le reste à payer (${montantRestant} DT)`);
      return;
    }

    // Créer l'objet transaction
    const transaction: Transaction = {
      montant: montantFinal,
      methode: formValue.methode,
      reference: '',
      notes: formValue.notes || '',
      statut: 'VALIDE',
      dateTransaction: new Date().toISOString(),
      remise: remise,
      promoCode: promoCode,
      interventionId: this.selectedIntervention.id
    };

    // Afficher le loader
    this.loading = true;
    this.cdr.detectChanges();

    // 1. Envoyer le paiement
    this.apiService.ajouterPaiement(this.selectedIntervention.id, transaction).subscribe({
      next: (response) => {
        console.log('✅ Paiement enregistré:', response);
        
        // 2. Rafraîchir l'intervention pour mettre à jour les statuts
        this.apiService.refreshIntervention(this.selectedIntervention!.id!).subscribe({
          next: (refreshed) => {
            console.log('✅ Intervention rafraîchie:', refreshed);
            
            // 3. Recharger toutes les interventions
            this.dataLoaded = false;
            this.loadInterventions();
            this.loading = false;
            this.closePaymentModal();
            this.showSuccess('✅ Paiement enregistré avec succès !\n\n' +
                            `💳 Montant: ${montantFinal} DT\n` +
                            `📌 Méthode: ${this.getMethodeLabel(formValue.methode)}\n` +
                            `📊 Statut: ${refreshed.statutIntervention === 'TERMINE' ? '🟢 Terminée' : '🟡 En cours'}`);
            this.cdr.detectChanges();
          },
          error: (refreshErr) => {
            console.error('❌ Erreur refresh:', refreshErr);
            // Même si le refresh échoue, on recharge les données
            this.dataLoaded = false;
            this.loadInterventions();
            this.loading = false;
            this.closePaymentModal();
            this.showSuccess('✅ Paiement enregistré avec succès');
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('❌ Erreur paiement:', err);
        this.loading = false;
        this.cdr.detectChanges();
        
        let errorMsg = 'Impossible d\'enregistrer le paiement';
        if (err.error && typeof err.error === 'string') {
          errorMsg = err.error;
        } else if (err.error && err.error.message) {
          errorMsg = err.error.message;
        }
        this.showError('❌ Erreur: ' + errorMsg);
      }
    });
  }

  getMontantRestant(intervention: InterventionPaiement | null): number {
    if (!intervention) return 0;
    const total = intervention.montantTotal || 0;
    const paye = intervention.montantPaye || 0;
    return Math.max(0, total - paye);
  }

  loadTransactions(interventionId: number) {
    this.apiService.getTransactionsByIntervention(interventionId).subscribe({
      next: (transactions) => {
        if (this.interventionDetails) {
          this.interventionDetails.transactions = transactions;
          
          const totalPaye = transactions
            .filter(t => t.statut === 'VALIDE')
            .reduce((sum, t) => sum + t.montant, 0);
          
          const montantTotal = this.interventionDetails.montantTotal || 0;
          
          this.interventionDetails.montantPaye = totalPaye;
          this.interventionDetails.montantTotal = montantTotal;
          
          this.interventionDetails.statutPaiement = this.convertToStatutPaiement(
            this.calculateStatut(montantTotal, totalPaye)
          );
          
          if (montantTotal > 0 && totalPaye >= montantTotal && this.interventionDetails.statutIntervention !== 'ANNULE') {
            this.interventionDetails.statutIntervention = 'TERMINE';
          }
          
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erreur chargement transactions:', err)
    });
  }

  private calculateStatut(montantTotal: number, totalPaye: number): string {
    const total = montantTotal || 0;
    const paye = totalPaye || 0;
    
    if (total === 0) return 'EN_ATTENTE';
    if (paye === 0) return 'EN_ATTENTE';
    if (paye >= total) return 'PAYE';
    return 'PARTIEL';
  }

  // ==================== FORMULAIRE ====================

 openForm() {
  this.showForm = true;
  this.isEditing = false;
  this.selectedIntervention = null;
  this.searchTerm = '';
  this.filteredClients = [];
  this.selectedPrestationId = null;
  this.selectedBalanceId = null;
  this.prixCalcule = 0;
  
  const newNumeroOrdre = this.generateNumeroOrdre();
  
  this.interventionForm.reset({
    numeroOrdre: newNumeroOrdre,
    clientId: '',
    societe: '',
    responsable: '',
    telephone: '',
    adresse: '',
    email: '',
    nomEquipement: '',
    referenceEquipement: '',
    typeReclamation: '',
    technicien: '',  // ← S'assurer que c'est bien vide
    dateReclamation: new Date().toISOString().slice(0, 16),
    dateIntervention: '',
    rapportIntervention: ''
  });
  
  this.interventionForm.get('dateIntervention')?.disable();
  
  // === AJOUT : Recharger les techniciens à chaque ouverture ===
  this.loadTechniciens();
  
  this.cdr.detectChanges();
}

  closeForm() {
    this.showForm = false;
    this.interventionForm.reset();
    this.filteredClients = [];
    this.searchTerm = '';
    this.selectedPrestationId = null;
    this.selectedBalanceId = null;
    this.prixCalcule = 0;
    this.cdr.detectChanges();
  }

  // ==================== DÉTAILS ====================

  viewInterventionDetails(intervention: InterventionPaiement) {
    this.detailsLoading = true;
    this.showDetailsModal = true;
    this.cdr.detectChanges();
    
    this.apiService.getIntervention(intervention.id!).subscribe({
      next: (data) => {
        const montantTotal = data.montantTotal || 0;
        const montantPaye = data.montantPaye || 0;
        
        let statutIntervention = this.convertToStatutIntervention(data.statutIntervention || 'EN_ATTENTE');
        
        if (data.dateOrdre && statutIntervention !== 'ANNULE' && statutIntervention !== 'TERMINE') {
          statutIntervention = 'CONFIRME';
        }
        
        this.interventionDetails = {
          ...data,
          montantTotal: montantTotal,
          montantPaye: montantPaye,
          statutPaiement: this.convertToStatutPaiement(
            data.statutPaiement || this.calculateStatut(montantTotal, montantPaye)
          ),
          statutIntervention: statutIntervention
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
        this.showError('Erreur lors du chargement des détails');
      }
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.interventionDetails = null;
    this.cdr.detectChanges();
  }

  // ==================== DATE ====================

  openDateModal(intervention: InterventionPaiement) {
    if (intervention.statutIntervention === 'ANNULE') {
      this.showError('❌ Impossible de modifier une intervention annulée');
      return;
    }
    
    if (intervention.dateOrdre) {
      this.showInfo('⚠️ Une date d\'intervention est déjà définie');
      return;
    }
    
    this.selectedIntervention = intervention;
    this.dateForm.reset({
      dateIntervention: new Date().toISOString().slice(0, 16)
    });
    this.showDateModal = true;
    this.cdr.detectChanges();
  }

  closeDateModal() {
    this.showDateModal = false;
    this.selectedIntervention = null;
    this.dateForm.reset();
    this.cdr.detectChanges();
  }

  saveDate() {
    if (this.dateForm.invalid) {
      this.showError('Veuillez sélectionner une date');
      return;
    }

    if (!this.selectedIntervention || !this.selectedIntervention.id) return;

    const formValue = this.dateForm.value;
    const dateInput = formValue.dateIntervention;

    const updated: Intervention = {
      ...this.selectedIntervention,
      dateOrdre: dateInput,
      statutIntervention: 'CONFIRME'
    };

    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.updateIntervention(this.selectedIntervention.id, updated).subscribe({
      next: () => {
        this.dataLoaded = false;
        this.loadInterventions();
        this.loading = false;
        this.closeDateModal();
        this.showSuccess('✅ Date d\'intervention définie !\n📌 Statut: En cours (CONFIRMÉ)');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
        this.showError('❌ Erreur lors de la mise à jour: ' + (err.error?.message || err.message));
      }
    });
  }

  // ==================== ÉDITION ====================
editIntervention(intervention: InterventionPaiement) {
  if (intervention.statutIntervention === 'ANNULE') {
    this.showError('❌ Impossible de modifier une intervention annulée');
    return;
  }
  
  this.isEditing = true;
  this.selectedIntervention = intervention;
  
  // === AJOUT : Recharger les techniciens ===
  this.loadTechniciens();
  
  const client = this.clients.find(c => c.societe === intervention.societe);
  
  // Récupérer le nom du technicien actuel
  const technicienActuel = intervention.technicien || '';
  
  this.interventionForm.patchValue({
    numeroOrdre: intervention.numeroOrdre,
    clientId: client?.id,
    societe: intervention.societe || '',
    responsable: intervention.responsable || '',
    telephone: intervention.telephone || '',
    adresse: intervention.adresse || '',
    email: intervention.email || '',
    nomEquipement: intervention.bascule || '',
    referenceEquipement: intervention.reference || '',
    typeReclamation: intervention.reclamation || '',
    technicien: technicienActuel,  // ← Pré-sélectionner le technicien actuel
    dateReclamation: intervention.dateReclamation?.slice(0, 16) || new Date().toISOString().slice(0, 16),
    dateIntervention: intervention.dateOrdre?.slice(0, 16) || '',
    rapportIntervention: intervention.rapportIntervention || ''
  });
  
  this.interventionForm.get('dateIntervention')?.enable();
  
  this.searchTerm = intervention.societe || '';
  this.showForm = true;
  this.cdr.detectChanges();
}
  // ==================== SAUVEGARDE ====================

  saveIntervention() {
    if (this.interventionForm.invalid) {
      this.showError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const formValue = this.interventionForm.getRawValue();
    
    let intervention: Intervention;

    if (this.isEditing && this.selectedIntervention) {
      let statut = this.selectedIntervention.statutIntervention || 'EN_ATTENTE';
      
      if (formValue.dateIntervention && statut === 'EN_ATTENTE') {
        statut = 'CONFIRME';
      }
      
      intervention = {
        ...this.selectedIntervention,
        numeroOrdre: formValue.numeroOrdre,
        type: 'EXTERNE',
        societe: formValue.societe,
        bascule: formValue.nomEquipement,
        reference: formValue.referenceEquipement || '',
        responsable: formValue.responsable,
        adresse: formValue.adresse,
        telephone: formValue.telephone,
        email: formValue.email,
        reclamation: formValue.typeReclamation,
        technicien: formValue.technicien,
        dateReclamation: formValue.dateReclamation,
        dateOrdre: formValue.dateIntervention || '',
        rapportIntervention: formValue.rapportIntervention,
        montantTotal: this.selectedIntervention.montantTotal || 0,
        montantPaye: this.selectedIntervention.montantPaye || 0,
        statutIntervention: this.convertToStatutIntervention(statut),
        statutPaiement: this.convertToStatutPaiement(this.selectedIntervention.statutPaiement || 'EN_ATTENTE')
      };
      
    } else {
      intervention = {
        numeroOrdre: formValue.numeroOrdre,
        type: 'EXTERNE',
        societe: formValue.societe,
        bascule: formValue.nomEquipement,
        reference: formValue.referenceEquipement || '',
        responsable: formValue.responsable,
        adresse: formValue.adresse,
        telephone: formValue.telephone,
        email: formValue.email,
        reclamation: formValue.typeReclamation,
        technicien: formValue.technicien,
        dateReclamation: formValue.dateReclamation,
        dateOrdre: '',
        rapportIntervention: formValue.rapportIntervention,
        statutIntervention: 'EN_ATTENTE',
        montantTotal: 0,
        montantPaye: 0,
        statutPaiement: 'EN_ATTENTE'
      };
    }

    this.loading = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.selectedIntervention) {
      this.apiService.updateIntervention(this.selectedIntervention.id!, intervention).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          this.closeForm();
          this.loading = false;
          this.showSuccess('✅ Intervention modifiée avec succès');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          this.showError('❌ Erreur lors de la modification: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.apiService.createIntervention(intervention).subscribe({
        next: (created) => {
          this.dataLoaded = false;
          this.loadInterventions();
          this.closeForm();
          this.loading = false;
          this.showSuccess('✅ Intervention créée avec succès !\n\n📝 Prochaines étapes :\n1. Définir la date d\'intervention (bouton 📅)\n2. Ajouter le montant via le paiement');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          this.showError('❌ Erreur lors de la création: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  // ==================== ANNULATION ====================

  canAnnuler(intervention: InterventionPaiement): boolean {
    return intervention.statutIntervention === 'EN_ATTENTE' && !intervention.dateOrdre;
  }

  annulerIntervention(intervention: InterventionPaiement) {
    if (!this.canAnnuler(intervention)) {
      this.showError('❌ Impossible d\'annuler : l\'intervention n\'est plus en attente');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    
    const updated: Intervention = {
      ...intervention,
      statutIntervention: 'ANNULE'
    };
    
    this.apiService.updateIntervention(intervention.id!, updated).subscribe({
      next: () => {
        this.dataLoaded = false;
        this.loadInterventions();
        this.loading = false;
        this.showSuccess('✅ Intervention annulée avec succès');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
        this.showError('❌ Erreur lors de l\'annulation');
      }
    });
  }

  // ==================== SUPPRESSION ====================

  deleteIntervention(id: number) {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.apiService.deleteIntervention(id).subscribe({
      next: () => {
        this.dataLoaded = false;
        this.loadInterventions();
        this.loading = false;
        this.showSuccess('✅ Intervention supprimée');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
        this.showError('❌ Erreur lors de la suppression');
      }
    });
  }

  // ==================== EXPORT PDF ====================

  exportFormulaire(id: number) {
    this.apiService.exportFormulairePdf(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          const a = document.createElement('a');
          a.href = url;
          a.download = `formulaire_intervention_${id}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 1000);
        }
      },
      error: (err) => {
        console.error('Erreur export:', err);
      }
    });
  }

  // ==================== UTILITAIRES ====================

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

  // ===== MÉTHODE POUR VÉRIFIER SI LE TECHNICIEN EST ASSIGNÉ =====
  isTechnicienAssigne(intervention: InterventionPaiement): boolean {
    if (!this.isTechnicien) return false;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return intervention.technicien === currentUser.fullName || 
           intervention.technicien === currentUser.username;
  }
}