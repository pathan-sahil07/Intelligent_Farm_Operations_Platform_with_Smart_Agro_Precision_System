package com.farmverse.farm.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
            select u from AppUser u
            where (:role is null or u.role = :role)
              and (:q is null or lower(u.fullName) like lower(concat('%', :q, '%'))
                   or lower(u.email) like lower(concat('%', :q, '%')))
            """)
    Page<AppUser> search(@Param("q") String q, @Param("role") String role, Pageable pageable);

    @Query("""
            select u from AppUser u
            where u.active = true
              and (lower(u.fullName) like lower(concat('%', :q, '%'))
                   or lower(u.email) like lower(concat('%', :q, '%')))
            order by u.fullName
            """)
    List<AppUser> lookup(@Param("q") String q, Pageable pageable);
}
