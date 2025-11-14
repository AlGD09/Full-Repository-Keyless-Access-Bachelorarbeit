package com.keyless.rexroth.repository;

import com.keyless.rexroth.entity.Anomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnomalyRepository extends JpaRepository<Anomaly, Long> {
    Anomaly findByName(String name);
    List<Anomaly> findAllByOrderByEventTimeDesc();
    Boolean existsByRcuIdAndDeviceNameAndEventTime(String rcuId, String deviceName, LocalDateTime eventTime);
}
