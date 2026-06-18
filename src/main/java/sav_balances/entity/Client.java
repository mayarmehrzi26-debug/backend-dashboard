package sav_balances.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String societe;
    private String responsable;
    private String telephone;
    private String adresse;
    private String email;
    
    // ===== NOUVEAUX CHAMPS =====
    
    @Column(length = 1000)
    private String notes; // Notes générales sur le client
    
    private String comportement; // PROFESSIONNEL, DIFFICILE, IMPOLI, EXCELLENT
    
    private Integer note; // Note de 1 à 5 étoiles
    
    private String statutPaiement; // PONCTUEL, RETARD_OCCASIONNEL, RETARD_FREQUENT, TRES_RETARD
    
    private Boolean negociateur; // true = négocie beaucoup, false = normal
    
    private Boolean clientFidele; // true = client fidèle
    
    private Integer nombreAvertissements; // Nombre d'avertissements
    
    private LocalDateTime dernierContact;
    
    @Lob
    private String historiqueNotes; // Historique des notes (format JSON ou texte)

    // Getters et Setters
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
}