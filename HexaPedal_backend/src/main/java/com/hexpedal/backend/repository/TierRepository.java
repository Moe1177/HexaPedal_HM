package com.hexpedal.backend.repository;

import com.hexpedal.backend.model.Tier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TierRepository extends JpaRepository<Tier, Long> {
    Optional<Tier> findByEmail(String email);
    Optional<Tier> findByRank(Integer rank);
    List<Tier> findAllByActiveOrderByRankAsc(Boolean active);
}
