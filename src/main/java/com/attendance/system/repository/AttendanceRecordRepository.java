package com.attendance.system.repository;

import com.attendance.system.model.AttendanceRecord;
import com.attendance.system.model.AttendanceSession;
import com.attendance.system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findBySessionAndStudentAndStatus(AttendanceSession session, User student,
            AttendanceRecord.Status status);

    // Check if any record exists for this session/student regardless of status
    // first?
    // Actually we only care about if they are already PRESENT.
    boolean existsBySessionAndStudentAndStatus(AttendanceSession session, User student, AttendanceRecord.Status status);

    java.util.List<AttendanceRecord> findByStudent(User student);
}
