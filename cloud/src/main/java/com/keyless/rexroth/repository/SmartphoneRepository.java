package com.keyless.rexroth.repository;

import com.keyless.rexroth.entity.Smartphone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface SmartphoneRepository extends JpaRepository<Smartphone, Long> {
    Smartphone findByDeviceId(String deviceId);

}
