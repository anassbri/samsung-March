package com.samsung.merchandising_api.service;

import com.samsung.merchandising_api.dto.UserCreateDTO;
import com.samsung.merchandising_api.dto.UserResponseDTO;
import com.samsung.merchandising_api.dto.UserStatsDTO;
import com.samsung.merchandising_api.model.Role;
import com.samsung.merchandising_api.model.User;
import com.samsung.merchandising_api.model.UserStatus;
import com.samsung.merchandising_api.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Get user statistics (counts by role)
     */
    public UserStatsDTO getUserStats() {
        Long sfosCount = userRepository.countByRole(Role.SFOS);
        Long promoterCount = userRepository.countByRole(Role.PROMOTER);
        Long supervisorCount = userRepository.countByRole(Role.SUPERVISOR);
        
        return new UserStatsDTO(sfosCount, promoterCount, supervisorCount);
    }

    /**
     * Get all users with pagination and optional role filter
     */
    public Page<UserResponseDTO> getAllUsers(Pageable pageable, Role roleFilter) {
        Page<User> users;
        if (roleFilter != null) {
            users = userRepository.findByRole(roleFilter, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }
        return users.map(UserResponseDTO::fromUser);
    }

    /**
     * Get user by ID
     */
    public Optional<UserResponseDTO> getUserById(Long id) {
        return userRepository.findById(id)
                .map(UserResponseDTO::fromUser);
    }

    /**
     * Create a new user
     * If role is PROMOTER, requires sfosId
     */
    @Transactional
    public UserResponseDTO createUser(UserCreateDTO dto) {
        // Validate email uniqueness
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists: " + dto.getEmail());
        }

        // Validate PROMOTER requires manager
        if (dto.getRole() == Role.PROMOTER && dto.getSfosId() == null) {
            throw new IllegalArgumentException("PROMOTER role requires an SFOS manager (sfosId)");
        }

        User user = new User();
        user.setFullName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword())); // Hash password
        user.setRole(dto.getRole());
        user.setRegion(dto.getRegion());
        user.setStatus(UserStatus.ACTIVE);

        // Set manager if PROMOTER
        if (dto.getRole() == Role.PROMOTER && dto.getSfosId() != null) {
            User manager = userRepository.findById(dto.getSfosId())
                    .orElseThrow(() -> new IllegalArgumentException("SFOS manager not found with id: " + dto.getSfosId()));
            
            if (manager.getRole() != Role.SFOS) {
                throw new IllegalArgumentException("Manager must be an SFOS, not " + manager.getRole());
            }
            
            user.setManager(manager);
        }

        User savedUser = userRepository.save(user);
        return UserResponseDTO.fromUser(savedUser);
    }

    /**
     * Assign a promoter to an SFOS manager
     */
    @Transactional
    public UserResponseDTO assignPromoterToSFOS(Long promoterId, Long sfosId) {
        User promoter = userRepository.findById(promoterId)
                .orElseThrow(() -> new IllegalArgumentException("Promoter not found with id: " + promoterId));
        
        if (promoter.getRole() != Role.PROMOTER) {
            throw new IllegalArgumentException("User is not a PROMOTER");
        }

        User sfos = userRepository.findById(sfosId)
                .orElseThrow(() -> new IllegalArgumentException("SFOS not found with id: " + sfosId));
        
        if (sfos.getRole() != Role.SFOS) {
            throw new IllegalArgumentException("Manager must be an SFOS");
        }

        promoter.setManager(sfos);
        User updated = userRepository.save(promoter);
        return UserResponseDTO.fromUser(updated);
    }

    /**
     * Bulk create users
     * Validates email uniqueness and SFOS hierarchy for PROMOTERs
     */
    @Transactional
    public List<UserResponseDTO> createUsersBulk(List<UserCreateDTO> dtos) {
        List<User> usersToSave = new java.util.ArrayList<>();
        
        for (UserCreateDTO dto : dtos) {
            // Validate email uniqueness
            if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
                throw new IllegalArgumentException("Email already exists: " + dto.getEmail());
            }

            // Validate PROMOTER requires manager
            if (dto.getRole() == Role.PROMOTER && dto.getSfosId() == null) {
                throw new IllegalArgumentException("PROMOTER role requires an SFOS manager (sfosId) for: " + dto.getEmail());
            }

            User user = new User();
            user.setFullName(dto.getName());
            user.setEmail(dto.getEmail());
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
            user.setRole(dto.getRole());
            user.setRegion(dto.getRegion());
            user.setStatus(UserStatus.ACTIVE);

            // Set manager if PROMOTER
            if (dto.getRole() == Role.PROMOTER && dto.getSfosId() != null) {
                User manager = userRepository.findById(dto.getSfosId())
                        .orElseThrow(() -> new IllegalArgumentException("SFOS manager not found with id: " + dto.getSfosId() + " for: " + dto.getEmail()));
                
                if (manager.getRole() != Role.SFOS) {
                    throw new IllegalArgumentException("Manager must be an SFOS, not " + manager.getRole() + " for: " + dto.getEmail());
                }
                
                user.setManager(manager);
            }

            usersToSave.add(user);
        }

        List<User> savedUsers = userRepository.saveAll(usersToSave);
        return savedUsers.stream()
                .map(UserResponseDTO::fromUser)
                .collect(java.util.stream.Collectors.toList());
    }
}
