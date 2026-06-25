// src/app/modules/clients/clients.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ApiService, Client } from '../../core/services/api.service';
import { TransactionClient } from '../../core/services/api.service';

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
  selectedTab: 'info' | 'wallet' = 'info';

  // Wallet
  transactions: TransactionClient[] = [];
  totalPaye: number = 0;
  nombreTransactions: number = 0;
  derniereTransaction: TransactionClient | null = null;
  montantMoyen: number = 0;

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
    private cdr: ChangeDetectorRef
  ) {
    this.clientForm = this.createForm();
    this.notesForm = this.createNotesForm();
  }

  ngOnInit() {
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

  // ==================== RECHERCHE ====================
  filterClients() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredClients = [...this.clients];
      return;
    }
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredClients = this.clients.filter(client =>
      client.societe?.toLowerCase().includes(term) ||
      client.responsable?.toLowerCase().includes(term) ||
      client.telephone?.includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.adresse?.toLowerCase().includes(term)
    );
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredClients = [...this.clients];
    this.cdr.detectChanges();
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
    this.loadClients();
  }

  // ==================== NOTES & ÉVALUATION ====================
  openNotesModal(client: Client) {
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

  // ==================== DÉTAILS CLIENT (avec onglets) ====================
  viewClientDetails(client: Client, tab: 'info' | 'wallet' = 'info') {
    this.selectedTab = tab;
    this.detailsLoading = true;
    this.showDetailsModal = true;
    this.cdr.detectChanges();

    this.apiService.getClient(client.id!).subscribe({
      next: (data) => {
        this.clientDetails = data;
        this.detailsLoading = false;
        this.cdr.detectChanges();
        if (tab === 'wallet' && client.id) {
          this.loadClientTransactions(client.id);
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
    this.selectedTab = 'info';
    this.cdr.detectChanges();
  }

  // ==================== WALLET / PORTEFEUILLE ====================
loadClientTransactions(clientId: number) {
  this.walletLoading = true;
  this.transactions = [];
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

      // Appel direct avec la société
      this.apiService.getTransactionsByClientSociete(client.societe).subscribe({
        next: (data) => {
          console.log('Transactions reçues pour le client', client.societe, data);
          this.transactions = data || [];
          this.calculerStatistiquesWallet();
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