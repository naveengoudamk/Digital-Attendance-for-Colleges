package com.attendance.system.repository;

import com.attendance.system.model.AttendanceSession;
import com.attendance.system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByFacultyAndIsActive(User faculty, boolean isActive);
}
