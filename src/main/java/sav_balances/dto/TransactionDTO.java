package sav_balances.dto;

import sav_balances.entity.Transaction;
import java.time.LocalDateTime;

public class TransactionDTO {
    private Long id;
    private Long interventionId;
    private Double montant;
    private LocalDateTime dateTransaction;
    private String methode;
    private String reference;
    private String notes;
    private String statut;

    public TransactionDTO(Transaction transaction) {
        this.id = transaction.getId();
        this.interventionId = transaction.getIntervention() != null ? 
                              transaction.getIntervention().getId() : null;
        this.montant = transaction.getMontant();
        this.dateTransaction = transaction.getDateTransaction();
        this.methode = transaction.getMethode() != null ? 
                       transaction.getMethode().name() : null;
        this.reference = transaction.getReference();
        this.notes = transaction.getNotes();
        this.statut = transaction.getStatut() != null ? 
                      transaction.getStatut().name() : null;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getInterventionId() { return interventionId; }
    public void setInterventionId(Long interventionId) { this.interventionId = interventionId; }

    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }

    public LocalDateTime getDateTransaction() { return dateTransaction; }
    public void setDateTransaction(LocalDateTime dateTransaction) { this.dateTransaction = dateTransaction; }

    public String getMethode() { return methode; }
    public void setMethode(String methode) { this.methode = methode; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}