package com.datix.coresystem_poc;

import com.keyless.rexroth.entity.Smartphone;
import com.keyless.rexroth.entity.User;
import com.keyless.rexroth.repository.SmartphoneRepository;
import com.keyless.rexroth.repository.UserRepository;
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
                s.setName("Generic-phone");
                //s.setSecretHash("cc03e747a6afbbcbf8be7668acfebee5");
                //s.setUserName("Alejandro");
                s.setStatus("inactive");
                repo.save(s);

                System.out.println("✅ Smartphone-Datensatz in H2 gespeichert.");
            }
        };
    }

    @Bean
    CommandLineRunner initUsers(UserRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                User u = new User();
                u.setUsername("Standard");
                u.setEmail("standard-employee@boschrexroth.de");
                u.setSecretHash("e4d909c290d0fb1ca068ffaddf22cbd0");
                repo.save(u);

                System.out.println("✅ User-Datensatz in H2 gespeichert.");
            }
        };
    }



}
