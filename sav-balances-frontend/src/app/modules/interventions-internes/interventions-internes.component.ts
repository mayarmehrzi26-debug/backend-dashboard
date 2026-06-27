import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService, Intervention, Client, Balance } from '../../core/services/api.service';
import { PrestationService } from '../../core/services/prestation.service';
import { Prestation } from '../../models/prestation.model';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { User } from '../../models/user.model';
import { PdfExportService } from '../../core/services/pdf-export.service';

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
import {
  StatutIntervention,
  getStatutInterventionLabel,
  getStatutInterventionClass
} from '../../models/intervention-statut.model';
import { PdfViewerService } from '../../core/services/pdf-viewer.service';
import { ExportService } from '../../core/services/export.service';

@Component({
  selector: 'app-interventions-internes',
  templateUrl: './interventions-internes.component.html',
  styleUrls: ['./interventions-internes.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule
  ]
})
export class InterventionsInternesComponent implements OnInit {
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
  showConfirmModal = false;
  showDateModal = false;
  isEditing = false;
  selectedIntervention: InterventionPaiement | null = null;
  interventionDetails: InterventionPaiement | null = null;
  interventionForm: FormGroup;
  paymentForm: FormGroup;
  confirmForm: FormGroup;
  dateForm: FormGroup;
  loading = true;
  detailsLoading = false;
  private dataLoaded = false;
  searchTerm: string = '';
  searchInterventionsTerm: string = '';
  selectedPrestationId: number | null = null;
  selectedBalanceId: number | null = null;
  prixCalcule: number = 0;
  
  // ===== FILTRES =====
  filterStatutIntervention: string = 'tous';
  filterStatutPaiement: string = 'tous';
  filterDateDebut: string = '';
  filterDateFin: string = '';
  filterSociete: string = '';
  filterTechnicien: string = '';
  showFilters: boolean = false;
  
  balanceMap: Map<number, Balance> = new Map();
  isAdmin: boolean = false;
  isTechnicien: boolean = false;
  currentUserNom: string = '';

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

  // ===== STATUTS POUR FILTRES =====
  statutInterventionOptions = [
    { value: 'tous', label: '📊 Tous' },
    { value: 'EN_ATTENTE', label: '🔵 En attente' },
    { value: 'CONFIRME', label: '🟡 En cours' },
    { value: 'ANNULE', label: '🔴 Annulé' },
    { value: 'TERMINE', label: '🟢 Terminé' }
  ];

