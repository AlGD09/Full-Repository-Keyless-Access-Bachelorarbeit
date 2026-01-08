package com.keyless.rexroth.service;

import com.keyless.rexroth.entity.RCU;
import com.keyless.rexroth.entity.User;
import com.keyless.rexroth.entity.Anomaly;
import com.keyless.rexroth.repository.RCURepository;
import com.keyless.rexroth.repository.SmartphoneRepository;
import com.keyless.rexroth.repository.UserRepository;
import com.keyless.rexroth.repository.AnomalyRepository;
import com.keyless.rexroth.entity.Smartphone;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service

public class SmartphoneService {

    @Autowired
    private SmartphoneRepository smartphoneRepository;

    @Autowired
    private RCURepository rcuRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnomalyRepository anomalyRepository;

    // Feste Testgeräte (deviceId → secretHash)
    //private final Map<String, String> registeredDevices = new HashMap<>();

    private final Map<String, String> tokenStore = new ConcurrentHashMap<>();

    //public SmartphoneService() {
        //registeredDevices.put("smph-01-ubuntu", "cc03e747a6afbbcbf8be7668acfebee5");
        //registeredDevices.put("smph-02-android", "5ebe2294ecd0e0f08eab7690d2a6ee69");
    //}


    public String authenticateAndGenerateToken(String deviceId, String username, String secretHash) {
        if (deviceId == null || username==null || secretHash == null) return null;

        //String storedHash = registeredDevices.get(deviceId)
        //if (storedHash == null || !storedHash.equals(secretHash)) return null;

        Smartphone device = smartphoneRepository.findByDeviceId(deviceId);
        if (device == null) {
            System.out.println("Gerät nicht gefunden: " + deviceId);
            return null;
        }
        if (device.getStatus().equals("gesperrt")) {
            System.out.println("Gerät blockiert: " + deviceId);
            return null;
        }

        User user = userRepository.findByUsername(username);
        if (user == null) {
            System.out.println("User nicht gefunden: " + username);
            return null;
        }

        boolean assigned = device.getAssignedUsers()
                .stream()
                .anyMatch(u -> u.getId().equals(user.getId()));
        if (!assigned) {
            System.out.println("User ist nicht diesem Gerät zugewiesen: " + deviceId);
            return null;
        }

        /*if (!device.getAssignedUsers().contains(user)) {
            System.out.println("Username nicht authentifiziert für Gerät: " + deviceId);
            return null;
        }*/

        if (!secretHash.equals(user.getSecretHash())) {
            System.out.println("Secret Hash ungültig für User: " + username);
            return null;
        }

        tokenStore.values().removeIf(id -> id.equals(deviceId));


        // Token generieren
        String token = UUID.randomUUID().toString().replace("-", "");
        tokenStore.put(token, deviceId);

        // Status -> active equals Token generiert
        device.setStatus("active");

        // Zeitstempel aktualisieren
        device.setLastSeen(java.time.LocalDateTime.now());
        smartphoneRepository.save(device);


        return token;
    }

    // ggf. Token-Revocation-Funktion
    public void revokeToken(String token) {
        tokenStore.remove(token);
    }

    public boolean verifyToken(String token, String deviceId) {
        String storedDeviceId = tokenStore.get(token);
        return storedDeviceId != null && storedDeviceId.equals(deviceId);
    }


    public Smartphone registerSmartphone(String deviceId, String Name) {
        if (deviceId == null) return null;

        // Prüfen, ob Gerät bereits existiert
        Smartphone existing = smartphoneRepository.findByDeviceId(deviceId);
        if (existing != null) {
            existing.setName(Name);
            existing.setStatus("updated");
            return smartphoneRepository.save(existing);
        }

        Smartphone s = new Smartphone();
        s.setDeviceId(deviceId);
        s.setName(Name);
        s.setStatus("inactive");
        // s.setLastSeen(java.time.LocalDateTime.now());
        return smartphoneRepository.save(s);
    }

    public List<Smartphone> getAllSmartphones() {
        return smartphoneRepository.findAll();
    }

    public String getTokenForSmartphone(Long smartphoneId) {
        Smartphone device = smartphoneRepository.findById(smartphoneId).orElse(null);
        if (device == null) return null;

        // Suche in tokenStore nach dem zugehörigen Token
        for (Map.Entry<String, String> entry : tokenStore.entrySet()) {
            if (entry.getValue().equals(device.getDeviceId())) {
                return entry.getKey(); // Token gefunden
            }
        }

        return null; // Kein Token aktiv
    }

