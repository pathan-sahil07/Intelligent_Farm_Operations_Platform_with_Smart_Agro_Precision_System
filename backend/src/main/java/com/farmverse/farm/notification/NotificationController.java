package com.farmverse.farm.notification;

import com.farmverse.farm.exception.ResourceNotFoundException;
import com.farmverse.farm.security.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** Every user sees and changes only their own notifications. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Page<Notification> list(@RequestParam(defaultValue = "false") boolean unreadOnly,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        Long userId = CurrentUser.get().getId();
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        return unreadOnly ? repository.findByUserIdAndReadFalse(userId, pageable)
                : repository.findByUserId(userId, pageable);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", repository.countByUserIdAndReadFalse(CurrentUser.get().getId()));
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public Notification markRead(@PathVariable Long id) {
        Notification n = repository.findByIdAndUserId(id, CurrentUser.get().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        n.setRead(true);
        return repository.save(n);
    }

    @PostMapping("/read-all")
    @Transactional
    public Map<String, Integer> readAll() {
        return Map.of("updated", repository.markAllRead(CurrentUser.get().getId()));
    }
}
