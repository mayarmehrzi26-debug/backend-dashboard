import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Client } from '../../core/services/api.service';
import { TransactionClient } from '../../core/services/api.service';
import { ExportService } from '../../core/services/export.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  showForm = false;
  showNotesModal = false;
  showDetailsModal = false;
  isEditing = false;
  selectedClient: Client | null = null;
  clientDetails: Client | null = null;
  clientForm: FormGroup;
  notesForm: FormGroup;
  loading = true;
  detailsLoading = false;
  walletLoading = false;
  private dataLoaded = false;
  searchTerm: string = '';
  selectedTab: 'info' | 'wallet' | 'interventions' = 'info';

  // Wallet
  transactions: TransactionClient[] = [];
  transactionsLimited: TransactionClient[] = [];
  totalPaye: number = 0;
  nombreTransactions: number = 0;
  derniereTransaction: TransactionClient | null = null;
  montantMoyen: number = 0;

  // Interventions du client
  clientInterventions: any[] = [];
  clientInterventionsLoading = false;

  // Map pour stocker le nombre d'interventions par client
  interventionCounts: Map<string, number> = new Map();
  interventionData: Map<string, any[]> = new Map();
  isLoadingCounts: boolean = false;

  // ===== FILTRES =====
  showFilters: boolean = false;
  filters = {
    statutPaiement: 'tous',
    comportement: 'tous',
    negociateur: 'tous',
    clientFidele: 'tous',
    avertissements: 'tous',
    hasNotes: 'tous',
    noteMin: null as number | null,
    noteMax: null as number | null,
    dateDebut: '',
    dateFin: ''
  };

  // Options de filtres
  paiementOptions = [
    { value: 'tous', label: '📊 Tous' },
    { value: 'PONCTUEL', label: '✅ Ponctuel' },
    { value: 'RETARD_OCCASIONNEL', label: '⚠️ Retard occasionnel' },
    { value: 'RETARD_FREQUENT', label: '🔥 Retard fréquent' },
    { value: 'TRES_RETARD', label: '💀 Très mauvais payeur' }
  ];

  comportementOptions = [
    { value: 'tous', label: '📊 Tous' },
    { value: 'EXCELLENT', label: '🌟 Excellent' },
    { value: 'PROFESSIONNEL', label: '👔 Professionnel' },
    { value: 'DIFFICILE', label: '⚠️ Difficile' },
    { value: 'IMPOLI', label: '😤 Impoli' },
    { value: 'A_EVITER', label: '🚫 À éviter' }
  ];

  noteOptions = [
    { value: 1, label: '⭐ 1 étoile' },
    { value: 2, label: '⭐⭐ 2 étoiles' },
    { value: 3, label: '⭐⭐⭐ 3 étoiles' },
    { value: 4, label: '⭐⭐⭐⭐ 4 étoiles' },
    { value: 5, label: '⭐⭐⭐⭐⭐ 5 étoiles' }
  ];

  // Rôle
  isAdmin: boolean = false;

  // Permissions
  canEdit(): boolean {
    return this.isAdmin;
  }

  canDelete(): boolean {
    return this.isAdmin;
  }

  comportements = [
    { value: 'EXCELLENT', label: '🌟 Excellent', color: 'success', icon: 'bi-star-fill' },
    { value: 'PROFESSIONNEL', label: '👔 Professionnel', color: 'primary', icon: 'bi-briefcase' },
    { value: 'DIFFICILE', label: '⚠️ Difficile', color: 'warning', icon: 'bi-exclamation-triangle' },
    { value: 'IMPOLI', label: '😤 Impoli', color: 'danger', icon: 'bi-emoji-angry' },
    { value: 'A_EVITER', label: '🚫 À éviter', color: 'dark', icon: 'bi-shield-x' }
  ];

  statutsPaiement = [
    { value: 'PONCTUEL', label: '✅ Ponctuel', color: 'success' },
    { value: 'RETARD_OCCASIONNEL', label: '⚠️ Retard occasionnel', color: 'warning' },
    { value: 'RETARD_FREQUENT', label: '🔥 Retard fréquent', color: 'danger' },
    { value: 'TRES_RETARD', label: '💀 Très mauvais payeur', color: 'dark' }
  ];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private exportService: ExportService,
    private authService: AuthService,
    private router: Router
  ) {
    this.clientForm = this.createForm();
    this.notesForm = this.createNotesForm();
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadClients();
  }

  createForm(): FormGroup {
    return this.fb.group({
      societe: ['', Validators.required],
      responsable: ['', Validators.required],
      telephone: [''],
      adresse: [''],
      email: ['']
    });
  }

  createNotesForm(): FormGroup {
    return this.fb.group({
      notes: [''],
      comportement: [''],
      note: [3],
      statutPaiement: [''],
      negociateur: [false],
      clientFidele: [false]
    });
  }

  // ==================== CHARGEMENT ====================
  loadClients() {
    if (this.dataLoaded) return;
    this.loading = true;
    this.cdr.detectChanges();

    this.apiService.getClients().subscribe({
      next: (data) => {
        this.clients = data || [];
        this.filteredClients = [...this.clients];
        this.loading = false;
        this.dataLoaded = true;
        this.cdr.detectChanges();
        
        this.loadAllInterventionCounts();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.clients = [];
        this.filteredClients = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadAllInterventionCounts() {
    this.isLoadingCounts = true;
    this.cdr.detectChanges();

    const promises = this.clients.map(client => {
      return new Promise((resolve) => {
        if (client.societe) {
          this.apiService.getInterventionsByClient(client.societe).subscribe({
            next: (data) => {
              this.interventionCounts.set(client.societe, (data || []).length);
              this.interventionData.set(client.societe, data || []);
              resolve(true);
            },
            error: () => {
              this.interventionCounts.set(client.societe, 0);
              this.interventionData.set(client.societe, []);
              resolve(false);
            }
          });
        } else {
          this.interventionCounts.set(client.societe || '', 0);
          this.interventionData.set(client.societe || '', []);
          resolve(false);
        }
      });
    });

    Promise.all(promises).then(() => {
      this.isLoadingCounts = false;
      this.cdr.detectChanges();
    });
  }

  getClientInterventionCount(societe: string): number {
    return this.interventionCounts.get(societe) || 0;
  }

  getClientInterventions(societe: string): any[] {
    return this.interventionData.get(societe) || [];
  }

  getPaidInterventionsCount(societe: string): number {
    const interventions = this.interventionData.get(societe) || [];
    return interventions.filter((i: any) => 
      i.statutPaiement === 'PAYE' || 
      (i.montantTotal > 0 && i.montantPaye >= i.montantTotal)
    ).length;
  }

  getUnpaidInterventionsCount(societe: string): number {
    const interventions = this.interventionData.get(societe) || [];
    return interventions.filter((i: any) => 
      i.statutPaiement !== 'PAYE' && 
      !(i.montantTotal > 0 && i.montantPaye >= i.montantTotal)
    ).length;
  }

  // ==================== FILTRES ====================
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  resetFilters() {
    this.filters = {
      statutPaiement: 'tous',
      comportement: 'tous',
      negociateur: 'tous',
      clientFidele: 'tous',
      avertissements: 'tous',
      hasNotes: 'tous',
      noteMin: null,
      noteMax: null,
      dateDebut: '',
      dateFin: ''
    };
    this.searchTerm = '';
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.clients];
    
    // Recherche textuelle
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(client =>
        client.societe?.toLowerCase().includes(term) ||
        client.responsable?.toLowerCase().includes(term) ||
        client.telephone?.includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.adresse?.toLowerCase().includes(term)
      );
    }
    
    // Filtre par statut paiement
    if (this.filters.statutPaiement !== 'tous') {
      filtered = filtered.filter(client => 
        client.statutPaiement === this.filters.statutPaiement
      );
    }
    
    // Filtre par comportement
    if (this.filters.comportement !== 'tous') {
      filtered = filtered.filter(client => 
        client.comportement === this.filters.comportement
      );
    }
    
    // Filtre par négociateur
    if (this.filters.negociateur !== 'tous') {
      const isNegociateur = this.filters.negociateur === 'oui';
      filtered = filtered.filter(client => 
        client.negociateur === isNegociateur
      );
    }
    
    // Filtre par client fidèle
    if (this.filters.clientFidele !== 'tous') {
      const isFidele = this.filters.clientFidele === 'oui';
      filtered = filtered.filter(client => 
        client.clientFidele === isFidele
      );
    }
    
    // Filtre par avertissements
    if (this.filters.avertissements !== 'tous') {
      if (this.filters.avertissements === 'avec') {
        filtered = filtered.filter(client => 
          (client.nombreAvertissements || 0) > 0
        );
      } else if (this.filters.avertissements === 'sans') {
        filtered = filtered.filter(client => 
          (client.nombreAvertissements || 0) === 0
        );
      } else if (this.filters.avertissements === 'plus3') {
        filtered = filtered.filter(client => 
          (client.nombreAvertissements || 0) >= 3
        );
      }
    }
    
    // Filtre par notes
    if (this.filters.hasNotes !== 'tous') {
      if (this.filters.hasNotes === 'avec') {
        filtered = filtered.filter(client => 
          client.notes && client.notes.trim().length > 0
        );
      } else if (this.filters.hasNotes === 'sans') {
        filtered = filtered.filter(client => 
          !client.notes || client.notes.trim().length === 0
        );
      }
    }
    
    // Filtre par note min
    if (this.filters.noteMin !== null && this.filters.noteMin > 0) {
      filtered = filtered.filter(client => 
        (client.note || 0) >= this.filters.noteMin!
      );
    }
    
    // Filtre par note max
    if (this.filters.noteMax !== null && this.filters.noteMax > 0) {
      filtered = filtered.filter(client => 
        (client.note || 0) <= this.filters.noteMax!
      );
    }
    
    // Filtre par date
    if (this.filters.dateDebut) {
      const debut = new Date(this.filters.dateDebut);
      debut.setHours(0, 0, 0, 0);
      filtered = filtered.filter(client => {
        if (!client.dernierContact) return false;
        return new Date(client.dernierContact) >= debut;
      });
    }
    
    if (this.filters.dateFin) {
      const fin = new Date(this.filters.dateFin);
      fin.setHours(23, 59, 59, 999);
      filtered = filtered.filter(client => {
        if (!client.dernierContact) return false;
        return new Date(client.dernierContact) <= fin;
      });
    }
    
    this.filteredClients = filtered;
    this.cdr.detectChanges();
  }

  // ==================== RECHERCHE ====================
  filterClients() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  // ==================== CLIENTS CRUD ====================
  openForm() {
    this.showForm = true;
    this.isEditing = false;
    this.selectedClient = null;
    this.clientForm.reset({ societe: '', responsable: '', telephone: '', adresse: '', email: '' });
    this.cdr.detectChanges();
  }

  closeForm() {
    this.showForm = false;
    this.clientForm.reset();
    this.cdr.detectChanges();
  }

  editClient(client: Client) {
    if (!this.canEdit()) {
      alert('⛔ Seul un administrateur peut modifier un client');
      return;
    }
    this.isEditing = true;
    this.selectedClient = client;
    this.clientForm.patchValue({
      societe: client.societe || '',
      responsable: client.responsable || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      email: client.email || ''
    });
    this.showForm = true;
    this.cdr.detectChanges();
  }

  saveClient() {
    if (this.clientForm.invalid) {
      alert('Veuillez remplir la Société et le Responsable');
      return;
    }
    const client = this.clientForm.value;
    this.loading = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.selectedClient) {
      if (!this.canEdit()) {
        alert('⛔ Seul un administrateur peut modifier un client');
        this.loading = false;
        return;
      }
      this.apiService.updateClient(this.selectedClient.id!, { ...this.selectedClient, ...client }).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadClients();
          this.closeForm();
          alert('Client modifié avec succès');
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la modification');
        }
      });
    } else {
      this.apiService.createClient(client).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadClients();
          this.closeForm();
          alert('Client créé avec succès');
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la création');
        }
      });
    }
  }

  deleteClient(id: number) {
    if (!this.canDelete()) {
      alert('⛔ Seul un administrateur peut supprimer un client');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      this.loading = true;
      this.cdr.detectChanges();
      this.apiService.deleteClient(id).subscribe({
        next: () => {
          this.dataLoaded = false;
          this.loadClients();
          alert('Client supprimé');
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.detectChanges();
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  refresh() {
    this.dataLoaded = false;
    this.searchTerm = '';
    this.interventionCounts.clear();
    this.interventionData.clear();
    this.resetFilters();
    this.loadClients();
  }

  // ==================== NOTES & ÉVALUATION ====================
  openNotesModal(client: Client) {
    if (!this.canEdit()) {
      alert('⛔ Seul un administrateur peut évaluer un client');
      return;
    }
    this.selectedClient = client;
    this.notesForm.patchValue({
      notes: client.notes || '',
      comportement: client.comportement || '',
      note: client.note || 3,
      statutPaiement: client.statutPaiement || '',
      negociateur: client.negociateur || false,
      clientFidele: client.clientFidele || false
    });
    this.showNotesModal = true;
    this.cdr.detectChanges();
  }

  saveNotes() {
    if (!this.selectedClient) return;
    const data = this.notesForm.value;
    this.loading = true;
    this.cdr.detectChanges();
    this.apiService.patchClient(this.selectedClient.id!, data).subscribe({
      next: () => {
        this.dataLoaded = false;
        this.loadClients();
        this.showNotesModal = false;
        this.loading = false;
        alert('Évaluation enregistrée avec succès');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
        alert('Erreur lors de l\'enregistrement');
      }
    });
  }

  closeNotesModal() {
    this.showNotesModal = false;
    this.cdr.detectChanges();
  }

  // ==================== DÉTAILS CLIENT ====================
  viewClientDetails(client: Client, tab: 'info' | 'wallet' | 'interventions' = 'info') {
    if (!this.isAdmin && tab === 'wallet') {
      tab = 'info';
    }
    
    this.selectedTab = tab;
    this.detailsLoading = true;
    this.showDetailsModal = true;
    this.cdr.detectChanges();

    this.apiService.getClient(client.id!).subscribe({
      next: (data) => {
        this.clientDetails = data;
        this.detailsLoading = false;
        this.cdr.detectChanges();
        
        if (data.societe) {
          this.loadClientInterventions(data.societe);
        }
        
        if (client.id) {
          this.loadClientTransactions(client.id, tab === 'wallet');
        }
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
    this.clientDetails = null;
    this.transactions = [];
    this.transactionsLimited = [];
    this.clientInterventions = [];
    this.selectedTab = 'info';
    this.cdr.detectChanges();
  }

  // ==================== INTERVENTIONS DU CLIENT ====================
  loadClientInterventions(societe: string) {
    if (!societe) {
      this.clientInterventions = [];
      this.clientInterventionsLoading = false;
      this.cdr.detectChanges();
      return;
    }
    
    this.clientInterventionsLoading = true;
    this.clientInterventions = [];
    this.cdr.detectChanges();

    this.apiService.getInterventionsByClient(societe).subscribe({
      next: (data) => {
        this.clientInterventions = data || [];
        this.clientInterventionsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement interventions client:', err);
        this.clientInterventionsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToIntervention(interventionId: number, type: string) {
    this.closeDetailsModal();
    
    let route = '/app/interventions/externes';
    if (type === 'INTERNE') {
      route = '/app/interventions/internes';
    }
    
    this.router.navigate([route], { 
      queryParams: { 
        id: interventionId,
        focus: 'true'
      } 
    });
  }

  // ==================== WALLET / PORTEFEUILLE ====================
  loadClientTransactions(clientId: number, showAll: boolean = false) {
    this.walletLoading = true;
    this.transactions = [];
    this.transactionsLimited = [];
    this.totalPaye = 0;
    this.nombreTransactions = 0;
    this.cdr.detectChanges();

    this.apiService.getClient(clientId).subscribe({
      next: (client) => {
        if (!client || !client.societe) {
          console.warn('Client sans société, impossible de charger les transactions');
          this.walletLoading = false;
          this.cdr.detectChanges();
          return;
        }

        this.apiService.getTransactionsByClientSociete(client.societe).subscribe({
          next: (data) => {
            console.log('Transactions reçues pour le client', client.societe, data);
            this.transactions = data || [];
            
            const sorted = [...this.transactions].sort((a, b) => 
              new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime()
            );
            this.transactionsLimited = sorted.slice(0, 3);
            
            if (showAll && this.isAdmin) {
              this.calculerStatistiquesWallet();
            }
            this.walletLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur chargement transactions:', err);
            this.walletLoading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Erreur récupération client:', err);
        this.walletLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculerStatistiquesWallet() {
    const transactionsValides = this.transactions.filter(t => t.statut === 'VALIDE');
    this.nombreTransactions = transactionsValides.length;
    this.totalPaye = transactionsValides.reduce((sum, t) => sum + (t.montant || 0), 0);
    this.montantMoyen = this.nombreTransactions > 0 ? this.totalPaye / this.nombreTransactions : 0;
    this.derniereTransaction = transactionsValides.length > 0
      ? transactionsValides.sort((a, b) => new Date(b.dateTransaction).getTime() - new Date(a.dateTransaction).getTime())[0]
      : null;
  }

  getDerniereTransactionDate(): string {
    if (this.derniereTransaction?.dateTransaction) {
      const date = new Date(this.derniereTransaction.dateTransaction);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return '-';
  }

  // ==================== EXPORT ====================
  exportClientsCSV(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const dataToExport: any[] = [];
    const promises = this.filteredClients.map(client => {
      return new Promise((resolve) => {
        if (client.societe) {
          this.apiService.getInterventionsByClient(client.societe).subscribe({
            next: (data) => {
              const interventions = data || [];
              dataToExport.push({
                ...client,
                negociateur: client.negociateur ? 'Oui' : 'Non',
                clientFidele: client.clientFidele ? 'Oui' : 'Non',
                note: client.note || '-',
                comportement: client.comportement || '-',
                statutPaiement: client.statutPaiement || '-',
                nombreAvertissements: client.nombreAvertissements || 0,
                nbInterventions: interventions.length,
                nbPayees: interventions.filter((i: any) => i.statutPaiement === 'PAYE' || (i.montantTotal > 0 && i.montantPaye >= i.montantTotal)).length,
                nbNonPayees: interventions.filter((i: any) => i.statutPaiement !== 'PAYE' && !(i.montantTotal > 0 && i.montantPaye >= i.montantTotal)).length,
                interventions: interventions.map((i: any) => 
                  `[${i.numeroOrdre}] ${i.bascule || 'N/A'} - ${i.statutIntervention || 'EN_ATTENTE'} - ${i.montantTotal || 0}DT`
                ).join(' | ')
              });
              resolve(true);
            },
            error: () => {
              dataToExport.push({
                ...client,
                negociateur: client.negociateur ? 'Oui' : 'Non',
                clientFidele: client.clientFidele ? 'Oui' : 'Non',
                note: client.note || '-',
                comportement: client.comportement || '-',
                statutPaiement: client.statutPaiement || '-',
                nombreAvertissements: client.nombreAvertissements || 0,
                nbInterventions: 0,
                nbPayees: 0,
                nbNonPayees: 0,
                interventions: 'Aucune intervention'
              });
              resolve(false);
            }
          });
        } else {
          dataToExport.push({
            ...client,
            negociateur: client.negociateur ? 'Oui' : 'Non',
            clientFidele: client.clientFidele ? 'Oui' : 'Non',
            note: client.note || '-',
            comportement: client.comportement || '-',
            statutPaiement: client.statutPaiement || '-',
            nombreAvertissements: client.nombreAvertissements || 0,
            nbInterventions: 0,
            nbPayees: 0,
            nbNonPayees: 0,
            interventions: 'Aucune intervention'
          });
          resolve(false);
        }
      });
    });

    Promise.all(promises).then(() => {
      this.loading = false;
      this.cdr.detectChanges();

      const columns = [
        { key: 'societe', label: 'Société' },
        { key: 'responsable', label: 'Responsable' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'email', label: 'Email' },
        { key: 'adresse', label: 'Adresse' },
        { key: 'comportement', label: 'Comportement' },
        { key: 'note', label: 'Note' },
        { key: 'statutPaiement', label: 'Statut Paiement' },
        { key: 'negociateur', label: 'Négociateur' },
        { key: 'clientFidele', label: 'Fidèle' },
        { key: 'nombreAvertissements', label: 'Avertissements' },
        { key: 'nbInterventions', label: 'Nb Interventions' },
        { key: 'nbPayees', label: 'Nb Payées' },
        { key: 'nbNonPayees', label: 'Nb Non Payées' },
        { key: 'interventions', label: 'Détails Interventions' }
      ];

      this.exportService.exportToCSV(
        dataToExport,
        `clients_${new Date().toISOString().slice(0,10)}`,
        columns
      );
    });
  }

  exportClientsPDF(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const dataToExport: any[] = [];
    const promises = this.filteredClients.map(client => {
      return new Promise((resolve) => {
        if (client.societe) {
          this.apiService.getInterventionsByClient(client.societe).subscribe({
            next: (data) => {
              dataToExport.push({
                ...client,
                interventions: data || []
              });
              resolve(true);
            },
            error: () => {
              dataToExport.push({
                ...client,
                interventions: []
              });
              resolve(false);
            }
          });
        } else {
          dataToExport.push({
            ...client,
            interventions: []
          });
          resolve(false);
        }
      });
    });

    Promise.all(promises).then(() => {
      this.loading = false;
      this.cdr.detectChanges();
      this.exportService.exportToPDF(
        dataToExport,
        'Liste des Clients avec Interventions',
        `clients_${new Date().toISOString().slice(0,10)}`
      );
    });
  }

  // ==================== HELPERS ====================
  getComportementColor(comportement: string): string {
    const found = this.comportements.find(c => c.value === comportement);
    return found ? found.color : 'secondary';
  }

  getComportementIcon(comportement: string): string {
    const found = this.comportements.find(c => c.value === comportement);
    return found ? found.icon : 'bi-person';
  }

  getPaiementColor(statut: string): string {
    const found = this.statutsPaiement.find(s => s.value === statut);
    return found ? found.color : 'secondary';
  }

  getPaiementLabel(statut: string): string {
    const found = this.statutsPaiement.find(s => s.value === statut);
    return found ? found.label : 'Non renseigné';
  }

  getStatutInterventionLabel(statut?: string): string {
    const labels: {[key: string]: string} = {
      'EN_ATTENTE': '🔵 En attente',
      'CONFIRME': '🟡 En cours',
      'ANNULE': '🔴 Annulé',
      'TERMINE': '🟢 Terminé'
    };
    return labels[statut || ''] || statut || 'Non défini';
  }

  getStatutInterventionClass(statut?: string): string {
    const classes: {[key: string]: string} = {
      'EN_ATTENTE': 'badge-secondary',
      'CONFIRME': 'badge-warning',
      'ANNULE': 'badge-danger',
      'TERMINE': 'badge-success'
    };
    return classes[statut || ''] || 'badge-secondary';
  }

  formatDate(date: string): string {
    if (!date) return 'Non renseigné';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}