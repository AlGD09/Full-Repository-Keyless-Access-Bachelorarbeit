package com.keyless.rexroth.repository;

import com.keyless.rexroth.entity.Programmed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ProgrammedRepository extends JpaRepository<Programmed, Long> {
    Programmed findByRcuId(String rcuId);
    List<Programmed> findAllByRcuId(String rcuId);
    void deleteAllByRcuId(String rcuId);
}
