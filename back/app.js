import express from 'express';
import cors from 'cors';
import some_error from './middleware/Error.js';
import User from './Routes/User.js';
import authRoutes from './Routes/Auth.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pool from './Config/DataBase.js';
import jwt from 'jsonwebtoken';
import Servers from './Routes/Server.js';
import { saveMessageService, editMessageService, addReactionService } from './Models/MessageModel.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/api', User);
app.use('/api/servers', Servers);

app.use(some_error);

pool.connect()
  .then(() => {
    console.log('Connecté à PostgreSQL');

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: { origin: 'http://localhost:3000' },
    });

    const updateUsers = async (channelId) => {
      const sockets = await io.in(channelId).fetchSockets();
      const users = sockets.map(s => s.data.displayName).filter(Boolean);
      io.to(channelId).emit('channel users', { channelId, users });
    };

    io.on('connection', (socket) => {
      let displayName;

      try {
        const token = socket.handshake.auth?.token;
        if (!token) return socket.disconnect();

        socket.user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        displayName =
          (socket.user?.first_name && String(socket.user.first_name).trim()) ||
          (socket.user?.name && String(socket.user.name).trim()) ||
          `user-${socket.id.slice(0, 5)}`;

        socket.data.displayName = displayName;

        socket.emit('system', `Bienvenue ${displayName} !`);
      } catch {
        return socket.disconnect();
      }

      socket.on('join channel', async (channelId) => {
        const room = String(channelId || '').trim();
        if (!room) return;
        socket.data.channelId = room;
        await socket.join(room);
        socket.emit('system', `Tu as rejoint le channel ${room}`);
        socket.to(room).emit('system', `${displayName} a rejoint le channel`);
        await updateUsers(room);
      });

      socket.on('leave channel', async (channelId) => {
        const room = String(channelId || '').trim();
        if (!room) return;
        await socket.leave(room);
        if (socket.data.channelId === room) socket.data.channelId = null;
        socket.emit('system', `Tu as quitté le channel ${room}`);
        socket.to(room).emit('system', `${displayName} a quitté le channel`);
        await updateUsers(room);
      });

      socket.on('channel message', async ({ channelId, msg }) => {
        const room = String(channelId || '').trim();
        const message = String(msg || '').trim();
        if (!room || !message) return;
        try {
          const savedMsg = await saveMessageService(message, socket.user.id, room);
          io.to(room).emit('channel message', {
            id: savedMsg.id, 
            channelId: room,
            msg: message,
            sender: displayName,
          });
        } catch (error) {
          console.error("Erreur sauvegarde message:", error);
        }
      });

      socket.on('edit message', async ({ channelId, messageId, newMsg }) => {
        try {
          const updatedMsg = await editMessageService(messageId, socket.user.id, newMsg);
          if (updatedMsg) {
            io.to(String(channelId)).emit('message edited', {
              id: messageId,
              newMsg: newMsg
            });
          }
        } catch (error) {
          console.error("Erreur modification message:", error);
        }
      });

      socket.on('react message', async ({ channelId, messageId, emoji }) => {
        try {
          const reaction = await addReactionService(messageId, socket.user.id, emoji);
          if (reaction) {
            io.to(String(channelId)).emit('message reacted', {
              messageId,
              emoji
            });
          }
        } catch (error) {
          console.error("Erreur réaction message:", error);
        }
      });

      // --- NOUVEAU CODE POUR LES MP ---
      socket.on('private message', async ({ receiverId, msg }) => {
        const messageContent = String(msg || '').trim();
        if (!receiverId || !messageContent) return;

        try {
          // Sauvegarder dans la DB (Ta table private_messages)
          const savedMsg = await pool.query(
            `INSERT INTO private_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *`,
            [socket.user.id, receiverId, messageContent]
          );

          const messageData = {
            id: savedMsg.rows[0].id,
            senderId: socket.user.id,
            senderName: displayName,
            msg: messageContent
          };

          // On s'envoie le message à nous-même
          socket.emit('private message', messageData);

          // On cherche la connexion de l'autre personne pour l'envoyer en direct
          const sockets = await io.fetchSockets();
          const receiverSocket = sockets.find(s => s.user && String(s.user.id) === String(receiverId));
          
          if (receiverSocket) {
            receiverSocket.emit('private message', messageData);
          }
        } catch (error) {
          console.error("Erreur MP:", error);
        }
      });

      socket.on('typing', ({ channelId, isTyping }) => {
        const room = String(channelId || '').trim();
        if (!room) return;

        socket.to(room).emit('typing', {
          channelId: room,
          user: displayName,
          isTyping: !!isTyping,
        });
      });

      socket.on('disconnect', async () => {
        const room = socket.data.channelId;
        if (room) await updateUsers(room);
      });
    });

    const PORT_BACK = process.env.PORT_BACK || 3001;
    httpServer.listen(PORT_BACK, () => {
      console.log(`Server running on port ${PORT_BACK}`);
    });
  })
  .catch(err => console.error('Erreur de connexion à PostgreSQL :', err));