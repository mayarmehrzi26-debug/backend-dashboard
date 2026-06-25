package sav_balances.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import sav_balances.entity.User;
import sav_balances.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/techniciens")
    public List<User> getTechniciens() {
        return userRepository.findByRole("TECHNICIEN");
    }

    @GetMapping("/techniciens/actifs")
    public List<User> getTechniciensActifs() {
        return userRepository.findByRoleAndEnabledTrue("TECHNICIEN");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User u = user.get();
        u.setPassword(null);
        return ResponseEntity.ok(u);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        // Vérifier si le nom d'utilisateur existe déjà
        if (userRepository.existsByUsername(user.getUsername())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Nom d'utilisateur déjà existant");
            return ResponseEntity.badRequest().body(error);
        }

        // Vérifier si l'email existe déjà
        if (user.getEmail() != null && userRepository.existsByEmail(user.getEmail())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Email déjà utilisé");
            return ResponseEntity.badRequest().body(error);
        }

        // Encoder le mot de passe
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setEnabled(true);
        
        // Si le rôle n'est pas défini, mettre USER par défaut
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }

        // ===== AJOUT: Vérifier que le téléphone est bien sauvegardé =====
        System.out.println("📞 Téléphone reçu: " + user.getTelephone());

        User savedUser = userRepository.save(user);
        savedUser.setPassword(null);
        
        System.out.println("✅ Utilisateur créé avec téléphone: " + savedUser.getTelephone());
        
        return ResponseEntity.ok(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        Optional<User> existingOpt = userRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User existing = existingOpt.get();

        // Mettre à jour les champs
        if (user.getUsername() != null && !user.getUsername().isEmpty()) {
            existing.setUsername(user.getUsername());
        }
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            existing.setEmail(user.getEmail());
        }
        if (user.getFullName() != null && !user.getFullName().isEmpty()) {
            existing.setFullName(user.getFullName());
        }
        if (user.getRole() != null && !user.getRole().isEmpty()) {
            existing.setRole(user.getRole());
        }
        if (user.getEnabled() != null) {
            existing.setEnabled(user.getEnabled());
        }
        // ===== AJOUT: Mettre à jour le téléphone =====
        if (user.getTelephone() != null) {
            existing.setTelephone(user.getTelephone());
        }

        // Si un nouveau mot de passe est fourni, le encoder
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            existing.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        User updatedUser = userRepository.save(existing);
        updatedUser.setPassword(null);
        
        System.out.println("✅ Utilisateur mis à jour avec téléphone: " + updatedUser.getTelephone());
        
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if ("admin".equals(user.get().getUsername())) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Impossible de supprimer l'administrateur principal");
            return ResponseEntity.badRequest().body(error);
        }

        userRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Utilisateur supprimé avec succès");
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleUserEnabled(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        user.setEnabled(!user.getEnabled());
        User updated = userRepository.save(user);
        updated.setPassword(null);
        return ResponseEntity.ok(updated);
    }
}