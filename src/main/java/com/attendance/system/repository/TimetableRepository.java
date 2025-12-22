package com.attendance.system.repository;

import com.attendance.system.model.TimetableEntry;
import com.attendance.system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TimetableRepository extends JpaRepository<TimetableEntry, Long> {
    List<TimetableEntry> findBySection(String section);

    List<TimetableEntry> findByFaculty(User faculty);
}
