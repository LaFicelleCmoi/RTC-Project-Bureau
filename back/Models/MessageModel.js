import pool from "../Config/DataBase.js";

export const saveMessageService = async (content, userId, channelId) => {
  const result = await pool.query(
    `INSERT INTO messages (content, user_id, channel_id) 
     VALUES ($1, $2, $3) RETURNING *`,
    [content, userId, channelId]
  );
  return result.rows[0];
};

export const editMessageService = async (messageId, userId, newContent) => {
  const result = await pool.query(
    `UPDATE messages 
     SET content = $1, updated_at = NOW() 
     WHERE id = $2 AND user_id = $3 RETURNING *`,
    [newContent, messageId, userId]
  );
  return result.rows[0];
};

export const addReactionService = async (messageId, userId, emoji) => {
  const result = await pool.query(
    `INSERT INTO reactions (message_id, user_id, emoji) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (message_id, user_id, emoji) DO NOTHING 
     RETURNING *`,
    [messageId, userId, emoji]
  );
  return result.rows[0];
};

export const savePrivateMessageService = async (senderId, receiverId, content) => {
  const result = await pool.query(
    `INSERT INTO private_messages (sender_id, receiver_id, content) 
     VALUES ($1, $2, $3) RETURNING *`,
    [senderId, receiverId, content]
  );
  return result.rows[0];
};

export const getPrivateMessagesService = async (userId1, userId2) => {
  const result = await pool.query(
    `SELECT * FROM private_messages 
     WHERE (sender_id = $1 AND receiver_id = $2) 
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC`,
    [userId1, userId2]
  );
  return result.rows;
};