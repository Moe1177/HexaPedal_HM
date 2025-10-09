package com.hexpedal.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterUserDto {
    private String fullName;
    private String address;
    private String username;
    private String email;
    private String password;
}
