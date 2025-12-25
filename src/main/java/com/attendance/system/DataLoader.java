package com.attendance.system;

import com.attendance.system.model.TimetableEntry;
import com.attendance.system.model.User;
import com.attendance.system.repository.TimetableRepository;
import com.attendance.system.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {

        @Bean
        CommandLineRunner initDatabase(UserRepository repository, TimetableRepository timetableRepository) {
                return args -> {
                        if (repository.count() == 0) {
                                User faculty = new User(null, "T101", "password", "Dr. Faculty", "CSE",
                                                "faculty@test.com",
                                                User.Role.FACULTY);
                                repository.save(faculty);
                                repository.save(new User(null, "S201", "password", "John Student", "CSE",
                                                "student@test.com",
                                                User.Role.STUDENT));
                                repository.save(
                                                new User(null, "ADH-001", "admin", "Admin User", "ADMIN",
                                                                "admin@test.com", User.Role.ADMIN));

                                // HOD
                                repository.save(new User(null, "HOD1", "password", "Dr. HOD", "CSE", "hod@test.com",
                                                User.Role.HOD));

                                // Additional Faculty
                                User faculty2 = new User(null, "T102", "password", "Prof. OS Expert", "CSE",
                                                "os@test.com", User.Role.FACULTY); // Operating Systems
                                repository.save(faculty2);

                                User faculty3 = new User(null, "T103", "password", "Prof. network", "CSE",
                                                "net@test.com", User.Role.FACULTY); // Computer Networks
                                repository.save(faculty3);

                                User faculty4 = new User(null, "T104", "password", "Prof. AI", "CSE", "ai@test.com",
                                                User.Role.FACULTY); // AI
                                repository.save(faculty4);

                                System.out.println("Dummy users created: T101, S201, ADH-001, HOD1");

                                // Seed Timetable
                                timetableRepository
                                                .save(new TimetableEntry("MONDAY", "09:00", "10:00", "Java Full Stack",
                                                                "CSE", faculty));
                                timetableRepository
                                                .save(new TimetableEntry("MONDAY", "10:00", "11:00", "Data Structures",
                                                                "CSE", faculty));
                                timetableRepository
                                                .save(new TimetableEntry("TUESDAY", "09:00", "10:00",
                                                                "Database Systems", "CSE", faculty));

                                // New Subjects Timetable
                                timetableRepository
                                                .save(new TimetableEntry("WEDNESDAY", "11:00", "12:00",
                                                                "Operating Systems", "CSE", faculty2));
                                timetableRepository
                                                .save(new TimetableEntry("THURSDAY", "14:00", "15:00",
                                                                "Computer Networks", "CSE", faculty3));
                                timetableRepository
                                                .save(new TimetableEntry("FRIDAY", "10:00", "11:00",
                                                                "Artificial Intelligence", "CSE", faculty4));
                        }
                };
        }
}
