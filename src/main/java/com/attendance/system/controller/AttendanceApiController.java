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
        int durationMinutes = payload.get("durationMinutes") != null
                ? Integer.parseInt(payload.get("durationMinutes").toString())
                : 60;
        int tokenLength = payload.get("tokenLength") != null
                ? Integer.parseInt(payload.get("tokenLength").toString())
                : 0;

        AttendanceSession session = attendanceService.startSession(facultyId, subject, section, lat, lng,
                durationMinutes, tokenLength);
        return ResponseEntity.ok(session);
    }

    @PostMapping("/mark-attendance")
    public ResponseEntity<?> markAttendance(@RequestBody Map<String, Object> payload) {
        Long sessionId = null;
        if (payload.get("sessionId") != null && !payload.get("sessionId").toString().isEmpty()) {
            try {
                sessionId = Long.valueOf(payload.get("sessionId").toString());
            } catch (Exception e) {
            }
        }

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

    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminStats() {
        return ResponseEntity.ok(attendanceService.getAdminStats());
    }

    @PostMapping("/admin/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> payload) {
        try {
            String username = payload.get("username");
            String password = payload.get("password");
            String fullName = payload.get("fullName");
            String department = payload.get("department");
            String email = payload.get("email");
            String roleStr = payload.get("role");

            User.Role role = User.Role.valueOf(roleStr); // simple enum conversion

            User newUser = attendanceService.createUser(username, password, fullName, department, email, role);
            return ResponseEntity.ok(newUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(attendanceService.getAllUsers());
    }

    @GetMapping("/student/{id}/history")
    public ResponseEntity<?> getStudentHistory(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceService.getStudentHistory(id));
    }

    @GetMapping("/timetable")
    public ResponseEntity<?> getTimetable() {
        return ResponseEntity.ok(attendanceService.getAllTimetableEntries());
    }

    @PostMapping("/admin/timetable")
    public ResponseEntity<?> createTimetable(@RequestBody Map<String, String> payload) {
        String dayOfWeek = payload.get("dayOfWeek");
        String startTime = payload.get("startTime");
        String endTime = payload.get("endTime");
        String subject = payload.get("subject");
        String section = payload.get("section");
        String facultyId = payload.get("facultyId");

        try {
            return ResponseEntity.ok(
                    attendanceService.createTimetableEntry(dayOfWeek, startTime, endTime, subject, section, facultyId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/session/active")
    public ResponseEntity<?> getActiveSession(@RequestParam String subject, @RequestParam String section) {
        return ResponseEntity.of(attendanceService.getActiveSession(subject, section));
    }

    @DeleteMapping("/admin/timetable/{id}")
    public ResponseEntity<?> deleteTimetable(@PathVariable Long id) {
        attendanceService.deleteTimetableEntry(id);
        return ResponseEntity.ok("Deleted");
    }
}
