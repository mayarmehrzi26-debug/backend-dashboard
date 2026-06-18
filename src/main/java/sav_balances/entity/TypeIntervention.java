package sav_balances.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "type_intervention")
public class TypeIntervention {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code; // INSTALLATION, REPARATION, MAINTENANCE, etc.
    
    private String nom;
    
    private String description;
    
    private Double prixForfait; // Prix forfaitaire (ex: 150 DT)
    
    private Double prixHeure; // Prix à l'heure (ex: 45 DT/h)
    
    private Integer dureeEstimeeHeures; // Durée estimée en heures
    
    private Boolean actif = true;
    
    private Integer ordreAffichage;
    
    // Constructeurs
    public TypeIntervention() {}
    
    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Double getPrixForfait() { return prixForfait; }
    public void setPrixForfait(Double prixForfait) { this.prixForfait = prixForfait; }
    
    public Double getPrixHeure() { return prixHeure; }
    public void setPrixHeure(Double prixHeure) { this.prixHeure = prixHeure; }
    
    public Integer getDureeEstimeeHeures() { return dureeEstimeeHeures; }
    public void setDureeEstimeeHeures(Integer dureeEstimeeHeures) { this.dureeEstimeeHeures = dureeEstimeeHeures; }
    
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
    
    public Integer getOrdreAffichage() { return ordreAffichage; }
    public void setOrdreAffichage(Integer ordreAffichage) { this.ordreAffichage = ordreAffichage; }
}