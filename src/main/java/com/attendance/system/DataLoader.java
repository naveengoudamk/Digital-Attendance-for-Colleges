package com.attendance.system;

import com.attendance.system.model.User;
import com.attendance.system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner initDatabase(UserRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new User(null, "faculty@test.com", "password", "Dr. Faculty", User.Role.FACULTY));
                repository.save(new User(null, "student@test.com", "password", "John Student", User.Role.STUDENT));
                repository.save(new User(null, "admin@test.com", "admin", "Admin User", User.Role.ADMIN));
                System.out.println(
                        "Dummy users created: faculty@test.com, student@test.com, admin@test.com (password/admin)");
            }
        };
    }
}
