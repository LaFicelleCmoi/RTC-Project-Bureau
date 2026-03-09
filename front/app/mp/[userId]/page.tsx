'use client';

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useTranslation } from 'react-i18next';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import '../../../styles/channel.css';

// --- SÉCURITÉ : Utilisation de la variable d'environnement pour Giphy ---
const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
if (!apiKey) {
  console.warn("Attention : La clé API Giphy est manquante dans les variables d'environnement.");
}
const gf = new GiphyFetch(apiKey || '');
// ------------------------------------------------------------------------

type PrivateMsg = { id: string; senderId: string | number; senderName: string; msg: string; };

export default function PrivateChatPage() {
  const params = useParams();
  const receiverId = params.userId as string; // Correspond au nom du dossier [userId]
  const router = useRouter();
  const { t } = useTranslation();

  const [receiverName, setReceiverName] = useState("Utilisateur...");
  const [msgs, setMsgs] = useState<PrivateMsg[]>([]);
  const [text, setText] = useState("");
  const [localUser, setLocalUser] = useState<any>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const sock = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // --- NOUVEAU : DEMANDE DE PERMISSION NOTIFICATION AU CHARGEMENT ---
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);
  // ------------------------------------------------------------------

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/connexion");
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setLocalUser(user);

    // 1. Récupérer le nom de la personne à qui on parle
    fetch(`http://localhost:3001/api/User/${receiverId}`)
      .then(res => res.json())
      .then(data => { if (data.data) setReceiverName(data.data.name); })
      .catch(console.error);

    // 2. Récupérer l'historique des MP
    fetch(`http://localhost:3001/api/User/${receiverId}/messages`, {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          const history = data.data.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: String(m.sender_id) === String(user.id) ? user.name : receiverName,
            msg: m.content
          }));
          setMsgs(history);
        }
      })
      .catch(console.error);

    // 3. Initialiser le Socket
    const s = io("http://localhost:3001", { auth: { token } });
    sock.current = s;

    s.on("private message", (data: { id: string; senderId: string; senderName: string; msg: string }) => {
      // On affiche le message s'il vient du destinataire ou si c'est nous qui l'avons envoyé
      if (String(data.senderId) === String(receiverId) || String(data.senderId) === String(user.id)) {
        setMsgs(prev => [...prev, { id: data.id, senderId: data.senderId, senderName: data.senderName, msg: data.msg }]);
      }

      // --- NOUVEAU : DÉCLENCHEMENT DE LA NOTIFICATION DESKTOP ---
      // On ne notifie que si le message vient de quelqu'un d'autre
      if (String(data.senderId) !== String(user.id)) {
        if (typeof window !== "undefined" && Notification.permission === "granted") {
          // Gère le cas où c'est un GIF pour avoir un joli texte de notification
          const notifBody = data.msg.includes('giphy.com') ? '🖼️ Vous a envoyé un GIF' : data.msg;
          
          new Notification(`Nouveau MP de ${data.senderName || receiverName}`, { 
            body: notifBody,
            icon: '/logo-icon.png' // L'icône de l'app si elle est dans public/
          });
        }
      }
      // -----------------------------------------------------------
    });

    return () => { s.disconnect(); };
  }, [receiverId, router, receiverName]); // Ajout de receiverName dans les dépendances

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    sock.current?.emit("private message", { receiverId: receiverId, msg });
    setText("");
  };

  const sendGif = (gif: any, e: React.SyntheticEvent<HTMLElement, Event>) => {
    e.preventDefault();
    if (!sock.current) return;
    sock.current.emit("private message", { 
      receiverId: receiverId, 
      msg: gif.images.fixed_height.url 
    });
    setShowGifPicker(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Conversation avec {receiverName}</h1>
        <button className="btn-leave" onClick={() => router.back()}>Retour</button>
      </div>

      <div className="chat-messages">
        {msgs.map((m, i) => (
          <div key={i} className="message-row">
            <div className="avatar">
              {String(m.senderId) === String(localUser?.id) ? "MOI" : receiverName.charAt(0)?.toUpperCase()}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-sender">
                  {String(m.senderId) === String(localUser?.id) ? localUser?.name : receiverName}
                </span>
              </div>
              <div className="message-text">
                {m.msg.includes('giphy.com/media') ? (
                  <img src={m.msg} alt="gif" style={{ borderRadius: '8px', marginTop: '5px', maxWidth: '250px' }} />
                ) : (
                  m.msg
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        {showGifPicker && (
          <div className="gif-picker-popup">
            <Grid width={350} columns={3} fetchGifs={(offset) => gf.trending({ offset, limit: 10 })} onGifClick={sendGif} />
          </div>
        )}
        <form className="input-wrapper" onSubmit={send}>
          <button type="button" className="btn-gif-toggle" onClick={() => setShowGifPicker(!showGifPicker)}>GIF</button>
          <input 
            className="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Message privé à @${receiverName}...`}
          />
        </form>
      </div>
    </div>
  );
}