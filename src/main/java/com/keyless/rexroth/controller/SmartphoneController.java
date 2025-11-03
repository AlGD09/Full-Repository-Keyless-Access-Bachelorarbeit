package com.keyless.rexroth.controller;

import com.keyless.rexroth.dto.SmartphoneRegistrationDTO;
import com.keyless.rexroth.dto.SmartphoneUnassignDTO;
import com.keyless.rexroth.entity.Smartphone;
import com.keyless.rexroth.service.SmartphoneService;
import com.keyless.rexroth.entity.RCU;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/devices")


public class SmartphoneController {


    @Autowired
    SmartphoneService smartphoneService;


    @PostMapping("/request")
    public ResponseEntity<?> requestToken(@RequestBody SmartphoneRegistrationDTO dto) {
        // smartphoneService prüft device + hash und erzeugt Token (oder null bei Fehler)
        String token = smartphoneService.authenticateAndGenerateToken(dto.getDeviceId(), dto.getUserName(), dto.getSecretHash());

        if (token == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        return ResponseEntity.ok(Map.of(
                "auth_token", token
        ));
    }

    @GetMapping("/token/{smartphoneId}")
    public ResponseEntity<?> getSmartphoneToken(@PathVariable Long smartphoneId) {
        String token = smartphoneService.getTokenForSmartphone(smartphoneId);

        if (token == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Kein aktiver Token gefunden."));
        }

        return ResponseEntity.ok(Map.of("auth_token", token));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerSmartphone(@RequestBody SmartphoneRegistrationDTO dto) {
        Smartphone saved = smartphoneService.registerSmartphone(dto.getDeviceId(), dto.getUserName(), dto.getSecretHash());
        if (saved == null) {
            return ResponseEntity.badRequest().body("Fehler: Gerät konnte nicht registriert werden.");
        }
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/list")
    public ResponseEntity<List<Smartphone>> getAllSmartphones() {
        List<Smartphone> list = smartphoneService.getAllSmartphones();
        return ResponseEntity.ok(list);
    }



    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteSmartphone(@PathVariable Long id) {
        smartphoneService.deleteSmartphone(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/remove/smartphone")
    public ResponseEntity<Void> removeSmartphone(@RequestBody SmartphoneUnassignDTO dto) {
        smartphoneService.removeSmartphone(dto.getRcuId(), dto.getSmartphoneId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/rcus/{smartphoneId}")
    public ResponseEntity<List<RCU>> getSmartphoneRcus(@PathVariable String smartphoneId) {
        List<RCU> rcus = smartphoneService.getRcusForSmartphone(smartphoneId);

        if (rcus.isEmpty()) {
            return ResponseEntity.noContent().build();
        }


        return ResponseEntity.ok(rcus);
    }





}
