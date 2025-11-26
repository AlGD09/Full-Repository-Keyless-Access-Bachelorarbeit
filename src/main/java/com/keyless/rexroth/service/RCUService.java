package com.keyless.rexroth.service;

import com.keyless.rexroth.entity.*;
import com.keyless.rexroth.repository.RCURepository;
import com.keyless.rexroth.repository.SmartphoneRepository;
import com.keyless.rexroth.repository.EventRepository;
import com.keyless.rexroth.repository.AnomalyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.async.DeferredResult;
import reactor.core.publisher.Sinks;
import reactor.core.publisher.Flux;

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

    private static final long TIMEOUT_MILLIS = 5_000L;  // Timeout zum Antworten auf App Verriegelungsbefehl

    // Jede RCU (jede Maschine) erhält ihren eigenen SSE-Stream
    private final Map<String, Sinks.Many<String>> activeSinkMap = new ConcurrentHashMap<>();

    private final ConcurrentMap<String, DeferredResult<ResponseEntity<Map<String, Object>>>> operationResults = new ConcurrentHashMap<>();

    public RCU registerRcu(String rcuId, String name, String location) {
        if (rcuRepository.findByRcuId(rcuId) != null) {
            return null; // existiert bereits
        }
        RCU rcu = new RCU();
        rcu.setRcuId(rcuId);
        rcu.setName(name);
        rcu.setLocation(location);
        rcu.setStatus("offline");
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

    public void addNewEvent(String rcuId, String deviceName, String deviceId, String result) {
        RCU rcu = rcuRepository.findByRcuId(rcuId);
        Event lastEvent = eventRepository.findTop1ByRcuIdOrderByEventTimeDesc(rcuId);

        // Ungwöhnliche Verriegelung bei App lost Cloud Verbindung + neue Maschine Session danach erkennen
        if (result.equals("Zugang autorisiert")
                && lastEvent.getResult().equals("Entriegelt")) {
            Event event = new Event();
            event.setName(rcu.getName());
            event.setRcuId(rcuId);
            event.setDeviceName(lastEvent.getDeviceName());
            event.setDeviceId(lastEvent.getDeviceId());
            event.setResult("Ungewöhnliche Verriegelung");
            event.setEventTime(java.time.LocalDateTime.now());
            eventRepository.save(event);

            rcu.setStatus("idle");
            rcuRepository.save(rcu);
        }
        Event event = new Event();
        event.setName(rcu.getName());
        event.setRcuId(rcuId);
        event.setDeviceName(deviceName);
        event.setDeviceId(deviceId);
        event.setResult(result);
        event.setEventTime(java.time.LocalDateTime.now());
        if (result.equals("Entriegelt")) {
            rcu.setStatus("operational");
            rcuRepository.save(rcu);
        }
        if (result.equals("Verriegelt")) {
            rcu.setStatus("idle");
            confirmLock(rcuId);  // DeferredResult -> accepted
            rcuRepository.save(rcu);
        } else if (result.equals("Ungewöhnliche Verriegelung")) {
            rcu.setStatus("idle");
            rcuRepository.save(rcu);
        }

        if (result.equals("Remote Verriegelt")) {
            rcu.setStatus("Remote - operational");
            confirmLock(rcuId);  // DeferredResult -> accepted
            rcuRepository.save(rcu);
        } else if (result.equals("Remote Entriegelt")) {
            confirmLock(rcuId);
            rcu.setStatus("Remote - idle");
            rcuRepository.save(rcu);
        }

        if (result.equals("Fernsteuerung aktiviert")) {
            rcu.setStatus("Remote - active");
            rcuRepository.save(rcu);
        }

        if (result.equals("Fernsteuerung deaktiviert")) {
            rcu.setStatus("idle");
            rcuRepository.save(rcu);
            confirmLock(rcuId);
        }


        eventRepository.save(event);

        // Alle Events dieser RCU holen – sortiert
        List<Event> events = eventRepository.findByRcuIdOrderByEventTimeAsc(rcuId);

        // Wenn mehr als 10 vorhanden -> älteste löschen
        while (events.size() > 10) {
            Event oldest = events.get(0);   // erstes Element = ältestes
            eventRepository.delete(oldest);
            events.remove(0);
        }
        Anomaly anomaly = detectAnomalyForRcu(rcuId, deviceName, deviceId, event);
        if (anomaly != null) {
            anomalyRepository.save(anomaly);
        }

    }

    public Anomaly detectAnomalyForRcu(String rcuId, String deviceName, String deviceId, Event event) {

        List<Event> events = eventRepository.findTop10ByRcuIdAndDeviceIdOrderByEventTimeDesc(rcuId, deviceId);

        if (events.size() < 2) return null;

        // Event lastEvent = events.get(events.size() - 1);
        Event penultimateEvent = events.get(1);

        // String lastResult = lastEvent.getResult();
        String penultimateResult = penultimateEvent.getResult();


        String result = event.getResult();
        // Fail fAil = failRepository.findByRcuIdAndDeviceName(rcuId, device);

        if (result.equals("Zugang verweigert") && penultimateResult.equals("Zugang verweigert")) {

            if (!anomalyRepository.existsByRcuIdAndDeviceIdAndEventTime(rcuId, deviceId, event.getEventTime())) {
                return createAnomaly(rcuId, deviceName, deviceId, event.getEventTime());
            }

        }

        return null;
    }

    private Anomaly createAnomaly(String rcuId, String deviceName, String deviceId, LocalDateTime ts) {
        RCU rcu = rcuRepository.findByRcuId(rcuId);
        Anomaly anomaly = new Anomaly();
        anomaly.setName(rcu.getName());
        anomaly.setDeviceName(deviceName);
        anomaly.setDeviceId(deviceId);
        anomaly.setStatus(true);
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

    public void deleteAllAnomalies() {
        anomalyRepository.deleteAll();
    }


    // Verriegelungsmethoden

    public Flux<String> streamEvents(String rcuId) {
        if (activeSinkMap.get(rcuId) != null) {
            activeSinkMap.remove(rcuId);
        }

        // Remote Mode Status Änderung
        RCU rcu = rcuRepository.findByRcuId(rcuId);
        if (rcu.getStatus().equals("remote mode requested")) {
            rcu.setStatus("Remote - idle");
            rcuRepository.save(rcu);
        }

        Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();
        activeSinkMap.put(rcuId, sink);

        Flux<String> heartbeat = Flux.interval(Duration.ofSeconds(10))
                .map(t -> "HEARTBEAT");

        // Evento inicial READY pero con DELAY de 100–200 ms
        Flux<String> readyEvent = Flux.just("READY")
                .delayElements(Duration.ofMillis(400));

        return Flux.merge(
                        readyEvent,
                        sink.asFlux(),
                        heartbeat
                )
                .map(event -> "data:" + event + "\n\n");
    }

    // Wird aufgerufen, wenn von der App aus LOCK ausgeführt werden soll
    public void sendLockEvent(String rcuId) {
        Sinks.Many<String> sink = activeSinkMap.get(rcuId);
        if (sink != null) {
            sink.tryEmitNext("LOCK");
        }

        activeSinkMap.remove(rcuId);
    }

    public DeferredResult<ResponseEntity<Map<String, Object>>> createOperation(String rcuId, String deviceName, String deviceId) {
        DeferredResult<ResponseEntity<Map<String, Object>>> deferredResult = new DeferredResult<>(TIMEOUT_MILLIS);

        Event event = eventRepository.findTop1ByRcuIdOrderByEventTimeDesc(rcuId);

        // Verhindern altes Smartphone nach Cloud Verlust neue Aktivitäten zu stoppen
        if (!event.getDeviceId().equals(deviceId)) {
            Map<String, Object> body = Map.of(
                    "rcuId", rcuId,
                    "status", "deprecated"
            );
            deferredResult.setResult(ResponseEntity.accepted().body(body));
            return deferredResult;
        }

        operationResults.put(rcuId, deferredResult);

        deferredResult.onTimeout(() -> {
            Map<String, Object> body = Map.of(
                    "rcuId", rcuId,
                    "status", "timeout"
            );
            deferredResult.setResult(ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT).body(body));
            operationResults.remove(rcuId);
            if (!event.getResult().equals("Zugang verweigert")) {
                addNewEvent(rcuId, deviceName, deviceId, "Ungewöhnliche Verriegelung");
            }
            RCU rcu = rcuRepository.findByRcuId(rcuId);
            if (rcu != null) {
                rcu.setStatus("offline");
                rcuRepository.save(rcu);
            }
        });



        deferredResult.onCompletion(() -> operationResults.remove(rcuId));

        return deferredResult;
    }

    public void confirmLock(String rcuId) {
        DeferredResult<ResponseEntity<Map<String, Object>>> deferredResult = operationResults.get(rcuId);
        if (deferredResult == null) {
            return;
        }

        Map<String, Object> body = Map.of(
                "rcuId", rcuId,
                "status", "accepted"
        );

        deferredResult.setResult(ResponseEntity.accepted().body(body));
    }

    // Remote Control Methoden

    public String getRcuStatus(String rcuId) {
        RCU rcu = rcuRepository.findByRcuId(rcuId);
        if (!rcu.getStatus().equals("remote mode requested")) {
            rcu.setStatus("idle");
            rcuRepository.save(rcu);
        }
        return rcu.getStatus();
    }

    public DeferredResult<ResponseEntity<Map<String, Object>>> remoteLock(String rcuId) {
        DeferredResult<ResponseEntity<Map<String, Object>>> deferredResult = new DeferredResult<>(TIMEOUT_MILLIS);

        Event event = eventRepository.findTop1ByRcuIdOrderByEventTimeDesc(rcuId);

        operationResults.put(rcuId, deferredResult);

        deferredResult.onTimeout(() -> {
            Map<String, Object> body = Map.of(
                    "rcuId", rcuId,
                    "status", "timeout"
            );
            deferredResult.setResult(ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT).body(body));
            operationResults.remove(rcuId);
            if (event.getResult().equals("Remote entriegelt")) {
                addNewEvent(rcuId, "Remote Control", "1", "Ungewöhnliche Verriegelung");
            }
            addNewEvent(rcuId, "Remote Control", "1", "Fernsteuerung deaktiviert");
            RCU rcu = rcuRepository.findByRcuId(rcuId);
            if (rcu != null) {
                rcu.setStatus("offline");
                rcuRepository.save(rcu);
            }
        });

        deferredResult.onCompletion(() -> operationResults.remove(rcuId));

        return deferredResult;
    }

    public void sendRemoteLockEvent(String rcuId) {
        Sinks.Many<String> sink = activeSinkMap.get(rcuId);
        if (sink != null) {
            sink.tryEmitNext("LOCK");
        }
    }


    public void sendRemoteUnlockEvent(String rcuId) {
        Sinks.Many<String> sink = activeSinkMap.get(rcuId);
        if (sink != null) {
            sink.tryEmitNext("UNLOCK");
        }
    }

    public void sendRemoteExitEvent(String rcuId) {
        Sinks.Many<String> sink = activeSinkMap.get(rcuId);
        if (sink != null) {
            sink.tryEmitNext("EXIT");
        }

        activeSinkMap.remove(rcuId);
    }


}
