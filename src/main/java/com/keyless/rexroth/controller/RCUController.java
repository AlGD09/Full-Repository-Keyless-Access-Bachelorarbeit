package com.keyless.rexroth.controller;

import com.keyless.rexroth.dto.RCUAssignDTO;
import com.keyless.rexroth.dto.RCUEreignisDTO;
import com.keyless.rexroth.dto.RCURegistrationDTO;
import com.keyless.rexroth.dto.SmartphoneUnassignDTO;
import com.keyless.rexroth.dto.RCULockDTO;
import com.keyless.rexroth.entity.Anomaly;
import com.keyless.rexroth.entity.RCU;
import com.keyless.rexroth.entity.Event;
import com.keyless.rexroth.service.RCUService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import reactor.core.publisher.Flux;
import org.springframework.web.context.request.async.DeferredResult;

import java.util.Map;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:4200")

@RequestMapping("/rcu")

public class RCUController {

    @Autowired
    private RCUService rcuService;

    @PostMapping("/register")
    public ResponseEntity<?> registerRcu(@RequestBody RCURegistrationDTO dto) {
        RCU rcu = rcuService.registerRcu(dto.getRcuId(), dto.getName(), dto.getLocation());
        if (rcu == null)
            return ResponseEntity.badRequest().body("RCU existiert bereits.");
        return ResponseEntity.ok(rcu);
    }

    @PostMapping("/assign/smartphones")
    public ResponseEntity<?> assignSmartphones(@RequestBody RCUAssignDTO dto) {
        RCU updated = rcuService.assignSmartphones(dto.getRcuId(), dto.getSmartphoneIds());
        if (updated == null)
            return ResponseEntity.badRequest().body("Fehler: RCU oder Smartphone(s) nicht gefunden.");
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/list")
    public ResponseEntity<List<RCU>> getAllRcus() {
        return ResponseEntity.ok(rcuService.getAllRcus());
    }

    @GetMapping("/{rcuId}/smartphones")
    public ResponseEntity<?> getAssignedSmartphones(@PathVariable String rcuId) {
        RCU rcu = rcuService.getRcuByRcuId(rcuId);
        if (rcu == null) {
            return ResponseEntity.status(404).body("RCU nicht gefunden");
        }

        if (rcu.getAllowedSmartphones() == null) {
            return ResponseEntity.ok("Keine Smartphones zugewiesen");
        }

        return ResponseEntity.ok(rcu.getAllowedSmartphones());
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteRcu(@PathVariable Long id) {
        rcuService.deleteRcu(id);
        return ResponseEntity.noContent().build();
    }


    // Endpoints für Protokollierung und Anomalie-Erkennung

    @PostMapping("/events/add")
    public ResponseEntity<Void> neuesEreignis(@RequestBody RCUEreignisDTO dto) {
        rcuService.addNewEvent(dto.getRcuId(), dto.getDeviceName(), dto.getDeviceId(), dto.getResult());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/events/all")
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(rcuService.getAllEvents());
    }

    @GetMapping("/events/graph")
    public ResponseEntity<List<Event>> getGraphEvents() {
        return ResponseEntity.ok(rcuService.getGraphEvents());
    }

    @GetMapping("/events/{rcuId}")
    public ResponseEntity<List<Event>> getRcuEvents(@PathVariable String rcuId) {
        return ResponseEntity.ok(rcuService.getRcuEvents(rcuId));
    }

    @GetMapping("/events/anomalies")
    public ResponseEntity<List<Anomaly>> getAllAnomalies() {
        return ResponseEntity.ok(rcuService.detectAllAnomalies());
    }

    @DeleteMapping("/events/delete/{id}")
    public ResponseEntity<Void> deleteAnomaly(@PathVariable Long id) {
        rcuService.deleteAnomaly(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/events/delete/anomalies")
    public ResponseEntity<Void> deleteAllAnomalies() {
        rcuService.deleteAllAnomalies();
        return ResponseEntity.noContent().build();
    }

    // Endpoints zur Maschinenverriegelung
    @GetMapping(value = "/sse/{rcuId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamEvents(@PathVariable String rcuId) {
        return rcuService.streamEvents(rcuId);
    }

    @PostMapping("/lock/{rcuId}")
    public DeferredResult<ResponseEntity<Map<String, Object>>> lock(@RequestBody RCULockDTO dto) {
        DeferredResult<ResponseEntity<Map<String, Object>>> deferredResult = rcuService.createOperation(dto.getRcuId(), dto.getDeviceName(), dto.getDeviceId());

        // Wenn Smartphone Id nicht zum letzten Event passt -> status = "deprecated" senden
        if (deferredResult.hasResult()) {
            return deferredResult;
        }

        rcuService.sendLockEvent(dto.getRcuId());

        return deferredResult;
    }

    // Endpoints zum Remote Control
    @GetMapping("/status/{rcuId}")
    public ResponseEntity<?> getRcuStatus(@PathVariable String rcuId) {
        String status = rcuService.getRcuStatus(rcuId);
        if (status == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Kein Status gefunden."));
        }

        return ResponseEntity.ok(Map.of("status", status));
    }

    @GetMapping(value = "/remote/sse/{rcuId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> remoteEvents(@PathVariable String rcuId) {

        rcuService.addNewEvent(rcuId, "Remote Control", "1", "Fernsteuerung aktiviert");
        return rcuService.streamEvents(rcuId);
    }

    @PostMapping("/remote/lock/{rcuId}")
    public DeferredResult<ResponseEntity<Map<String, Object>>> remoteLock(@PathVariable String rcuId) {
        DeferredResult<ResponseEntity<Map<String, Object>>> deferredResult = rcuService.remoteLock(rcuId);

        rcuService.sendRemoteLockEvent(rcuId);

        return deferredResult;
    }

    @PostMapping("/remote/unlock/{rcuId}")
    public DeferredResult<ResponseEntity<Map<String, Object>>> remoteUnlock(@PathVariable String rcuId) {
        DeferredResult<ResponseEntity<Map<String, Object>>> deferredResult = rcuService.remoteLock(rcuId);

        rcuService.sendRemoteUnlockEvent(rcuId);

        return deferredResult;
    }

    @PostMapping("/remote/exit/{rcuId}")
    public DeferredResult<ResponseEntity<Map<String, Object>>> remoteExit(@PathVariable String rcuId) {
        DeferredResult<ResponseEntity<Map<String, Object>>> deferredResult = rcuService.remoteLock(rcuId);

        rcuService.sendRemoteExitEvent(rcuId);

        return deferredResult;
    }


}
