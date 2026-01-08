package com.keyless.rexroth.entity;


import jakarta.persistence.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "rcus")
public class RCU {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String rcuId;

    private String name;
    private String location;
    private LocalDateTime registeredAt;
    private String status;

    // Beziehung: jede RCU kann einem Smartphone zugeordnet sein
    //@ManyToOne
    //@JoinColumn(name = "smartphone_id")
    @ManyToMany
    @JoinTable(
            name = "rcu_smartphones",
            joinColumns = @JoinColumn(name = "rcu_id"),
            inverseJoinColumns = @JoinColumn(name = "smartphone_id")
    )

    private Set<Smartphone> allowedSmartphones = new HashSet<>();

    //@OneToMany
    //@JoinColumn(name = "rcu_id")
    //private List<Smartphone> allowedSmartphones = new ArrayList<>();

    public RCU() {
        this.registeredAt = LocalDateTime.now();
    }

    // --- Getter & Setter ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRcuId() { return rcuId; }
    public void setRcuId(String rcuId) { this.rcuId = rcuId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    //public Smartphone getAssignedSmartphone() { return assignedSmartphone; }
    //public void setAssignedSmartphone(Smartphone assignedSmartphone) { this.assignedSmartphone = assignedSmartphone; }

    public Set<Smartphone> getAllowedSmartphones() { return allowedSmartphones; }
    public void setAllowedSmartphones(Set<Smartphone> allowedSmartphones) { this.allowedSmartphones = allowedSmartphones; }

    public void addSmartphone(Smartphone smartphone) {
        this.allowedSmartphones.add(smartphone);
    }
    public void removeSmartphone(Smartphone smartphone) {
        this.allowedSmartphones.remove(smartphone);
    }

    //public void unassignSmartphone() { this.assignedSmartphone = null; }

    //public boolean hasAssignedSmartphone() { return this.assignedSmartphone != null; }


}