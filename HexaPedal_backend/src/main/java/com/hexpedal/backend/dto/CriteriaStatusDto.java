package com.hexpedal.backend.dto;

record CriteriaStatusDto(
        String criteriaId,
        String description,
        boolean met,
        String currentValue,
        String requiredValue
) {}
