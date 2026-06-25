// sav_balances/dto/ClientWalletDTO.java
package sav_balances.dto;

import sav_balances.entity.Client;
import sav_balances.entity.Transaction;
import java.time.LocalDateTime;
import java.util.List;

public class ClientWalletDTO {
    private Long id;
    private String societe;
    private String responsable;
    private String telephone;
    private String adresse;
    private String email;
    private String notes;
    private String comportement;
    private Integer note;
    private String statutPaiement;
    private Boolean negociateur;
    private Boolean clientFidele;
    private Integer nombreAvertissements;
    private LocalDateTime dernierContact;
    private String historiqueNotes;
    
    // Statistiques du portefeuille
    private Double totalPaye;
    private Integer nombreTransactions;
    private Double montantMoyen;
    private TransactionDTO derniereTransaction;

    public ClientWalletDTO() {}

    public ClientWalletDTO(Client client, List<Transaction> transactions) {
        this.id = client.getId();
        this.societe = client.getSociete();
        this.responsable = client.getResponsable();
        this.telephone = client.getTelephone();
        this.adresse = client.getAdresse();
        this.email = client.getEmail();
        this.notes = client.getNotes();
        this.comportement = client.getComportement();
        this.note = client.getNote();
        this.statutPaiement = client.getStatutPaiement();
        this.negociateur = client.getNegociateur();
        this.clientFidele = client.getClientFidele();
        this.nombreAvertissements = client.getNombreAvertissements();
        this.dernierContact = client.getDernierContact();
        this.historiqueNotes = client.getHistoriqueNotes();
        
        // Calcul des statistiques
        List<Transaction> transactionsValides = transactions.stream()
                .filter(t -> t.getStatut() == Transaction.StatutTransaction.VALIDE)
                .toList();
        
        this.nombreTransactions = transactionsValides.size();
        this.totalPaye = transactionsValides.stream()
                .mapToDouble(Transaction::getMontant)
                .sum();
        this.montantMoyen = this.nombreTransactions > 0 ? this.totalPaye / this.nombreTransactions : 0;
        
        this.derniereTransaction = transactionsValides.stream()
                .max((t1, t2) -> t1.getDateTransaction().compareTo(t2.getDateTransaction()))
                .map(TransactionDTO::new)
                .orElse(null);
    }

    // Getters et setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSociete() { return societe; }
    public void setSociete(String societe) { this.societe = societe; }

    public String getResponsable() { return responsable; }
    public void setResponsable(String responsable) { this.responsable = responsable; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getComportement() { return comportement; }
    public void setComportement(String comportement) { this.comportement = comportement; }

    public Integer getNote() { return note; }
    public void setNote(Integer note) { this.note = note; }

    public String getStatutPaiement() { return statutPaiement; }
    public void setStatutPaiement(String statutPaiement) { this.statutPaiement = statutPaiement; }

    public Boolean getNegociateur() { return negociateur; }
    public void setNegociateur(Boolean negociateur) { this.negociateur = negociateur; }

    public Boolean getClientFidele() { return clientFidele; }
    public void setClientFidele(Boolean clientFidele) { this.clientFidele = clientFidele; }

    public Integer getNombreAvertissements() { return nombreAvertissements; }
    public void setNombreAvertissements(Integer nombreAvertissements) { this.nombreAvertissements = nombreAvertissements; }

    public LocalDateTime getDernierContact() { return dernierContact; }
    public void setDernierContact(LocalDateTime dernierContact) { this.dernierContact = dernierContact; }

    public String getHistoriqueNotes() { return historiqueNotes; }
    public void setHistoriqueNotes(String historiqueNotes) { this.historiqueNotes = historiqueNotes; }

    public Double getTotalPaye() { return totalPaye; }
    public void setTotalPaye(Double totalPaye) { this.totalPaye = totalPaye; }

    public Integer getNombreTransactions() { return nombreTransactions; }
    public void setNombreTransactions(Integer nombreTransactions) { this.nombreTransactions = nombreTransactions; }

    public Double getMontantMoyen() { return montantMoyen; }
    public void setMontantMoyen(Double montantMoyen) { this.montantMoyen = montantMoyen; }

    public TransactionDTO getDerniereTransaction() { return derniereTransaction; }
    public void setDerniereTransaction(TransactionDTO derniereTransaction) { this.derniereTransaction = derniereTransaction; }
}