package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.Role;
import com.samsung.merchandising_api.model.User;
import com.samsung.merchandising_api.model.UserStatus;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
public class UserResponseDTO {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
    private String region;
    private Long managerId;
    private String managerName;
    private Integer subordinatesCount;

    public static UserResponseDTO fromUser(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setRegion(user.getRegion());
        
        if (user.getManager() != null) {
            dto.setManagerId(user.getManager().getId());
            dto.setManagerName(user.getManager().getFullName());
        }
        
        if (user.getSubordinates() != null) {
            dto.setSubordinatesCount(user.getSubordinates().size());
        } else {
            dto.setSubordinatesCount(0);
        }
        
        return dto;
    }

    public static List<UserResponseDTO> fromUsers(List<User> users) {
        return users.stream()
                .map(UserResponseDTO::fromUser)
                .collect(Collectors.toList());
    }
}
