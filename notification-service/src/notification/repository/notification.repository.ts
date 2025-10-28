import Database from 'better-sqlite3';
import {
    Notification,
    CreateNotificationRequest,
    UpdateNotificationRequest,
    NotificationFilters,
    NotificationStats
} from '../types/notification.types.js';

export class NotificationRepository {
    private db: Database.Database;

    constructor(db: Database.Database) {
        this.db = db;
    }

    // Create a new notification
    create(fromUserId: number, data: CreateNotificationRequest): Notification {
        const stmt = this.db.prepare(`
            INSERT INTO notifications (from_user_id, to_user_id, title, message, type)
            VALUES (?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            fromUserId,
            data.to_user_id,
            data.title,
            data.message,
            data.type || 'chat_message'
        );

        return this.findById(result.lastInsertRowid as number)!;
    }

    // Find notification by ID
    findById(id: number): Notification | null {
        const stmt = this.db.prepare(`
            SELECT * FROM notifications WHERE id = ?
        `);

        const row = stmt.get(id) as any;
        return row ? this.mapRowToNotification(row) : null;
    }

    // Find notifications for a specific user with filters
    findByUserId(userId: number, filters: NotificationFilters = {}): Notification[] {
        let query = `SELECT * FROM notifications WHERE to_user_id = ?`;
        const params: any[] = [userId];

        if (filters.is_read !== undefined) {
            query += ` AND is_read = ?`;
            params.push(filters.is_read);
        }

        if (filters.type) {
            query += ` AND type = ?`;
            params.push(filters.type);
        }

        if (filters.from_user_id) {
            query += ` AND from_user_id = ?`;
            params.push(filters.from_user_id);
        }

        query += ` ORDER BY created_at DESC`;

        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(filters.limit);
        }

        if (filters.offset) {
            query += ` OFFSET ?`;
            params.push(filters.offset);
        }

        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params) as any[];

        return rows.map(row => this.mapRowToNotification(row));
    }

    // Update notification
    update(id: number, userId: number, data: UpdateNotificationRequest): Notification | null {
        const fields: string[] = [];
        const params: any[] = [];

        if (data.is_read !== undefined) {
            fields.push('is_read = ?');
            params.push(data.is_read);
        }

        if (data.title) {
            fields.push('title = ?');
            params.push(data.title);
        }

        if (data.message) {
            fields.push('message = ?');
            params.push(data.message);
        }

        if (data.type) {
            fields.push('type = ?');
            params.push(data.type);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id, userId);

        const query = `
            UPDATE notifications
            SET ${fields.join(', ')}
            WHERE id = ? AND to_user_id = ?
        `;

        const stmt = this.db.prepare(query);
        const result = stmt.run(...params);

        return result.changes > 0 ? this.findById(id) : null;
    }

    // Delete notification
    delete(id: number, userId: number): boolean {
        const stmt = this.db.prepare(`
            DELETE FROM notifications
            WHERE id = ? AND to_user_id = ?
        `);

        const result = stmt.run(id, userId);
        return result.changes > 0;
    }

    // Mark all notifications as read for a user
    markAllAsRead(userId: number, filters: { type?: string; from_user_id?: number } = {}): number {
        let query = `UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE to_user_id = ? AND is_read = 0`;
        const params: any[] = [userId];

        if (filters.type) {
            query += ` AND type = ?`;
            params.push(filters.type);
        }

        if (filters.from_user_id) {
            query += ` AND from_user_id = ?`;
            params.push(filters.from_user_id);
        }

        const stmt = this.db.prepare(query);
        const result = stmt.run(...params);
        return result.changes;
    }

    // Get notification stats for a user
    getStats(userId: number): NotificationStats {
        const stmt = this.db.prepare(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
                SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read
            FROM notifications
            WHERE to_user_id = ?
        `);

        const row = stmt.get(userId) as any;
        return {
            total: row.total || 0,
            unread: row.unread || 0,
            read: row.read || 0
        };
    }

    // Get unread notifications count
    getUnreadCount(userId: number): number {
        const stmt = this.db.prepare(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE to_user_id = ? AND is_read = 0
        `);

        const row = stmt.get(userId) as any;
        return row.count || 0;
    }

    // Helper method to map database row to Notification object
    private mapRowToNotification(row: any): Notification {
        return {
            id: row.id,
            from_user_id: row.from_user_id,
            to_user_id: row.to_user_id,
            title: row.title,
            message: row.message,
            type: row.type,
            is_read: Boolean(row.is_read),
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }
}
