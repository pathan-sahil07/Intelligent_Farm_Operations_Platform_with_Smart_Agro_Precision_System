package com.farmverse.farm.notification;

import com.farmverse.farm.entity.Farm;
import com.farmverse.farm.entity.FarmWorker;
import com.farmverse.farm.repository.FarmRepository;
import com.farmverse.farm.repository.FarmWorkerRepository;
import com.farmverse.farm.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.Set;

@Service
public class NotificationService {
    private final NotificationRepository notifications;
    private final FarmRepository farms;
    private final FarmWorkerRepository workers;
    private final UserRepository users;

    public NotificationService(NotificationRepository notifications, FarmRepository farms,
                               FarmWorkerRepository workers, UserRepository users) {
        this.notifications = notifications;
        this.farms = farms;
        this.workers = workers;
        this.users = users;
    }

    /** Notifies the farm owner and everyone assigned to the farm. Repeats with the same dedupeKey are skipped. */
    @Transactional
    public void notifyFarm(Long farmId, String type, String title, String message, String link, String dedupeKey) {
        Farm farm = farms.findById(farmId).orElse(null);
        if (farm == null) return;
        Set<Long> recipients = new LinkedHashSet<>();
        recipients.add(farm.getOwnerId());
        for (FarmWorker w : workers.findByFarm_Id(farmId)) {
            recipients.add(w.getUserId());
        }
        for (Long userId : recipients) {
            notifyUser(userId, type, title, message, link, dedupeKey);
        }
    }

    @Transactional
    public void notifyUser(Long userId, String type, String title, String message, String link, String dedupeKey) {
        if (userId == null || !users.existsById(userId)) return;
        if (dedupeKey != null && notifications.existsByUserIdAndDedupeKey(userId, dedupeKey)) return;
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(truncate(title, 200));
        n.setMessage(truncate(message, 1000));
        n.setLink(link);
        n.setDedupeKey(dedupeKey);
        notifications.save(n);
    }

    private static String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) : s;
    }
}
