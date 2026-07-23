import express from 'express';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import { db } from '../db.js';

dotenv.config();

const router = express.Router();
const DAILY_API_KEY = process.env.DAILY_API_KEY;

/**
 * POST /api/video/room/:sessionId
 * Creates or retrieves a Daily.co room for a specific session.
 */
router.post('/room/:sessionId', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;

  try {
    // 1. Verify the session exists
    const session = await db.findOne('sessions', s => s.id === sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // 2. Ensure only authorized participants can access the room
    const uid = req.user.uid;
    if (session.teacherId !== uid && session.parentId !== uid && session.studentId !== uid) {
      // Allow Admin override if necessary
      if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: "Access forbidden. Not a participant of this session." });
      }
    }

    // 3. If a room URL already exists for this session, return it immediately
    if (session.classLink && session.classLink.includes('daily.co')) {
      return res.json({ url: session.classLink, room: session.id });
    }

    // 4. If no DAILY_API_KEY is configured, provide a fallback mock URL
    if (!DAILY_API_KEY || DAILY_API_KEY.includes('your_key_here')) {
      console.warn("[VIDEO] No DAILY_API_KEY configured. Returning mock classLink.");
      const mockUrl = `https://mock.daily.co/${sessionId}`;
      await db.update('sessions', sessionId, { classLink: mockUrl });
      return res.json({ url: mockUrl, room: sessionId });
    }

    // 5. Create a new room using Daily REST API
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`
      },
      body: JSON.stringify({
        name: sessionId, // Use sessionId as the room name for idempotency
        properties: {
          exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // Expires in 4 hours
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false
        }
      })
    });

    const data = await response.json();

    // Daily returns a 400 with info message if the room name already exists
    if (!response.ok && data.info !== 'a room with that name already exists') {
      console.error("[VIDEO] Failed to create Daily room:", data);
      return res.status(500).json({ error: "Failed to provision video room." });
    }

    // Determine the room URL. If it already existed, we must fetch it.
    let roomUrl = data.url;
    if (!response.ok && data.info === 'a room with that name already exists') {
      const getRes = await fetch(`https://api.daily.co/v1/rooms/${sessionId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` }
      });
      const existingRoomData = await getRes.json();
      roomUrl = existingRoomData.url;
    }

    if (!roomUrl) {
      throw new Error("Could not acquire Daily.co room URL.");
    }

    // 6. Save the newly created room URL to the session record in Firestore
    await db.update('sessions', sessionId, { classLink: roomUrl });

    res.json({ url: roomUrl, room: sessionId });

  } catch (err) {
    console.error("[VIDEO] Room generation error:", err);
    res.status(500).json({ error: "Internal server error during video provisioning." });
  }
});

export default router;
