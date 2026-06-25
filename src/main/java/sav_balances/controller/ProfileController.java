// sav_balances/controller/ProfileController.java
package sav_balances.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import sav_balances.entity.User;
import sav_balances.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:4200")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping("/{username}")
    public ResponseEntity<?> getProfile(@PathVariable String username) {
        System.out.println("📱 getProfile - Recherche de l'utilisateur: '" + username + "'");
        
        // Nettoyer le username (trim et lowercase)
        String cleanUsername = username.trim().toLowerCase();
        System.out.println("📱 Username nettoyé: '" + cleanUsername + "'");
        
        // Chercher avec le username nettoyé
        Optional<User> userOpt = userRepository.findByUsername(cleanUsername);
        
        // Si pas trouvé, essayer avec le username original (sans trim)
        if (userOpt.isEmpty()) {
            System.out.println("🔍 Essai avec username original: '" + username + "'");
            userOpt = userRepository.findByUsername(username);
        }
        
        // Si toujours pas trouvé, chercher tous les utilisateurs pour debug
        if (userOpt.isEmpty()) {
            System.out.println("🔍 Liste des utilisateurs existants:");
            userRepository.findAll().forEach(u -> 
                System.out.println("   - '" + u.getUsername() + "' (ID: " + u.getId() + ")")
            );
            
            Map<String, String> error = new HashMap<>();
            error.put("message", "Utilisateur non trouvé: " + username);
            error.put("username", username);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
        
        User user = userOpt.get();
        user.setPassword(null);
        System.out.println("✅ Profil trouvé: '" + user.getUsername() + "'");
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{username}")
    public ResponseEntity<?> updateProfile(@PathVariable String username, @RequestBody User user) {
        System.out.println("📱 updateProfile - Mise à jour de: '" + username + "'");
        
        String cleanUsername = username.trim().toLowerCase();
        Optional<User> existingOpt = userRepository.findByUsername(cleanUsername);
        
        if (existingOpt.isEmpty()) {
            existingOpt = userRepository.findByUsername(username);
        }
        
        if (existingOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Utilisateur non trouvé");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        User existing = existingOpt.get();

        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            existing.setEmail(user.getEmail());
        }
        if (user.getFullName() != null && !user.getFullName().isEmpty()) {
            existing.setFullName(user.getFullName());
        }
        if (user.getTelephone() != null) {
            existing.setTelephone(user.getTelephone());
        }

        User updatedUser = userRepository.save(existing);
        updatedUser.setPassword(null);
        System.out.println("✅ Profil mis à jour: '" + updatedUser.getUsername() + "'");
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/{username}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable String username,
            @RequestBody Map<String, String> passwords) {
        
        System.out.println("📱 changePassword - Changement pour: '" + username + "'");
        
        String cleanUsername = username.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByUsername(cleanUsername);
        
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(username);
        }
        
        if (userOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Utilisateur non trouvé");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        User user = userOpt.get();
        String oldPassword = passwords.get("oldPassword");
        String newPassword = passwords.get("newPassword");

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Ancien mot de passe incorrect");
            return ResponseEntity.badRequest().body(error);
        }

        if (newPassword == null || newPassword.length() < 6) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Le nouveau mot de passe doit contenir au moins 6 caractères");
            return ResponseEntity.badRequest().body(error);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Mot de passe modifié avec succès");
        System.out.println("✅ Mot de passe modifié pour: '" + username + "'");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{username}/telephone")
    public ResponseEntity<?> updateTelephone(
            @PathVariable String username,
            @RequestBody Map<String, String> telephone) {
        
        System.out.println("📱 updateTelephone - Mise à jour pour: '" + username + "'");
        
        String cleanUsername = username.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByUsername(cleanUsername);
        
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(username);
        }
        
        if (userOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Utilisateur non trouvé");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        User user = userOpt.get();
        String newTelephone = telephone.get("telephone");
        
        if (newTelephone != null) {
            user.setTelephone(newTelephone);
            userRepository.save(user);
            user.setPassword(null);
            System.out.println("✅ Téléphone mis à jour pour: '" + username + "'");
            return ResponseEntity.ok(user);
        }

        Map<String, String> error = new HashMap<>();
        error.put("message", "Numéro de téléphone invalide");
        return ResponseEntity.badRequest().body(error);
    }
}