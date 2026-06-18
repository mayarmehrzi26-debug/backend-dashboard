package sav_balances.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import sav_balances.dto.LoginRequest;
import sav_balances.dto.LoginResponse;
import sav_balances.entity.User;
import sav_balances.repository.UserRepository;
import sav_balances.security.JwtService;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtService jwtService;
    
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    
    public LoginResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        
        if (userOpt.isEmpty()) {
            return new LoginResponse(null, null, null, null, "Utilisateur non trouvé");
        }
        
        User user = userOpt.get();
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new LoginResponse(null, null, null, null, "Mot de passe incorrect");
        }
        
        if (!user.getEnabled()) {
            return new LoginResponse(null, null, null, null, "Compte désactivé");
        }
        
        // Mettre à jour la date de dernier login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        String token = jwtService.generateToken(user.getUsername(), user.getRole(), user.getFullName());
        
        return new LoginResponse(token, user.getUsername(), user.getRole(), user.getFullName(), "Connexion réussie");
    }
    
    public boolean register( User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return false;
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setEnabled(true);
        userRepository.save(user);
        return true;
    }
    
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}