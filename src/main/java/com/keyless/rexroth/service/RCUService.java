package com.keyless.rexroth.service;

import com.keyless.rexroth.entity.*;
import com.keyless.rexroth.repository.RCURepository;
import com.keyless.rexroth.repository.SmartphoneRepository;
import com.keyless.rexroth.repository.EventRepository;
import com.keyless.rexroth.repository.AnomalyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;


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
        Anomaly anomaly = detectAnomalyForRcu(rcuId, deviceName, event);
        if (anomaly != null) {
            anomalyRepository.save(anomaly);
        }

    }

    public Anomaly detectAnomalyForRcu(String rcuId, String deviceName, Event event) {

        List<Event> events = eventRepository.findTop10ByRcuIdAndDeviceNameOrderByEventTimeDesc(rcuId, deviceName);

        if (events.size() < 2) return null;

        // Event lastEvent = events.get(events.size() - 1);
        Event penultimateEvent = events.get(1);

        // String lastResult = lastEvent.getResult();
        String penultimateResult = penultimateEvent.getResult();


        String result = event.getResult();
        // Fail fAil = failRepository.findByRcuIdAndDeviceName(rcuId, device);

        if (result.equals("Fehler") && penultimateResult.equals("Fehler")) {

            if (!anomalyRepository.existsByRcuIdAndDeviceNameAndEventTime(rcuId, deviceName, event.getEventTime())) {
                return createAnomaly(rcuId, deviceName, event.getEventTime());
            }

        }

        return null;
    }

    private Anomaly createAnomaly(String rcuId, String device, LocalDateTime ts) {
        RCU rcu = rcuRepository.findByRcuId(rcuId);
        Anomaly anomaly = new Anomaly();
        anomaly.setName(rcu.getName());
        anomaly.setDeviceName(device);
        anomaly.setRcuId(rcuId);
        anomaly.setEventTime(ts);
        return anomaly;
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
