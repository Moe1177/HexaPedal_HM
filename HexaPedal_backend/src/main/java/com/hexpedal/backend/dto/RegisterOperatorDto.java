package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.Truck;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterOperatorDto {
    private String fullName;
    private String address;
    private String username;
    private String email;
    private String password;
    private Truck truck;
}
