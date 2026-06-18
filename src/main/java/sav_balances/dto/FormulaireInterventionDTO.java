package sav_balances.dto;

import java.time.LocalDateTime;

public class FormulaireInterventionDTO {
    private Long id;
    private String numeroOrdre;
    private String societe;
    private String bascule;
    private String responsable;
    private String adresse;
    private String telephone;
    private String email;
    private String reclamation;
    private String technicien;
    private LocalDateTime dateReclamation;
    private LocalDateTime dateOrdre;
    private String rapportIntervention;
    private Double montantTotal;
    private Double solde;

    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroOrdre() { return numeroOrdre; }
    public void setNumeroOrdre(String numeroOrdre) { this.numeroOrdre = numeroOrdre; }

    public String getSociete() { return societe; }
    public void setSociete(String societe) { this.societe = societe; }

    public String getBascule() { return bascule; }
    public void setBascule(String bascule) { this.bascule = bascule; }

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

    public Double getMontantTotal() { return montantTotal; }
    public void setMontantTotal(Double montantTotal) { this.montantTotal = montantTotal; }

    public Double getSolde() { return solde; }
    public void setSolde(Double solde) { this.solde = solde; }
}