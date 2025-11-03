package com.keyless.rexroth.controller;

import com.keyless.rexroth.dto.RCUAssignDTO;
import com.keyless.rexroth.dto.RCURegistrationDTO;
import com.keyless.rexroth.entity.RCU;
import com.keyless.rexroth.service.RCUService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


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




}
