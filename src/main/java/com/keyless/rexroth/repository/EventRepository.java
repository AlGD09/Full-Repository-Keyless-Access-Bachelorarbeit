package com.keyless.rexroth.repository;

import com.keyless.rexroth.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    Event findByRcuId(String rcuId);
    List<Event> findByRcuIdOrderByEventTimeAsc(String rcuId);
    List<Event> findTop20ByOrderByEventTimeDesc();
    List<Event> findTop10ByRcuIdOrderByEventTimeDesc(String rcuId);
    List<Event> findTop10ByRcuIdAndDeviceNameOrderByEventTimeDesc(String rcuId, String deviceName);

    @Query("SELECT DISTINCT e.rcuId FROM Event e")
    List<String> findDistinctRcuIds();


}