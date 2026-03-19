CREATE TABLE IF NOT EXISTS trade_lock_config (
    id INT PRIMARY KEY CHECK (id = 1),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    lock_window_minutes INT NOT NULL DEFAULT 60 CHECK (lock_window_minutes >= 0 AND lock_window_minutes <= 720),
    manual_lock BOOLEAN NOT NULL DEFAULT false,
    manual_unlock_until TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO trade_lock_config (id, is_enabled, lock_window_minutes, manual_lock, manual_unlock_until)
VALUES (1, true, 60, false, NULL)
ON CONFLICT (id) DO NOTHING;

