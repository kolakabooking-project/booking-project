-- Performance indexes for Bookolaka
-- These indexes address the main query bottlenecks identified in the performance audit.

-- ═══════════════════════════════════════════════════════════
-- activity_log: Most impactful — queried on every dashboard/log page load
-- ═══════════════════════════════════════════════════════════

-- Used by: ORDER BY created_at DESC (every log query)
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);

-- Used by: WHERE action = ? (filter by action type)
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log (action);

-- Used by: WHERE user_id = ? (filter by user)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log (user_id);

-- Composite index for the most common query pattern: filter + sort
CREATE INDEX IF NOT EXISTS idx_activity_log_action_created ON activity_log (action, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- user: Queried on every dashboard load for stats and user listing
-- ═══════════════════════════════════════════════════════════

-- Used by: GROUP BY role (stats), WHERE role = ? (filter)
CREATE INDEX IF NOT EXISTS idx_user_role ON "user" (role);

-- Used by: ORDER BY created_at DESC (recent users listing)
CREATE INDEX IF NOT EXISTS idx_user_created_at ON "user" (created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- session: Queried by authGuard on EVERY authenticated request
-- ═══════════════════════════════════════════════════════════

-- Used by: WHERE user_id = ? (session invalidation on logout/password reset)
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session (user_id);

-- ═══════════════════════════════════════════════════════════
-- booking: Frequently queried by admin dashboard
-- ═══════════════════════════════════════════════════════════

-- Used by: WHERE user_id = ? (my bookings)
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON booking (user_id);

-- Used by: WHERE status = ? (pending bookings, filters)
CREATE INDEX IF NOT EXISTS idx_booking_status ON booking (status);

-- Used by: ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_booking_created_at ON booking (created_at DESC);
