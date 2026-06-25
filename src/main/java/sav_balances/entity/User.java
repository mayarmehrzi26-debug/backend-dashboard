package sav_balances.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    private String email;
    
    private String role; // ADMIN, TECHNICIEN, USER
    
    private String fullName;
    
    @Column(name = "telephone")
    private String telephone; // ← NOUVEAU
    
    private Boolean enabled = true;
    
    private LocalDateTime lastLogin;
    
    private LocalDateTime createdAt;
    
    // Rôles possibles
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_TECHNICIEN = "TECHNICIEN";
    public static final String ROLE_USER = "USER";
    
    // Constructeurs
    public User() {}
    
    public User(String username, String password, String email, String role, String fullName) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.role = role;
        this.fullName = fullName;
        this.createdAt = LocalDateTime.now();
        this.enabled = true;
    }
    
    // Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getTelephone() { return telephone; } // ← NOUVEAU
    public void setTelephone(String telephone) { this.telephone = telephone; } // ← NOUVEAU
    
    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
    
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public boolean isTechnicien() {
        return ROLE_TECHNICIEN.equals(this.role);
    }
    
    public boolean isAdmin() {
        return ROLE_ADMIN.equals(this.role);
    }
}