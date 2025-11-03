package com.datix.coresystem_poc;

import com.keyless.rexroth.entity.Smartphone;
import com.keyless.rexroth.repository.SmartphoneRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;



@SpringBootApplication(scanBasePackages = {
        "com.keyless.rexroth"         // dein neues Keyless-Backend
})

@EnableScheduling
@EnableJpaRepositories(basePackages = {
        "com.keyless.rexroth.repository"
})

@EntityScan(basePackages = {
        "com.keyless.rexroth.entity"
})



public class CoresystemPocApplication {

    public static void main(String[] args) {
        SpringApplication.run(CoresystemPocApplication.class, args);
    }


    @Bean
    CommandLineRunner initSmartphones(SmartphoneRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                Smartphone s = new Smartphone();
                s.setDeviceId("9e4a6c41b203d8a7");
                s.setSecretHash("cc03e747a6afbbcbf8be7668acfebee5");
                s.setUserName("Alejandro");
                s.setStatus("inactive");
                repo.save(s);

                System.out.println("✅ Smartphone-Datensatz in H2 gespeichert.");
            }
        };
    }



}
