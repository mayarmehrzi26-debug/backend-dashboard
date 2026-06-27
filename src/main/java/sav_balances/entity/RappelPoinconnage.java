package sav_balances.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class RappelPoinconnage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "intervention_id")
    private Intervention intervention;
    
    private String numeroOrdre;
    private String societe;
    private String equipement;
    private String reference;
    private String responsable;
    private String telephone;
    private String email;
    
    private LocalDateTime dateDernierPoinconnage;
    private LocalDateTime dateProchainPoinconnage;
    
    private Integer joursRestants;
    private String statut; // ACTIF, EN_COURS, EXPIRE, TRAITE
    
    private Boolean notifie; // true si déjà notifié
    
    private LocalDateTime dateCreation;
    private LocalDateTime dateNotification;
    
    // Constructeurs
    public RappelPoinconnage() {}
    
    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Intervention getIntervention() { return intervention; }
    public void setIntervention(Intervention intervention) { this.intervention = intervention; }
    
    public String getNumeroOrdre() { return numeroOrdre; }
    public void setNumeroOrdre(String numeroOrdre) { this.numeroOrdre = numeroOrdre; }
    
    public String getSociete() { return societe; }
    public void setSociete(String societe) { this.societe = societe; }
    
    public String getEquipement() { return equipement; }
    public void setEquipement(String equipement) { this.equipement = equipement; }
    
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    
    public String getResponsable() { return responsable; }
    public void setResponsable(String responsable) { this.responsable = responsable; }
    
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public LocalDateTime getDateDernierPoinconnage() { return dateDernierPoinconnage; }
    public void setDateDernierPoinconnage(LocalDateTime dateDernierPoinconnage) { 
        this.dateDernierPoinconnage = dateDernierPoinconnage; 
    }
    
    public LocalDateTime getDateProchainPoinconnage() { return dateProchainPoinconnage; }
    public void setDateProchainPoinconnage(LocalDateTime dateProchainPoinconnage) { 
        this.dateProchainPoinconnage = dateProchainPoinconnage; 
    }
    
    public Integer getJoursRestants() { return joursRestants; }
    public void setJoursRestants(Integer joursRestants) { this.joursRestants = joursRestants; }
    
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    
    public Boolean getNotifie() { return notifie; }
    public void setNotifie(Boolean notifie) { this.notifie = notifie; }
    
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    
    public LocalDateTime getDateNotification() { return dateNotification; }
    public void setDateNotification(LocalDateTime dateNotification) { 
        this.dateNotification = dateNotification; 
    }
}