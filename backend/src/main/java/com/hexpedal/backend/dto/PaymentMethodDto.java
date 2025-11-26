package com.hexpedal.backend.dto;

import com.hexpedal.backend.model.PaymentMethod;
import lombok.*;

@Getter @Setter @AllArgsConstructor @NoArgsConstructor @Builder
public class PaymentMethodDto {
    private Long id;
    private String brand;
    private String last4;
    private Integer expMonth;
    private Integer expYear;
    private boolean isDefault;

    public static PaymentMethodDto from(PaymentMethod pm) {
        return PaymentMethodDto.builder()
                .id(pm.getId())
                .brand(pm.getBrand() != null ? pm.getBrand().name() : null)
                .last4(pm.getLast4())
                .expMonth(pm.getExpMonth())
                .expYear(pm.getExpYear())
                .isDefault(pm.isDefaultMethod())
                .build();
    }
}
