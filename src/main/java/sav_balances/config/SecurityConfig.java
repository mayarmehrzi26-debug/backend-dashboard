package sav_balances.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import sav_balances.security.JwtAuthenticationFilter;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // ===== ENDPOINTS PUBLICS =====
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/export/**").permitAll()
                
                // ===== ADMIN UNIQUEMENT =====
                // Gestion des utilisateurs
                .requestMatchers(HttpMethod.POST, "/api/users").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/users/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/users/**").hasAuthority("ROLE_ADMIN")
                
                // DELETE sur les interventions
                .requestMatchers(HttpMethod.DELETE, "/api/interventions/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/interventions/**").hasAuthority("ROLE_ADMIN")
                
                // Clients (POST, PUT, DELETE)
                .requestMatchers(HttpMethod.POST, "/api/clients").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/clients/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/clients/**").hasAuthority("ROLE_ADMIN")
                
                // Balances
                .requestMatchers(HttpMethod.POST, "/api/balances").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/balances/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/balances/**").hasAuthority("ROLE_ADMIN")
                
                // Prestations
                .requestMatchers(HttpMethod.POST, "/api/prestations").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/prestations/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/prestations/**").hasAuthority("ROLE_ADMIN")
                
                // Stats
                .requestMatchers("/api/stats/**").hasAuthority("ROLE_ADMIN")

                // ===== LECTURE POUR TOUS (authentifiés) =====
                .requestMatchers(HttpMethod.GET, "/api/interventions").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/interventions/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/interventions/type/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/clients").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/clients/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/balances").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/balances/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/prestations").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/prestations/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/users/techniciens").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/users/techniciens/**").authenticated()
                
                // ===== CRÉATION POUR USER + ADMIN =====
                // ✅ TOUT LE MONDE peut créer une intervention (interne et externe)
                .requestMatchers(HttpMethod.POST, "/api/interventions").authenticated()
                
                // ===== TRANSACTIONS - POUR TOUS =====
                .requestMatchers(HttpMethod.POST, "/api/transactions/intervention/{id}/date").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/transactions/intervention/{id}").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/transactions/intervention/{id}").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/transactions/client/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/transactions/**").hasAuthority("ROLE_ADMIN")
                
                // ===== INTERVENTIONS CLIENT =====
                .requestMatchers(HttpMethod.GET, "/api/interventions/client/**").authenticated()
                
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}