  statutPaiementOptions = [
    { value: 'tous', label: '📊 Tous' },
    { value: 'EN_ATTENTE', label: '⏳ En attente' },
    { value: 'PARTIEL', label: '🟡 Partiel' },
    { value: 'PAYE', label: '✅ Payé' },
    { value: 'EN_RETARD', label: '🔴 En retard' },
    { value: 'ANNULE', label: '❌ Annulé' }
  ];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private prestationService: PrestationService,
    private pdfViewerService: PdfViewerService,
    private authService: AuthService,
    private userService: UserService,
    private exportService: ExportService
  ) {
    this.interventionForm = this.createForm();
    this.paymentForm = this.createPaymentForm();
    this.confirmForm = this.createConfirmForm();
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
      type: [{ value: 'INTERNE', disabled: true }],
      clientId: ['', Validators.required],
      societe: [{ value: '', disabled: true }],
      responsable: [{ value: '', disabled: true }],
      telephone: [{ value: '', disabled: true }],
      adresse: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      nomEquipement: ['', Validators.required],
      referenceEquipement: ['', Validators.required],
      typeReclamation: ['', Validators.required],
      technicien: [''],
      dateReclamation: [new Date().toISOString().slice(0, 16)],
      dateIntervention: [{ value: '', disabled: true }],
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

  createConfirmForm(): FormGroup {
    return this.fb.group({
      prixPropose: ['', [Validators.required, Validators.min(0)]],
      dateDiagnostic: [new Date().toISOString().slice(0, 16)],
      notes: ['']
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

  // ==================== FILTRES ====================
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  resetFilters() {
    this.filterStatutIntervention = 'tous';
    this.filterStatutPaiement = 'tous';
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.filterSociete = '';
    this.filterTechnicien = '';
    this.searchInterventionsTerm = '';
    this.filterInterventions();
  }

  filterInterventions() {
    let filtered = [...this.interventions];
    
    // Recherche textuelle
    if (this.searchInterventionsTerm && this.searchInterventionsTerm.trim() !== '') {
      const term = this.searchInterventionsTerm.toLowerCase().trim();
      filtered = filtered.filter(interv => {
        return (
          interv.numeroOrdre?.toLowerCase().includes(term) ||
          interv.societe?.toLowerCase().includes(term) ||
          interv.bascule?.toLowerCase().includes(term) ||
          interv.reclamation?.toLowerCase().includes(term) ||
          interv.technicien?.toLowerCase().includes(term) ||
          interv.reference?.toLowerCase().includes(term)
        );
      });
    }
    
    // Filtre par statut d'intervention
    if (this.filterStatutIntervention !== 'tous') {
      filtered = filtered.filter(interv => 
        interv.statutIntervention === this.filterStatutIntervention
      );
    }
    
    // Filtre par statut de paiement
    if (this.filterStatutPaiement !== 'tous') {
      filtered = filtered.filter(interv => 
        interv.statutPaiement === this.filterStatutPaiement
      );
    }
    
    // Filtre par société
    if (this.filterSociete && this.filterSociete.trim() !== '') {
      const societe = this.filterSociete.toLowerCase().trim();
      filtered = filtered.filter(interv => 
        interv.societe?.toLowerCase().includes(societe)
      );
    }
    
    // Filtre par technicien
    if (this.filterTechnicien && this.filterTechnicien.trim() !== '') {
      const technicien = this.filterTechnicien.toLowerCase().trim();
      filtered = filtered.filter(interv => 
        interv.technicien?.toLowerCase().includes(technicien)
      );
    }
    
    // Filtre par date
    if (this.filterDateDebut) {
      const debut = new Date(this.filterDateDebut);
      debut.setHours(0, 0, 0, 0);
      filtered = filtered.filter(interv => {
        if (!interv.dateReclamation) return false;
        return new Date(interv.dateReclamation) >= debut;
      });
    }
    
    if (this.filterDateFin) {
      const fin = new Date(this.filterDateFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(interv => {
        if (!interv.dateReclamation) return false;
        return new Date(interv.dateReclamation) <= fin;
      });
    }
    
    this.filteredInterventions = filtered;
    this.cdr.detectChanges();
  }

  clearInterventionsSearch() {
    this.searchInterventionsTerm = '';
    this.filterInterventions();
  }

  // ==================== EXPORT ====================
  exportToCSV() {
    if (this.filteredInterventions.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const columns = [
      { key: 'numeroOrdre', label: 'N° Ordre' },
      { key: 'societe', label: 'Société' },
      { key: 'bascule', label: 'Équipement' },
      { key: 'reference', label: 'Référence' },
      { key: 'reclamation', label: 'Réclamation' },
      { key: 'technicien', label: 'Technicien' },
      { key: 'statutIntervention', label: 'Statut Intervention' },
      { key: 'statutPaiement', label: 'Statut Paiement' },
      { key: 'montantTotal', label: 'Montant Total' },
      { key: 'montantPaye', label: 'Montant Payé' },
      { key: 'dateReclamation', label: 'Date Réclamation' },
      { key: 'dateOrdre', label: 'Date Intervention' },
      { key: 'rapportIntervention', label: 'Rapport' }
    ];

    const dataToExport = this.filteredInterventions.map(interv => ({
      ...interv,
      statutIntervention: this.getStatutInterventionLabel(interv.statutIntervention),
      statutPaiement: this.getStatutLabel(interv.statutPaiement),
      dateReclamation: interv.dateReclamation ? new Date(interv.dateReclamation).toLocaleDateString('fr-FR') : '-',
      dateOrdre: interv.dateOrdre ? new Date(interv.dateOrdre).toLocaleDateString('fr-FR') : '-',
      montantTotal: interv.montantTotal || 0,
      montantPaye: interv.montantPaye || 0,
    }));

    this.exportService.exportToCSV(
      dataToExport,
      `interventions_internes_${new Date().toISOString().slice(0,10)}`,
      columns
    );
  }

  exportToPDF() {
    if (this.filteredInterventions.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour exporter en PDF');
      return;
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Interventions Internes</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .container { max-width: 1200px; margin: 0 auto; }
          h1 { color: #0d3e23; text-align: center; border-bottom: 3px solid #0d3e23; padding-bottom: 15px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header .date { color: #666; font-size: 14px; }
          .summary { display: flex; justify-content: space-around; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .summary-item { text-align: center; }
          .summary-item .label { display: block; font-size: 12px; color: #666; }
          .summary-item .value { font-size: 20px; font-weight: bold; color: #0d3e23; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #0d3e23; color: white; padding: 8px 10px; text-align: left; border: 1px solid #0d3e23; }
          td { padding: 6px 10px; border: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; display: inline-block; }
          .badge-success { background: #28a745; color: white; }
          .badge-warning { background: #ffc107; color: black; }
          .badge-danger { background: #dc3545; color: white; }
          .badge-secondary { background: #6c757d; color: white; }
          .badge-info { background: #17a2b8; color: white; }
          .badge-primary { background: #007bff; color: white; }
          .footer { margin-top: 30px; color: #666; font-size: 12px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Interventions Internes</h1>
            <p class="date">Généré le : ${new Date().toLocaleString('fr-FR')}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <span class="label">Total</span>
              <span class="value">${this.filteredInterventions.length}</span>
            </div>
            <div class="summary-item">
              <span class="label">Montant Total</span>
              <span class="value">${this.filteredInterventions.reduce((sum, i) => sum + (i.montantTotal || 0), 0)} DT</span>
            </div>
            <div class="summary-item">
              <span class="label">Montant Payé</span>
              <span class="value">${this.filteredInterventions.reduce((sum, i) => sum + (i.montantPaye || 0), 0)} DT</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>N° Ordre</th>
                <th>Société</th>
                <th>Équipement</th>
                <th>Réclamation</th>
                <th>Statut</th>
                <th>Statut Paiement</th>
                <th class="text-right">Montant</th>
                <th class="text-right">Payé</th>
                <th>Date Réclamation</th>
              </tr>
            </thead>
            <tbody>`;

    this.filteredInterventions.forEach(interv => {
      const statutClass = this.getStatutInterventionClass(interv.statutIntervention).replace('badge-', '');
      const paiementClass = this.getStatutClass(interv.statutPaiement).replace('badge-', '');
      
      html += `
        <tr>
          <td><strong>${interv.numeroOrdre || '-'}</strong></td>
          <td>${interv.societe || '-'}</td>
          <td>${interv.bascule || '-'}</td>
          <td>${interv.reclamation || '-'}</td>
          <td><span class="badge badge-${statutClass}">${this.getStatutInterventionLabel(interv.statutIntervention)}</span></td>
          <td><span class="badge badge-${paiementClass}">${this.getStatutLabel(interv.statutPaiement)}</span></td>
          <td class="text-right">${interv.montantTotal || 0}</td>
          <td class="text-right">${interv.montantPaye || 0}</td>
          <td>${interv.dateReclamation ? new Date(interv.dateReclamation).toLocaleDateString('fr-FR') : '-'}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
          <div class="footer">
            Document généré automatiquement - ${new Date().toLocaleString('fr-FR')}
            <br>${this.filteredInterventions.length} intervention(s) listée(s)
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  // ==================== CHARGEMENT DES INTERVENTIONS ====================
  loadInterventions() {
    if (this.dataLoaded) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    this.apiService.getInterventionsByType('INTERNE').subscribe({
      next: (data) => {
        const promises = data.map(interv => {
          return this.apiService.getTransactionsByIntervention(interv.id!).toPromise()
            .then(transactions => {
              const totalPaye = (transactions || [])
                .filter(t => t.statut === 'VALIDE')
                .reduce((sum, t) => sum + t.montant, 0);
              
              const montantTotal = interv.montantTotal || interv.prixEstime || 0;
              const montantPaye = interv.montantPaye || totalPaye || 0;
              
              let currentStatut = interv.statutIntervention || 'EN_ATTENTE';
              let nouveauStatut = currentStatut;
              
              if (currentStatut === 'ANNULE') {
                nouveauStatut = 'ANNULE';
              } else if (montantTotal > 0 && montantPaye >= montantTotal) {
                nouveauStatut = 'TERMINE';
              } else if (interv.dateOrdre && currentStatut === 'EN_ATTENTE') {
                nouveauStatut = 'CONFIRME';
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
                statutPaiement: this.convertToStatutPaiement(statutPaiement),
                statutIntervention: this.convertToStatutIntervention(nouveauStatut),
                transactions: transactions || []
              } as InterventionPaiement;
            })
            .catch(() => {
              const montantTotal = interv.montantTotal || interv.prixEstime || 0;
              const montantPaye = interv.montantPaye || 0;
              
              let currentStatut = interv.statutIntervention || 'EN_ATTENTE';
              let nouveauStatut = currentStatut;
              
              if (currentStatut === 'ANNULE') {
                nouveauStatut = 'ANNULE';
              } else if (montantTotal > 0 && montantPaye >= montantTotal) {
                nouveauStatut = 'TERMINE';
              } else if (interv.dateOrdre && currentStatut === 'EN_ATTENTE') {
                nouveauStatut = 'CONFIRME';
              }
              
              return {
                ...interv,
                montantTotal: montantTotal,
                montantPaye: montantPaye,
                montantRestant: Math.max(0, montantTotal - montantPaye),
                statutPaiement: this.convertToStatutPaiement(interv.statutPaiement || 'EN_ATTENTE'),
                statutIntervention: this.convertToStatutIntervention(nouveauStatut),
                transactions: []
              } as InterventionPaiement;
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
      }
    });
  }

  // ==================== AUTRES MÉTHODES EXISTANTES ====================
  // ... (loadClients, selectClient, filterClients, etc.)

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

  generateNumeroOrdre(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INT-${random}`;
  }

  // ==================== DATE INTERVENTION ====================
  openDateModal(intervention: InterventionPaiement) {
    if (intervention.statutIntervention === 'ANNULE') {
      alert('❌ Impossible de modifier une intervention annulée');
      return;
    }
    
    if (intervention.dateOrdre) {
      alert('⚠️ Une date d\'intervention est déjà définie');
      return;
    }
    
    if (intervention.statutIntervention !== 'CONFIRME') {
      alert('⚠️ L\'intervention doit être confirmée avant de définir la date');
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
      alert('Veuillez sélectionner une date');
      return;
    }

    if (!this.selectedIntervention || !this.selectedIntervention.id) return;

    const formValue = this.dateForm.value;
    const dateInput = formValue.dateIntervention;

    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.updateInterventionDate(this.selectedIntervention.id, dateInput).subscribe({
      next: (response) => {
        this.dataLoaded = false;
        this.loadInterventions();
        this.loading = false;
        this.closeDateModal();
        
        const montant = response.montantTotal || response.prixEstime || 0;
        if (montant > 0) {
          alert(`✅ Intervention terminée !\n\n📅 Date : ${new Date(dateInput).toLocaleString('fr-FR')}\n💰 Montant : ${montant} DT\n💳 Paiement automatique enregistré`);
        } else {
          alert(`✅ Intervention terminée !\n\n📅 Date : ${new Date(dateInput).toLocaleString('fr-FR')}\n⚠️ Aucun montant défini.`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('❌ Erreur lors de la mise à jour: ' + (err.error?.message || err.message));
      }
    });
  }

  // ==================== CONFIRMATION ====================
  openConfirmModal(intervention: InterventionPaiement | null) {
    if (!intervention) return;
    if (intervention.statutIntervention === 'ANNULE') {
      alert('❌ Impossible de confirmer une intervention annulée');
      return;
    }
    if (intervention.statutIntervention === 'CONFIRME') {
      alert('⚠️ Cette intervention est déjà confirmée');
      return;
    }
    if (intervention.statutIntervention === 'TERMINE') {
      alert('✅ Cette intervention est déjà terminée');
      return;
    }
    this.selectedIntervention = intervention;
    this.confirmForm.reset({
      prixPropose: '',
      dateDiagnostic: new Date().toISOString().slice(0, 16),
      notes: ''
    });
    this.showConfirmModal = true;
    this.cdr.detectChanges();
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.selectedIntervention = null;
    this.cdr.detectChanges();
  }

  saveConfirmation() {
    if (this.confirmForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!this.selectedIntervention || !this.selectedIntervention.id) return;

    const formValue = this.confirmForm.value;
    const prixPropose = formValue.prixPropose;
    
    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.updateInterventionPrix(this.selectedIntervention.id, prixPropose).subscribe({
      next: (response) => {
        this.dataLoaded = false;
        this.loadInterventions();
        this.loading = false;
        this.closeConfirmModal();
        alert(`✅ Intervention confirmée !\n\n💰 Prix estimé : ${prixPropose} DT\n📌 Statut : En cours (CONFIRMÉ)\n\n📝 Prochaine étape : Définir la date d'intervention (bouton 📅)`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('❌ Erreur lors de la confirmation: ' + (err.error?.message || err.message));
      }
    });
  }

  // ==================== ANNULATION ====================
  canAnnuler(intervention: InterventionPaiement): boolean {
    return intervention.statutIntervention === 'EN_ATTENTE' && !intervention.dateOrdre;
  }

  annulerIntervention(intervention: InterventionPaiement) {
    if (!this.canAnnuler(intervention)) {
      alert('❌ Impossible d\'annuler : l\'intervention n\'est plus en attente');
      return;
    }

    if (confirm(`⚠️ Êtes-vous sûr de vouloir annuler l'intervention ${intervention.numeroOrdre} ?\n\nCette action est irréversible.`)) {
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
          alert('✅ Intervention annulée avec succès');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('❌ Erreur lors de l\'annulation');
        }
      });
    }
  }

  // ==================== EXPORT PDF ====================
  exportFormulaire(id: number) {
    this.apiService.exportFormulaireInternePdf(id).subscribe({
      next: (blob) => {
        this.pdfViewerService.openPdfInNewTab(blob, `bon_reçue_interne_${id}.pdf`);
      },
      error: (err) => {
        console.error('Erreur export:', err);
        alert('❌ Erreur lors de l\'export du PDF');
      }
    });
  }

  exportBonRecuperation(id: number) {
    this.apiService.exportBonRecuperationPdf(id).subscribe({
      next: (blob) => {
        this.pdfViewerService.openPdfInNewTab(blob, `bon_recuperation_${id}.pdf`);
      },
      error: (err) => {
        console.error('Erreur export:', err);
        alert('❌ Erreur lors de l\'export du bon de récupération');
      }
    });
  }

  // ==================== PAIEMENT ====================
  openPaymentModal(intervention: InterventionPaiement | null) {
    if (!intervention) return;
    if (intervention.statutIntervention === 'ANNULE') {
      alert('❌ Impossible d\'ajouter un paiement sur une intervention annulée');
      return;
    }
    if (intervention.statutIntervention === 'TERMINE') {
      alert('✅ Cette intervention est déjà terminée et payée automatiquement');
      return;
    }
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
        this.dataLoaded = false;
        this.loadInterventions();
        this.loading = false;
        this.closePaymentModal();
        alert('✅ Paiement enregistré avec succès');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('❌ Erreur: ' + (err.error || 'Impossible d\'enregistrer le paiement'));
      }
    });
  }

  getMontantRestant(intervention: InterventionPaiement | null): number {
    if (!intervention) return 0;
    const total = intervention.montantTotal || intervention.prixEstime || 0;
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
          
          const montantTotal = this.interventionDetails.montantTotal || 
                              this.interventionDetails.prixEstime || 0;
          
          this.interventionDetails.montantPaye = totalPaye;
          this.interventionDetails.montantRestant = Math.max(0, montantTotal - totalPaye);
          
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erreur chargement transactions:', err)
    });
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
    
    this.loadTechniciens();
    
    const newNumeroOrdre = this.generateNumeroOrdre();
    
    this.interventionForm.reset({
      numeroOrdre: newNumeroOrdre,
      type: 'INTERNE',
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
      dateIntervention: '',
      rapportIntervention: '',
      prixEstime: '',
      prixReel: ''
    });
    
    this.interventionForm.get('dateIntervention')?.disable();
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
        const statutIntervention = this.convertToStatutIntervention(data.statutIntervention || 'EN_ATTENTE');
        
        this.interventionDetails = {
          ...data,
          montantTotal: data.montantTotal || data.prixEstime || 0,
          montantPaye: data.montantPaye || 0,
          montantRestant: data.montantRestant || 0,
          statutPaiement: this.convertToStatutPaiement(data.statutPaiement || 'EN_ATTENTE'),
          statutIntervention: statutIntervention,
          societe: data.societe || '',
          bascule: data.bascule || '',
          reference: data.reference || '',
          reclamation: data.reclamation || '',
          technicien: data.technicien || '',
          responsable: data.responsable || '',
          telephone: data.telephone || '',
          adresse: data.adresse || '',
          email: data.email || '',
          prixPropose: data.prixPropose || 0,
          dateDiagnostic: data.dateDiagnostic || '',
          dateRecuperation: data.dateRecuperation || ''
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

  // ==================== ÉDITION ====================
  editIntervention(intervention: InterventionPaiement) {
    if (intervention.statutIntervention === 'ANNULE') {
      alert('❌ Impossible de modifier une intervention annulée');
      return;
    }
    
    this.isEditing = true;
    this.selectedIntervention = intervention;
    this.loadTechniciens();
    
    const client = this.clients.find(c => c.societe === intervention.societe);
    
    this.interventionForm.patchValue({
      numeroOrdre: intervention.numeroOrdre,
      type: 'INTERNE',
      clientId: client?.id,
      societe: intervention.societe || '',
      responsable: intervention.responsable || '',
      telephone: intervention.telephone || '',
      adresse: intervention.adresse || '',
      email: intervention.email || '',
      nomEquipement: intervention.bascule || '',
      referenceEquipement: intervention.reference || '',
      typeReclamation: intervention.reclamation || '',
      technicien: intervention.technicien || '',
      dateReclamation: intervention.dateReclamation?.slice(0, 16) || new Date().toISOString().slice(0, 16),
      dateIntervention: intervention.dateOrdre?.slice(0, 16) || '',
      rapportIntervention: intervention.rapportIntervention || '',
      prixEstime: intervention.prixEstime || 0,
      prixReel: intervention.prixReel || 0
    });
    
    this.interventionForm.get('dateIntervention')?.enable();
    this.searchTerm = intervention.societe || '';
    this.showForm = true;
    this.cdr.detectChanges();
  }

  // ==================== SAUVEGARDE ====================
  saveIntervention() {
    if (this.interventionForm.invalid) {
      alert('Veuillez remplir tous les champs obligatoires');
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
        type: 'INTERNE',
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
        dateOrdre: formValue.dateIntervention || '',
        rapportIntervention: formValue.rapportIntervention,
        prixEstime: this.prixCalcule || formValue.prixEstime,
        prixReel: formValue.prixReel,
        statutIntervention: this.convertToStatutIntervention(statut),
        montantTotal: this.selectedIntervention.montantTotal || 0,
        montantPaye: this.selectedIntervention.montantPaye || 0,
        montantRestant: Math.max(0, (this.selectedIntervention.montantTotal || 0) - (this.selectedIntervention.montantPaye || 0)),
        statutPaiement: this.selectedIntervention.statutPaiement || 'EN_ATTENTE'
      };
    } else {
      intervention = {
        numeroOrdre: formValue.numeroOrdre,
        type: 'INTERNE',
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
        dateOrdre: '',
        rapportIntervention: formValue.rapportIntervention,
        prixEstime: this.prixCalcule,
        prixReel: formValue.prixReel,
        statutIntervention: 'EN_ATTENTE',
        montantTotal: 0,
        montantPaye: 0,
        montantRestant: 0,
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
          alert('✅ Intervention modifiée avec succès');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('❌ Erreur lors de la modification');
        }
      });
    } else {
      this.apiService.createIntervention(intervention).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          this.closeForm();
          this.loading = false;
          alert('✅ Intervention créée avec succès !\n\n📝 Prochaines étapes :\n1. Confirmer l\'intervention (bouton ✅)\n2. Définir la date d\'intervention (bouton 📅)');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('❌ Erreur lors de la création');
        }
      });
    }
  }

  // ==================== SUPPRESSION ====================
  deleteIntervention(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      this.loading = true;
      this.cdr.detectChanges();
      
      this.apiService.deleteIntervention(id).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadInterventions();
          this.loading = false;
          alert('✅ Intervention supprimée');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur:', err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('❌ Erreur lors de la suppression');
        }
      });
    }
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
            statutIntervention: this.convertToStatutIntervention(updatedIntervention.statutIntervention || 'EN_ATTENTE')
          };
          this.filteredInterventions = [...this.interventions];
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Erreur refresh:', err)
    });
  }

  isTechnicienAssigne(intervention: InterventionPaiement): boolean {
    if (!this.isTechnicien) return false;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;
    return intervention.technicien === currentUser.fullName || 
           intervention.technicien === currentUser.username;
  }
  
}