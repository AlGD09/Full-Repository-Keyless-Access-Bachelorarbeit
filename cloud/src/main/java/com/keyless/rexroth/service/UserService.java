package com.keyless.rexroth.service;

import com.keyless.rexroth.entity.User;
import com.keyless.rexroth.repository.SmartphoneRepository;
import com.keyless.rexroth.repository.UserRepository;
import com.keyless.rexroth.entity.Smartphone;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service



public class UserService {

    @Autowired
    private SmartphoneRepository smartphoneRepository;

    @Autowired
    private UserRepository userRepository;

    public User registerUser(String username, String email, String secretHash) {
        if (username == null || secretHash == null) return null;

        // Prüfen, ob Gerät bereits existiert
        User existing = userRepository.findByUsername(username);
        if (existing != null) {
            existing.setUsername(username);
            existing.setEmail(email);
            existing.setSecretHash(secretHash);
            return userRepository.save(existing);
        }

        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setSecretHash(secretHash);
        return userRepository.save(u);
    }

    public void removeUser(String smartphoneId, Long userId) {
        Smartphone smart = smartphoneRepository.findByDeviceId(smartphoneId);
        if (smart == null) {
            throw new RuntimeException("Smartphone not found: " + smartphoneId);
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new RuntimeException("User not found: " + userId);
        }

        // Zuordnung sicher prüfen, bevor unassigned wird
        if (smart.getAssignedUsers() != null &&
                smart.getAssignedUsers().contains(user)) {

            smart.removeUser(user);
            smartphoneRepository.save(smart);
        }
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (userRepository.existsById(id)) {

            List<Smartphone> smartList = smartphoneRepository.findAll();

            for (Smartphone smart : smartList) {
                if (smart.getAssignedUsers().contains(user)) {

                    // Smartphone-Zuweisung aufheben
                    smart.removeUser(user);
                    smartphoneRepository.save(smart); // Änderung speichern
                }
            }

            userRepository.deleteById(id);
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }










}
