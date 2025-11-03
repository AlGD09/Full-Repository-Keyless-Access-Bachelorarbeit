package com.keyless.rexroth.service;

import com.keyless.rexroth.entity.RCU;
import com.keyless.rexroth.entity.Smartphone;
import com.keyless.rexroth.repository.RCURepository;
import com.keyless.rexroth.repository.SmartphoneRepository;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;


@Service

public class RCUService {

    @Autowired
    private RCURepository rcuRepository;

    @Autowired
    private SmartphoneRepository smartphoneRepository;

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

}
