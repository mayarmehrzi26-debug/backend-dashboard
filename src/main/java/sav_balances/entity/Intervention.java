package sav_balances.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import java.util.List;

@Entity
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numeroOrdre;
    private String societe;
    private String bascule;
    private String reference;
    private String responsable;
    private String adresse;
    private String telephone;
    private String email;
    private String reclamation;
    private String technicien;
    private LocalDateTime dateReclamation;
    private LocalDateTime dateOrdre;
    
    @Lob
    private String rapportIntervention;
    
    @ManyToOne
    @JoinColumn(name = "prestation_id")
    private Prestation prestation;
    
    private Double prixEstime;
    private Double prixReel;
    private String type;

    // Champs paiement
    private Double montantTotal = 0.0;
    private Double montantPaye = 0.0;
    private Double montantRestant = 0.0;
    
    @Enumerated(EnumType.STRING)
    private StatutPaiement statutPaiement = StatutPaiement.EN_ATTENTE;
    
    private LocalDateTime dateEcheance;

    @OneToMany(mappedBy = "intervention", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Transaction> transactions;

    public enum StatutPaiement {
        EN_ATTENTE, PARTIEL, PAYE, EN_RETARD, ANNULE
    }

    public Intervention() {
        this.montantTotal = 0.0;
        this.montantPaye = 0.0;
        this.montantRestant = 0.0;
        this.statutPaiement = StatutPaiement.EN_ATTENTE;
    }

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroOrdre() { return numeroOrdre; }
    public void setNumeroOrdre(String numeroOrdre) { this.numeroOrdre = numeroOrdre; }

    public String getSociete() { return societe; }
    public void setSociete(String societe) { this.societe = societe; }

    public String getBascule() { return bascule; }
    public void setBascule(String bascule) { this.bascule = bascule; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getResponsable() { return responsable; }
    public void setResponsable(String responsable) { this.responsable = responsable; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getReclamation() { return reclamation; }
    public void setReclamation(String reclamation) { this.reclamation = reclamation; }

    public String getTechnicien() { return technicien; }
    public void setTechnicien(String technicien) { this.technicien = technicien; }

    public LocalDateTime getDateReclamation() { return dateReclamation; }
    public void setDateReclamation(LocalDateTime dateReclamation) { this.dateReclamation = dateReclamation; }

    public LocalDateTime getDateOrdre() { return dateOrdre; }
    public void setDateOrdre(LocalDateTime dateOrdre) { this.dateOrdre = dateOrdre; }

    public String getRapportIntervention() { return rapportIntervention; }
    public void setRapportIntervention(String rapportIntervention) { this.rapportIntervention = rapportIntervention; }
    
    public Prestation getPrestation() { return prestation; }
    public void setPrestation(Prestation prestation) { this.prestation = prestation; }
    
    public Double getPrixEstime() { return prixEstime; }
    public void setPrixEstime(Double prixEstime) { this.prixEstime = prixEstime; }
    
    public Double getPrixReel() { return prixReel; }
    public void setPrixReel(Double prixReel) { this.prixReel = prixReel; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    // Getters et Setters paiement
    public Double getMontantTotal() { return montantTotal; }
    public void setMontantTotal(Double montantTotal) { this.montantTotal = montantTotal; }

    public Double getMontantPaye() { return montantPaye; }
    public void setMontantPaye(Double montantPaye) { this.montantPaye = montantPaye; }

    public Double getMontantRestant() { return montantRestant; }
    public void setMontantRestant(Double montantRestant) { this.montantRestant = montantRestant; }

    public StatutPaiement getStatutPaiement() { return statutPaiement; }
    public void setStatutPaiement(StatutPaiement statutPaiement) { this.statutPaiement = statutPaiement; }

    public LocalDateTime getDateEcheance() { return dateEcheance; }
    public void setDateEcheance(LocalDateTime dateEcheance) { this.dateEcheance = dateEcheance; }

    public List<Transaction> getTransactions() { return transactions; }
    public void setTransactions(List<Transaction> transactions) { this.transactions = transactions; }
}