// sav_balances/config/DataInitializer.java
package sav_balances.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import sav_balances.entity.User;
import sav_balances.repository.UserRepository;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Créer un admin par défaut s'il n'existe pas
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setEmail("admin@balancenafis.com");
            admin.setRole("ADMIN");
            admin.setFullName("Administrateur");
            admin.setEnabled(true);
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);
            System.out.println("✅ Admin créé : admin / admin123");
        }

        // Créer un user normal par défaut s'il n'existe pas
        if (!userRepository.existsByUsername("user")) {
            User user = new User();
            user.setUsername("user");
            user.setPassword(passwordEncoder.encode("user123"));
            user.setEmail("user@balancenafis.com");
            user.setRole("USER");
            user.setFullName("Utilisateur Standard");
            user.setEnabled(true);
            user.setCreatedAt(LocalDateTime.now());
            userRepository.save(user);
            System.out.println("✅ User créé : user / user123");
        }
    }
}