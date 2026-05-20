import express from 'express';
import { db } from '../config/db.js';
import { chatMessage, user } from '../db/schema.js';
import { eq, or, and, asc, desc, isNull, sql } from 'drizzle-orm';
import { encryptText, decryptText } from '../utils/crypto.js';
import ably from '../lib/ably.js';

const router = express.Router();

// Middleware to ensure user is authenticated (using Better Auth session if we have it here, 
// but assuming client sends authentication context or we check session via better-auth middleware)
// For simplicity, assuming `req.user` is populated or we rely on body params for now (adjust based on project auth structure)

/**
 * Get all users for admin chat dashboard
 */
router.get('/users', async (req, res) => {
  try {
    const actor = (req as any).user;
    if (actor.role !== 'admin' && actor.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Hanya Admin yang dapat memuat daftar obrolan.' });
    }

    const users = await db.execute(sql`
      SELECT u.id, u.name, u.nip, u.image, MAX(c.created_at) as "lastMessageAt"
      FROM "user" u
      LEFT JOIN chat_message c ON c.sender_id = u.id OR c.receiver_id = u.id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY "lastMessageAt" DESC NULLS LAST
    `);
    
    // Send to client
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Get chat history for a specific user.
 * Admin can fetch history with any user by passing userId in query.
 * Normal users will just fetch their own history with admin.
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const actor = (req as any).user;
    
    // Determine the user we are fetching history for securely:
    // Standard user is forced to fetch their own history with admin
    const targetUserId = (actor.role === 'admin' || actor.role === 'superadmin') ? userId : actor.id;
    
    // Fetch messages where sender is targetUser OR receiver is targetUser
    const messages = await db
      .select()
      .from(chatMessage)
      .where(
        or(
          eq(chatMessage.senderId, targetUserId),
          eq(chatMessage.receiverId, targetUserId),
        )
      )
      .orderBy(asc(chatMessage.createdAt));

    // Decrypt messages before sending to client
    const decryptedMessages = messages.map((msg: any) => ({
      ...msg,
      content: decryptText(msg.content),
    }));

    res.json(decryptedMessages);
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

/**
 * Send a new chat message
 */
router.post('/send', async (req, res) => {
  try {
    const { receiverId, content, tempId } = req.body;
    const actor = (req as any).user;

    if (!content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Encrypt the content before saving
    const encryptedContent = encryptText(content);

    // Save to database securely using req.user
    const now = new Date();
    const [newMessage] = await db
      .insert(chatMessage)
      .values({
        senderId: actor.id,
        receiverId: receiverId || null,
        content: encryptedContent,
        isRead: false,
        createdAt: now,
      })
      .returning();

    // Prepare message for Ably broadcast (decrypted for the client)
    const broadcastMessage = {
      ...newMessage,
      content: content, // send raw text over Ably (it's over TLS)
      tempId: tempId, // Pass tempId back for optimistic UI
    };

    const userChannelId = actor.role === 'admin' || actor.role === 'superadmin' ? receiverId : actor.id;
    
    if (userChannelId) {
       // Send to user's specific channel
       await ably.channels.get(`chat:user_${userChannelId}`).publish('new_message', broadcastMessage);
    }
    
    // Also send to global admin channel so all admins see incoming messages immediately
    if (actor.role === 'user') {
      await ably.channels.get('chat:admin').publish('new_message', broadcastMessage);
    }

    res.status(201).json(broadcastMessage);
  } catch (error) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * Mark messages as read
 */
router.post('/mark-read', async (req, res) => {
  try {
    const actor = (req as any).user;
    const { userId } = req.body; // The other user's ID

    if (actor.role === 'admin' || actor.role === 'superadmin') {
      if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
      }
      // Mark all messages from this user as read
      await db
        .update(chatMessage)
        .set({ isRead: true })
        .where(
          and(
            eq(chatMessage.senderId, userId),
            eq(chatMessage.receiverId, actor.id)
          )
        );
    } else {
      // Mark all messages to this user as read
      await db
        .update(chatMessage)
        .set({ isRead: true })
        .where(eq(chatMessage.receiverId, actor.id));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to mark read:', error);
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

/**
 * Clear chat history between admin and user
 */
router.delete('/clear/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const actor = (req as any).user;

    if (actor.role !== 'admin' && actor.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only admins can clear chat history' });
    }

    // Delete messages involving this user
    await db
      .delete(chatMessage)
      .where(
        or(
          eq(chatMessage.senderId, userId),
          eq(chatMessage.receiverId, userId)
        )
      );

    // Optional: broadcast clear to client so they can wipe it live
    await ably.channels.get(`chat:user_${userId}`).publish('clear_chat', { userId });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to clear chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

export default router;
