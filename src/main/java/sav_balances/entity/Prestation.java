package sav_balances.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "prestations")
public class Prestation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code;
    
    private String nom;
    
    @Column(length = 500)
    private String description;
    
    private Double prixForfait;
    
    private Double prixHeure;
    
    private Integer dureeEstimeeHeures;
    
    private Boolean actif = true;
    
    private Integer ordreAffichage;
    
    // Constructeurs
    public Prestation() {}
    
    public Prestation(String code, String nom, String description, Double prixForfait, Double prixHeure, Integer dureeEstimeeHeures, Integer ordreAffichage) {
        this.code = code;
        this.nom = nom;
        this.description = description;
        this.prixForfait = prixForfait;
        this.prixHeure = prixHeure;
        this.dureeEstimeeHeures = dureeEstimeeHeures;
        this.ordreAffichage = ordreAffichage;
        this.actif = true;
    }
    
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