'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { useTranslation } from 'react-i18next';
import '../../../styles/channel.css';

const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'sH8KfY1rjowV4OyQFLVU7n0H0oYqD2bn');

type Msg =
  | { kind: "system"; text: string }
  | { kind: "room"; id: string; sender: string; text: string; reactions?: string[] };

let typingTimeout: NodeJS.Timeout | null = null;

export default function ChatPage() {
  const { channelId } = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  const [serverId, setServerId] = useState<string>("");
  const [channelName, setChannelName] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [typingText, setTypingText] = useState("");
  const [showGifPicker, setShowGifPicker] = useState(false);

  const sock = useRef<Socket | null>(null);
  const joinedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const sendGif = (gif: any, e: React.SyntheticEvent<HTMLElement, Event>) => {
    e.preventDefault();
    if (!sock.current) return;
    sock.current.emit("channel message", { 
      channelId: String(channelId), 
      msg: gif.images.fixed_height.url 
    });
    setShowGifPicker(false);
  };

  // Récupération des infos du channel
  useEffect(() => {
    const fetchChannel = async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/connexion");

      try {
        const res = await fetch(`http://localhost:3001/api/servers/channel/${channelId}`, {
          headers: { Authorization: "Bearer " + token },
        });

        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        setChannelName(data.data.name);
        setServerId(data.data.server_id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChannel();
  }, [channelId, router]);

  const handleDeleteChannel = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`http://localhost:3001/api/servers/channel/${channelId}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      router.push(`/channel/${serverId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const leaveChannel = () => {
    if (sock.current) {
      sock.current.emit("leave channel", String(channelId));
      joinedRef.current = false;
      sock.current.disconnect();
    }
    router.push(`/channel/${serverId}`);
  };

  // Configuration de Socket.IO
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const s = io("http://localhost:3001", { auth: { token }, autoConnect: false });
    sock.current = s;

    // 1. Écoute des messages systèmes
    s.on("system", (m: string) => setMsgs((prev) => [...prev, { kind: "system", text: String(m) }]));

    // 2. ÉCOUTE DES NOUVEAUX MESSAGES DU CHAT
    s.on("channel message", (incomingMsg: any) => {
      setMsgs((prev) => [
        ...prev, 
        { 
          kind: "room", 
          id: incomingMsg.id, 
          sender: incomingMsg.sender, 
          // On sécurise ici la récupération de la chaîne de texte !
          text: incomingMsg.msg || "", 
          reactions: incomingMsg.reactions || [] 
        }
      ]);
    });

    // 3. Écoute des modifications
    s.on("message edited", (p: { id: string; newMsg: string }) => {
      setMsgs((prev) => prev.map((m) => (m.kind === "room" && m.id === p.id ? { ...m, text: p.newMsg || "" } : m)));
    });

    // 4. Écoute des réactions
    s.on("message reacted", (p: { messageId: string; emoji: string }) => {
      setMsgs((prev) => prev.map((m) => {
        if (m.kind === "room" && m.id === p.messageId) {
          return { ...m, reactions: [...(m.reactions || []), p.emoji] };
        }
        return m;
      }));
    });

    // 5. Écoute des utilisateurs en ligne et frappe
    s.on("channel users", (data: any) => setUsers(Array.isArray(data.users) ? data.users : []));
    s.on("typing", (data: any) => setTypingText(data.isTyping ? `${data.user} est en train d'écrire...` : ""));

    // 6. Expulsions
    s.on("kicked_from_server", (data: { serverId: string | number }) => {
      if (String(data.serverId) === String(serverId)) {
        alert("Tu as été expulsé de ce serveur.");
        router.push('/server');
      }
    });

    s.connect();
    s.emit("join channel", String(channelId));
    joinedRef.current = true;

    return () => {
      if (joinedRef.current) {
        s.emit("leave channel", String(channelId));
        joinedRef.current = false;
      }
      s.disconnect();
    };
  }, [channelId, serverId, router, channelName]);

  const handleTyping = (value: string) => {
    setText(value);
    if (!sock.current) return;
    sock.current.emit("typing", { channelId, isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => sock.current?.emit("typing", { channelId, isTyping: false }), 900);
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    
    sock.current?.emit("channel message", { channelId: String(channelId), msg });
    sock.current?.emit("typing", { channelId, isTyping: false });
    setText("");
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>{channelName || "..."}</h1>
        <div className="chat-header-info">
          <span className="user-count">👥 {users.length} {t('online', 'En ligne')}</span>
          <button className="btn-leave" onClick={leaveChannel}>{t('leave', 'Quitter')}</button>
          <button className="btn-delete" onClick={handleDeleteChannel}>{t('delete', 'Supprimer')}</button>
        </div>
      </div>

      <div className="chat-messages">
        {msgs.map((m, i) => (
          <div key={i}>
            {m.kind === "system" ? (
              <div className="system-message">{m.text}</div>
            ) : (
              <div className="message-row">
                <div className="avatar">{m.sender.charAt(0).toUpperCase()}</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">{m.sender}</span>
                    <span className="message-time">{t('today', "Aujourd'hui")}</span>
                  </div>
                  
                  <div className="message-text">
                    {/* SÉCURITÉ ABSOLUE : on vérifie que text est bien une string existante avant le includes */}
                    {typeof m.text === 'string' && m.text.includes('giphy.com/media') ? (
                      <img src={m.text} alt="gif" style={{ borderRadius: '8px', marginTop: '5px', maxWidth: '250px' }} />
                    ) : (
                      <>{m.text || ""}</>
                    )}
                  </div>
                  
                  {m.reactions && m.reactions.length > 0 && (
                    <div className="message-reactions">
                      {m.reactions.map((emoji, idx) => (
                        <span key={idx} className="reaction">{emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="message-actions">
                  <button className="action-btn" title="Éditer" onClick={() => {
                    const newText = prompt("Modifier le message :", m.text);
                    if (newText) sock.current?.emit('edit message', { channelId, messageId: m.id, newMsg: newText });
                  }}>✏️</button>
                  <button className="action-btn" title="Réagir" onClick={() => sock.current?.emit('react message', { channelId, messageId: m.id, emoji: '🔥' })}>🔥</button>
                  <button className="action-btn" title="Réagir" onClick={() => sock.current?.emit('react message', { channelId, messageId: m.id, emoji: '😂' })}>😂</button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="typing-indicator">{typingText}</div>
        
        {showGifPicker && (
          <div className="gif-picker-popup">
            <Grid width={350} columns={3} fetchGifs={(offset) => gf.trending({ offset, limit: 10 })} onGifClick={sendGif} />
          </div>
        )}

        <form className="input-wrapper" onSubmit={send}>
          <button type="button" className="btn-gif-toggle" onClick={() => setShowGifPicker(!showGifPicker)}>
            GIF
          </button>
          <input 
            className="chat-input"
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder={`${t('message_placeholder', 'Envoyer un message dans')} #${channelName}...`}
          />
        </form>
      </div>
    </div>
  );
}