package com.samsung.merchandising_api.dto;

import com.samsung.merchandising_api.model.Role;
import lombok.Data;

@Data
public class UserCreateDTO {
    private String name;
    private String email;
    private String password;
    private Role role;
    private String region;
    private Long sfosId; // Required if role is PROMOTER
}
