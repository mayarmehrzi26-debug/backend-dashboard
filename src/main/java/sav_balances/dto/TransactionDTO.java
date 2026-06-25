// sav_balances/dto/TransactionDTO.java
package sav_balances.dto;

import sav_balances.entity.Transaction;
import java.time.LocalDateTime;

public class TransactionDTO {
    private Long id;
    private Double montant;
    private LocalDateTime dateTransaction;
    private String methode;
    private String reference;
    private String notes;
    private String statut;
    private Double remise;
    private Double remisePourcentage;
    private String promoCode;
    private Long interventionId;

    public TransactionDTO() {}

    public TransactionDTO(Transaction transaction) {
        this.id = transaction.getId();
        this.montant = transaction.getMontant();
        this.dateTransaction = transaction.getDateTransaction();
        this.methode = transaction.getMethode() != null ? transaction.getMethode().name() : null;
        this.reference = transaction.getReference();
        this.notes = transaction.getNotes();
        this.statut = transaction.getStatut() != null ? transaction.getStatut().name() : null;
        this.remise = transaction.getRemise();
        this.remisePourcentage = transaction.getRemisePourcentage();
        this.promoCode = transaction.getPromoCode();
        this.interventionId = transaction.getIntervention() != null ? transaction.getIntervention().getId() : null;
    }

    // Getters et setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Double getRemise() { return remise; }
    public void setRemise(Double remise) { this.remise = remise; }

    public Double getRemisePourcentage() { return remisePourcentage; }
    public void setRemisePourcentage(Double remisePourcentage) { this.remisePourcentage = remisePourcentage; }

    public String getPromoCode() { return promoCode; }
    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }

    public Long getInterventionId() { return interventionId; }
    public void setInterventionId(Long interventionId) { this.interventionId = interventionId; }
}