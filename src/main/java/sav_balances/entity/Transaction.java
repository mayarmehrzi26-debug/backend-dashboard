// sav_balances/entity/Transaction.java
package sav_balances.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "intervention_id", nullable = false)
    @JsonIgnore
    private Intervention intervention;

    private Double montant;
    private LocalDateTime dateTransaction;

    @Enumerated(EnumType.STRING)
    private MethodePaiement methode;

    private String reference;
    private String notes;

    @Enumerated(EnumType.STRING)
    private StatutTransaction statut;

    // ===== NOUVEAUX CHAMPS POUR REMISE/PROMO =====
    private Double remise;
    private Double remisePourcentage;
    private String promoCode;

    public enum MethodePaiement {
        ESPECES, CHEQUE, VIREMENT, CARTE
    }

    public enum StatutTransaction {
        EN_ATTENTE, VALIDE, ANNULE
    }

    public Transaction() {
        this.dateTransaction = LocalDateTime.now();
        this.statut = StatutTransaction.VALIDE;
        this.remise = 0.0;
        this.remisePourcentage = 0.0;
        this.promoCode = "";
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Intervention getIntervention() { return intervention; }
    public void setIntervention(Intervention intervention) { this.intervention = intervention; }

    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }

    public LocalDateTime getDateTransaction() { return dateTransaction; }
    public void setDateTransaction(LocalDateTime dateTransaction) { this.dateTransaction = dateTransaction; }

    public MethodePaiement getMethode() { return methode; }
    public void setMethode(MethodePaiement methode) { this.methode = methode; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public StatutTransaction getStatut() { return statut; }
    public void setStatut(StatutTransaction statut) { this.statut = statut; }

    public Double getRemise() { return remise; }
    public void setRemise(Double remise) { this.remise = remise; }

    public Double getRemisePourcentage() { return remisePourcentage; }
    public void setRemisePourcentage(Double remisePourcentage) { this.remisePourcentage = remisePourcentage; }

    public String getPromoCode() { return promoCode; }
    public void setPromoCode(String promoCode) { this.promoCode = promoCode; }
}