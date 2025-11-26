package com.hexpedal.backend.dto;

public record CriteriaStatusDto(
        String criteriaId,
        String description,
        boolean met,
        String progressDetail
) {
    public static CriteriaStatusDto met(String id, String description) {
        return new CriteriaStatusDto(id, description, true, "✓ Completed");
    }

    public static CriteriaStatusDto notMet(String id, String description, String progress) {
        return new CriteriaStatusDto(id, description, false, progress);
    }
}
