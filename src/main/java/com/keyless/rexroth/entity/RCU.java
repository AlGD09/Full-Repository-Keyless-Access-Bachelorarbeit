package com.keyless.rexroth.entity;


import jakarta.persistence.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


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

    // Beziehung: jede RCU kann einem Smartphone zugeordnet sein
    @ManyToOne
    @JoinColumn(name = "smartphone_id")
    private Smartphone assignedSmartphone;

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

    public Smartphone getAssignedSmartphone() { return assignedSmartphone; }
    public void setAssignedSmartphone(Smartphone assignedSmartphone) { this.assignedSmartphone = assignedSmartphone; }

    public void unassignSmartphone() { this.assignedSmartphone = null; }

    public boolean hasAssignedSmartphone() { return this.assignedSmartphone != null; }


}