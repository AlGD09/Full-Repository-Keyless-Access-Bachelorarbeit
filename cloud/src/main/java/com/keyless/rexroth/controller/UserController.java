package com.keyless.rexroth.controller;

import com.keyless.rexroth.dto.SmartphoneRegistrationDTO;
import com.keyless.rexroth.dto.SmartphoneUnassignDTO;
import com.keyless.rexroth.dto.UserUnassignDTO;
import com.keyless.rexroth.dto.UserRegistrationDTO;
import com.keyless.rexroth.entity.Smartphone;
import com.keyless.rexroth.entity.RCU;
import com.keyless.rexroth.entity.User;
import com.keyless.rexroth.service.UserService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;


@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/users")


public class UserController {

    @Autowired
    UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody UserRegistrationDTO dto) {
        User saved = userService.registerUser(dto.getUsername(), dto.getEmail(), dto.getSecretHash());
        if (saved == null) {
            return ResponseEntity.badRequest().body("Fehler: User konnte nicht registriert werden.");
        }
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/remove/user")
    public ResponseEntity<Void> removeUser(@RequestBody UserUnassignDTO dto) {
        userService.removeUser(dto.getSmartphoneId(), dto.getUserId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/list")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> list = userService.getAllUsers();
        return ResponseEntity.ok(list);
    }



}
