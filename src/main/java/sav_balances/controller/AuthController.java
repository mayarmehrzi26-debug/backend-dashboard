package sav_balances.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import sav_balances.dto.LoginRequest;
import sav_balances.dto.LoginResponse;
import sav_balances.entity.User;
import sav_balances.repository.UserRepository;
import sav_balances.security.JwtService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("Tentative de connexion: " + request.getUsername());

        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());

        if (userOpt.isEmpty()) {
            System.out.println("Utilisateur non trouvé: " + request.getUsername());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Utilisateur non trouvé");
            return ResponseEntity.badRequest().body(error);
        }

        User user = userOpt.get();
        System.out.println("Utilisateur trouvé: " + user.getUsername());

        // Vérification du mot de passe (le PasswordEncoder est utilisé dans le service)
        // Ici on utilise le service AuthService ou on encode directement
        
        if (!new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().matches(request.getPassword(), user.getPassword())) {
            System.out.println("Mot de passe incorrect pour: " + request.getUsername());
            Map<String, String> error = new HashMap<>();
            error.put("message", "Mot de passe incorrect");
            return ResponseEntity.badRequest().body(error);
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user.getUsername(), user.getRole(), user.getFullName());

        LoginResponse response = new LoginResponse(
            token,
            user.getUsername(),
            user.getRole(),
            user.getFullName(),
            "Connexion réussie"
        );

        System.out.println("Connexion réussie pour: " + user.getUsername() + " (Rôle: " + user.getRole() + ")");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        System.out.println("Tentative d'inscription: " + user.getUsername());

        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body("Nom d'utilisateur déjà existant");
        }

        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("Email déjà utilisé");
        }

        user.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setEnabled(true);
        if (user.getRole() == null) {
            user.setRole("USER");
        }
        userRepository.save(user);

        System.out.println("Utilisateur créé: " + user.getUsername());
        return ResponseEntity.ok("Utilisateur créé avec succès");
    }
}