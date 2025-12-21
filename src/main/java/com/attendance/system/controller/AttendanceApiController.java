package com.attendance.system.controller;

import com.attendance.system.model.AttendanceSession;
import com.attendance.system.model.User;
import com.attendance.system.repository.UserRepository;
import com.attendance.system.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AttendanceApiController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> creds) {
        String username = creds.get("username");
        String password = creds.get("password");
        String roleStr = creds.get("role");
        String department = creds.get("department");

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getPassword().equals(password)) {
                // Check Role
                if (roleStr == null || !user.getRole().name().equalsIgnoreCase(roleStr)) {
                    return ResponseEntity.status(401).body("Role mismatch for this user");
                }
                // Check Department (if applicable - Admin might not need check, but user asked
                // for it)
                if (department != null && !department.isEmpty() && !user.getDepartment().equalsIgnoreCase(department)) {
                    return ResponseEntity.status(401).body("Department mismatch");
                }

                return ResponseEntity.ok(user);
            }
        }
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @PostMapping("/start-session")
    public ResponseEntity<?> startSession(@RequestBody Map<String, Object> payload) {
        Long facultyId = Long.valueOf(payload.get("facultyId").toString());
        String subject = (String) payload.get("subject");
        String section = (String) payload.get("section");
        double lat = Double.parseDouble(payload.get("latitude").toString());
        double lng = Double.parseDouble(payload.get("longitude").toString());

        AttendanceSession session = attendanceService.startSession(facultyId, subject, section, lat, lng);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/mark-attendance")
    public ResponseEntity<?> markAttendance(@RequestBody Map<String, Object> payload) {
        Long sessionId = Long.valueOf(payload.get("sessionId").toString());
        Long studentId = Long.valueOf(payload.get("studentId").toString());
        double lat = Double.parseDouble(payload.get("latitude").toString());
        double lng = Double.parseDouble(payload.get("longitude").toString());
        String qrToken = (String) payload.get("qrToken");

        String result = attendanceService.markAttendance(sessionId, studentId, lat, lng, qrToken);
        if (result.startsWith("Failed")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
