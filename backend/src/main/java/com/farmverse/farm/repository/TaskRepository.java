package com.farmverse.farm.repository;

import com.farmverse.farm.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    /** assignedTo = 0 means "any assignee". */
    @Query("""
            select t from Task t
            where t.farmId in :ids and t.status like :status
              and (:assignedTo = 0L or t.assignedTo = :assignedTo)""")
    Page<Task> search(@Param("ids") Collection<Long> ids, @Param("status") String status,
                      @Param("assignedTo") long assignedTo, Pageable pageable);

    List<Task> findByStatusInAndDueDateBefore(Collection<String> statuses, LocalDate date);
}
