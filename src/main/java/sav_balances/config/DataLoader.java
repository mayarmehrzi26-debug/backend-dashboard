package sav_balances.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import sav_balances.entity.User;
import sav_balances.repository.UserRepository;

import java.time.LocalDateTime;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Créer l'utilisateur ADMIN
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setEmail("admin@sav-balances.com");
            admin.setRole("ADMIN");
            admin.setFullName("Administrateur");
            admin.setEnabled(true);
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);
            System.out.println("✅ Utilisateur ADMIN créé: admin / admin123");
        }

        // Créer l'utilisateur USER (consultation uniquement)
        if (!userRepository.existsByUsername("user")) {
            User user = new User();
            user.setUsername("user");
            user.setPassword(passwordEncoder.encode("user123"));
            user.setEmail("user@sav-balances.com");
            user.setRole("USER");
            user.setFullName("Utilisateur Standard");
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());
            userRepository.save(user);
            System.out.println("✅ Utilisateur USER créé: user / user123");
        }
        
        // Afficher les utilisateurs existants
        System.out.println("📋 Utilisateurs existants:");
        userRepository.findAll().forEach(u -> 
            System.out.println("   - " + u.getUsername() + " (" + u.getRole() + ")")
        );
    }
}