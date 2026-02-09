package com.samsung.merchandising_api.config;

import com.samsung.merchandising_api.model.Role;
import com.samsung.merchandising_api.model.User;
import com.samsung.merchandising_api.model.UserStatus;
import com.samsung.merchandising_api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Random;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Only seed if users table is empty
        if (userRepository.count() > 0) {
            System.out.println("Users table already contains data. Skipping seed.");
            return;
        }

        System.out.println("Seeding users data...");

        // Seed 6 SFOS with distinct names and regions
        List<User> sfosList = createSFOS();
        userRepository.saveAll(sfosList);
        System.out.println("Created 6 SFOS users");

        // Seed 50 Promoters and randomly assign each to one of the 6 SFOS
        List<User> promoters = createPromoters(sfosList);
        userRepository.saveAll(promoters);
        System.out.println("Created 50 Promoter users and assigned them to SFOS managers");

        System.out.println("Users seeding completed!");
    }

    private List<User> createSFOS() {
        String[] sfosNames = {
            "Ahmed Benali", "Fatima Alami", "Youssef Idrissi",
            "Sanae Berrada", "Khalid Tazi", "Nadia Chraibi"
        };
        
        String[] regions = {
            "Casablanca", "Rabat", "Marrakech",
            "Fès", "Tanger", "Agadir"
        };

        return java.util.stream.IntStream.range(0, 6)
                .mapToObj(i -> {
                    User sfos = new User();
                    sfos.setFullName(sfosNames[i]);
                    sfos.setEmail(sfosNames[i].toLowerCase().replace(" ", ".") + "@samsung.ma");
                    sfos.setPassword(passwordEncoder.encode("password123")); // Default password
                    sfos.setRole(Role.SFOS);
                    sfos.setStatus(UserStatus.ACTIVE);
                    sfos.setRegion(regions[i]);
                    return sfos;
                })
                .toList();
    }

    private List<User> createPromoters(List<User> sfosList) {
        String[] firstNames = {
            "Mohammed", "Fatima", "Ahmed", "Aicha", "Hassan", "Khadija",
            "Omar", "Sanae", "Youssef", "Nadia", "Khalid", "Souad",
            "Mehdi", "Laila", "Amine", "Salma", "Bilal", "Houda",
            "Rachid", "Samira", "Tarik", "Zineb", "Anas", "Imane",
            "Hamza", "Meriem", "Reda", "Nabila", "Said", "Karima"
        };

        String[] lastNames = {
            "Alaoui", "Benali", "Idrissi", "Berrada", "Tazi", "Chraibi",
            "Fassi", "El Idrissi", "Bennani", "Amrani", "Lahlou", "Bensaid",
            "Cherkaoui", "Mansouri", "Bouazza", "El Fassi", "Bennani", "Alami",
            "Tahiri", "Bouhaddou", "El Amrani", "Benslimane", "Cherif", "Bouazza",
            "El Ouazzani", "Bennani", "Alaoui", "Idrissi", "Berrada", "Tazi"
        };

        String[] regions = {
            "Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"
        };

        return java.util.stream.IntStream.range(0, 50)
                .mapToObj(i -> {
                    String firstName = firstNames[i % firstNames.length];
                    String lastName = lastNames[i % lastNames.length];
                    String fullName = firstName + " " + lastName;
                    
                    User promoter = new User();
                    promoter.setFullName(fullName);
                    promoter.setEmail((firstName + "." + lastName).toLowerCase().replace(" ", ".") + i + "@samsung.ma");
                    promoter.setPassword(passwordEncoder.encode("password123")); // Default password
                    promoter.setRole(Role.PROMOTER);
                    promoter.setStatus(UserStatus.ACTIVE);
                    promoter.setRegion(regions[i % regions.length]);
                    
                    // Randomly assign to one of the 6 SFOS
                    User randomSFOS = sfosList.get(random.nextInt(sfosList.size()));
                    promoter.setManager(randomSFOS);
                    
                    return promoter;
                })
                .toList();
    }
}