    public void deleteSmartphone(Long id) {
        Smartphone smartphone = smartphoneRepository.findById(id).orElse(null);
        if (smartphoneRepository.existsById(id)) {

            // Alle RCUs abrufen
            List<RCU> rcuList = rcuRepository.findAll();

            // Prüfen, ob eine RCU das Smartphone zugewiesen hat
            for (RCU rcu : rcuList) {
                if (rcu.getAllowedSmartphones().contains(smartphone)) {

                    // Smartphone-Zuweisung aufheben
                    rcu.removeSmartphone(smartphone);
                    rcuRepository.save(rcu); // Änderung speichern
                }
            }

            // Alle Tokens entfernen, die zu diesem Gerät gehören
            tokenStore.values().removeIf(deviceId -> deviceId.equals(smartphone.getDeviceId()));

            // Smartphone aus Repository löschen
            smartphoneRepository.deleteById(id);
        }
    }

    public void removeSmartphone(String rcuId, Long smartphoneId) {
        RCU rcu = rcuRepository.findByRcuId(rcuId);
        if (rcu == null) {
            throw new RuntimeException("RCU not found: " + rcuId);
        }

        Smartphone phone = smartphoneRepository.findById(smartphoneId).orElse(null);
        if (phone == null) {
            throw new RuntimeException("Smartphone not found: " + smartphoneId);
        }

        // Zuordnung sicher prüfen, bevor unassigned wird
        if (rcu.getAllowedSmartphones() != null &&
                rcu.getAllowedSmartphones().contains(phone)) {

            rcu.removeSmartphone(phone);
            rcuRepository.save(rcu);
        }
    }

    public void blockSmartphone(String deviceId) {
        Smartphone smart = smartphoneRepository.findByDeviceId(deviceId);
        if (smart == null) {
            throw new RuntimeException("Smartphone not found: " + deviceId);
        }
        smart.setStatus("gesperrt");
        smartphoneRepository.save(smart);
        List<Anomaly> anomalies = anomalyRepository.findAllByDeviceId(deviceId);
        if (anomalies != null) {
            for (Anomaly anomaly : anomalies) {
                anomaly.setStatus(false);
                anomalyRepository.save(anomaly);
            }
        }
    }

    public void unblockSmartphone(String deviceId) {
        Smartphone smart = smartphoneRepository.findByDeviceId(deviceId);
        if (smart == null) {
            throw new RuntimeException("Smartphone not found: " + deviceId);
        }
        smart.setStatus("inactive");
        smartphoneRepository.save(smart);
        List<Anomaly> anomalies = anomalyRepository.findAllByDeviceId(deviceId);
        if (anomalies != null) {
            for (Anomaly anomaly : anomalies) {
                anomaly.setStatus(true);
                anomalyRepository.save(anomaly);
            }
        }
    }

    public List<RCU> getRcusForSmartphone(String smartphoneId) {
        Smartphone existing = smartphoneRepository.findByDeviceId(smartphoneId);
        if (existing == null) {
            return Collections.emptyList(); // besser als null zurückgeben
        }

        List<RCU> rcuList = rcuRepository.findAll();
        List<RCU> assignedrcus = new ArrayList<>();

        for (RCU rcu : rcuList) {
            if (rcu.getAllowedSmartphones() != null &&
                    rcu.getAllowedSmartphones().contains(existing)) {
                assignedrcus.add(rcu);
            }
        }


        return assignedrcus;
    }

    public List<RCU> getActiveRcusForSmartphone(String smartphoneId) {
        Smartphone existing = smartphoneRepository.findByDeviceId(smartphoneId);
        if (existing == null) {
            return Collections.emptyList(); // besser als null zurückgeben
        }

        List<RCU> rcuList = rcuRepository.findAll();
        List<RCU> assignedrcus = new ArrayList<>();
        List<RCU> activercus = new ArrayList<>();

        for (RCU rcu : rcuList) {
            if (rcu.getAllowedSmartphones() != null &&
                    rcu.getAllowedSmartphones().contains(existing)) {
                assignedrcus.add(rcu);
            }
        }

        for (RCU Rcu: assignedrcus) {
            if (Rcu.getStatus().equals("active")) {
                activercus.add(Rcu);
            }
        }

        return activercus;
    }

    public Smartphone assignUsers(Long smartphoneId, List<Long> UserIds) {
        Smartphone smart = smartphoneRepository.findById(smartphoneId).orElse(null);
        if (smart == null) return null;

        for (Long userId : UserIds) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && !smart.getAssignedUsers().contains(user)) {
                smart.addUser(user);
            }
        }
        return smartphoneRepository.save(smart);
    }





}



