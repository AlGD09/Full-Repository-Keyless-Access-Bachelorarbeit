package com.keyless.rexroth.service;

import com.keyless.rexroth.entity.RCU;
import com.keyless.rexroth.entity.Smartphone;
import com.keyless.rexroth.entity.Event;
import com.keyless.rexroth.entity.Anomaly;
import com.keyless.rexroth.repository.RCURepository;
import com.keyless.rexroth.repository.SmartphoneRepository;
import com.keyless.rexroth.repository.EventRepository;
import com.keyless.rexroth.repository.AnomalyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Service

public class RCUService {

    @Autowired
    private RCURepository rcuRepository;

    @Autowired
    private SmartphoneRepository smartphoneRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private AnomalyRepository anomalyRepository;

    public RCU registerRcu(String rcuId, String name, String location) {
        if (rcuRepository.findByRcuId(rcuId) != null) {
            return null; // existiert bereits
        }
        RCU rcu = new RCU();
        rcu.setRcuId(rcuId);
        rcu.setName(name);
        rcu.setLocation(location);
        return rcuRepository.save(rcu);
    }

    public List<RCU> getAllRcus() {
        return rcuRepository.findAll();
    }

    public RCU assignSmartphones(Long rcuId, List<Long> smartphoneIds) {
        RCU rcu = rcuRepository.findById(rcuId).orElse(null);
        if (rcu == null) return null;

        for (Long smartphoneId : smartphoneIds) {
            Smartphone smartphone = smartphoneRepository.findById(smartphoneId).orElse(null);
            if (smartphone != null && !rcu.getAllowedSmartphones().contains(smartphone)) {
                rcu.addSmartphone(smartphone);
            }
        }
        return rcuRepository.save(rcu);
    }

    public RCU getRcuByRcuId(String rcuId) {
        return rcuRepository.findByRcuId(rcuId);
    }

    public void deleteRcu(Long id) {
        if (rcuRepository.existsById(id)) {
            rcuRepository.deleteById(id);
        }
    }

    public List<Event> getAllEvents() { return eventRepository.findAll(); }

    public List<Event> getGraphEvents() { return eventRepository.findTop20ByOrderByEventTimeDesc(); }

    public List<Event> getRcuEvents(String rcuId) {
        return eventRepository.findTop10ByRcuIdOrderByEventTimeDesc(rcuId);
    }

    public void addNewEvent(String rcuId, String deviceName, String result) {
        RCU rcu = rcuRepository.findByRcuId(rcuId);
        Event event = new Event();
        event.setName(rcu.getName());
        event.setRcuId(rcuId);
        event.setDeviceName(deviceName);
        event.setResult(result);
        event.setEventTime(java.time.LocalDateTime.now());

        eventRepository.save(event);

        // Alle Events dieser RCU holen – sortiert
        List<Event> events = eventRepository.findByRcuIdOrderByEventTimeAsc(rcuId);

        // Wenn mehr als 10 vorhanden -> älteste löschen
        while (events.size() > 10) {
            Event oldest = events.get(0);   // erstes Element = ältestes
            eventRepository.delete(oldest);
            events.remove(0);
        }
        Anomaly anomaly = detectAnomalyForRcu(rcuId);
        if (anomaly != null) {
            anomalyRepository.save(anomaly);
        }

    }

    public Anomaly detectAnomalyForRcu(String rcuId) {

        List<Event> events = eventRepository.findTop10ByRcuIdOrderByEventTimeDesc(rcuId);

        if (events.size() < 2) {
            return null;
        }

        Map<String, Integer> failCounts = new HashMap<>();
        Map<String, LocalDateTime> lastFailTimestamp = new HashMap<>();

        for (Event e : events) {

            String device = e.getDeviceName();
            String result = e.getResult();

            // ❗ FALL 1 – Fehler
            if (result.equals("Fehler")) {

                int fails = failCounts.getOrDefault(device, 0) + 1;
                failCounts.put(device, fails);
                lastFailTimestamp.put(device, e.getEventTime());

                // Neue Anomalie: 2 Fehler ohne Authentifiziert
                if (fails >= 2) {
                    Anomaly anomaly = new Anomaly();
                    RCU rcu = rcuRepository.findByRcuId(rcuId);
                    anomaly.setName(rcu.getName());
                    anomaly.setDeviceName(device);
                    anomaly.setRcuId(rcuId);
                    anomaly.setEventTime(e.getEventTime());
                    return anomaly;
                }
            }

            // ❗ FALL 2 – Authentifiziert
            else if (result.equals("Authentifiziert")) {

                int fails = failCounts.getOrDefault(device, 0);

                // Alte Anomalie: 2 Fehler vor einem Erfolg
                if (fails >= 2) {
                    Anomaly anomaly = new Anomaly();
                    RCU rcu = rcuRepository.findByRcuId(rcuId);
                    anomaly.setName(rcu.getName());
                    anomaly.setDeviceName(device);
                    anomaly.setRcuId(rcuId);
                    anomaly.setEventTime(e.getEventTime());
                    return anomaly;
                }

                // Reset nur für dieses Gerät
                failCounts.put(device, 0);
            }
        }

        return null;
    }


    public List<Anomaly> detectAllAnomalies() {
        return anomalyRepository.findAllByOrderByEventTimeDesc();
    }

    public void deleteAnomaly(Long id) {
        if (anomalyRepository.existsById(id)) {
            anomalyRepository.deleteById(id);
        }
    }



}
