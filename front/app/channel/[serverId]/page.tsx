'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import '../../../styles/serverActions.css';

type Channel = { id: number; name: string; server_id: number; };
type User = { id: string | number; name: string; }; 

export default function ChannelPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const router = useRouter();
  const { t } = useTranslation();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [localUser, setLocalUser] = useState<any>(null); 

  useEffect(() => {
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setLocalUser(user);

    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/connexion");

      try {
        const resChannels = await fetch(`http://localhost:3001/api/servers/${serverId}/channels`, { headers: { Authorization: "Bearer " + token }});
        if (resChannels.ok) setChannels((await resChannels.json()).data);

        const resUsers = await fetch(`http://localhost:3001/api/servers/${serverId}/users`, { headers: { Authorization: "Bearer " + token }});
        if (resUsers.ok) setUsers((await resUsers.json()).data);

        const resInvite = await fetch(`http://localhost:3001/api/servers/${serverId}/inviteCode`, { headers: { Authorization: "Bearer " + token }});
        if (resInvite.ok) setInviteCode((await resInvite.json()).data.inviteCode);
      } catch (err) {
        console.error(err);
      }
    };
    if (serverId) fetchData();
  }, [serverId, router]);

  const handleLeaveServer = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`http://localhost:3001/api/servers/${serverId}`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      router.push("/server");
    } catch (err) { console.error(err); }
  };

  const handleDeleteServer = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`http://localhost:3001/api/servers/${serverId}/server`, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      router.push("/server");
    } catch (err) { console.error(err); }
  };

  // FONCTION : Expulser un membre (Kick)
  const handleKick = async (userIdToKick: string | number, userName: string) => {
    const confirmKick = window.confirm(`Es-tu sûr de vouloir expulser ${userName} du serveur ?`);
    if (!confirmKick) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/servers/${serverId}/kick/${userIdToKick}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token }
      });

      if (response.ok) {
        // On met à jour la liste pour faire disparaître le membre instantanément
        setUsers(users.filter(u => u.id !== userIdToKick));
        alert(`${userName} a été expulsé avec succès.`);
      } else {
        const data = await response.json();
        alert(data.message || "Tu n'as pas les droits pour expulser ce membre.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'expulsion.");
    }
  };

  
  const handleBan = async (userIdToBan: string | number, userName: string, durationHours: number | null) => {
    const typeBan = durationHours ? `temporairement (24h)` : `définitivement`;
    const confirmBan = window.confirm(`Es-tu sûr de vouloir bannir ${userName} ${typeBan} ?`);
    if (!confirmBan) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/servers/${serverId}/ban/${userIdToBan}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token 
        },
        body: JSON.stringify({ 
          reason: "Non respect des règles", 
          durationHours: durationHours 
        })
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userIdToBan));
        alert(`${userName} a été banni ${typeBan}.`);
      } else {
        const data = await response.json();
        alert(data.message || "Tu n'as pas les droits pour bannir ce membre.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors du bannissement.");
    }
  };

  return (
    <div>
      <nav>
        <Link href={`/channelCreation/${serverId}`}>{t('create_channel', 'Créer un channel')}</Link>
        <button onClick={handleLeaveServer}>{t('leave_server', 'Quitter le serveur')}</button>
        <button onClick={handleDeleteServer}>{t('delete_server', 'Supprimer le serveur')}</button>
      </nav>

      <section>
        <h2>{t('server_channels', 'Channels du serveur')}</h2>
        <p>{t('invite_code', "Code d'invitation :")} <strong>{inviteCode}</strong></p>
        <ul>
          {channels.map(channel => (
            <li key={channel.id}>
              <Link href={`/chat/${channel.id}`}>{channel.name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t('server_members', 'Membres du serveur')}</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {users.map((user, index) => (
            <li key={index} style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span>👤 {user.name}</span>
              
              {/* Le bloc d'actions s'affiche uniquement si ce n'est pas nous-même */}
              {localUser && user.id && user.id !== localUser.id && (
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={() => handleKick(user.id, user.name)}
                    style={{ background: '#eab308', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px' }}
                    title="Expulser"
                  >
                    Kick 👢
                  </button>

                  <Link href={`/mp/${user.id}`}>
                    <button 
                      style={{ background: '#5865f2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px' }}
                      title="Envoyer un message privé"
                    >
                      MP 💬
                    </button>
                  </Link>


                  <button 
                    onClick={() => handleBan(user.id, user.name, 24)}
                    style={{ background: '#f97316', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px' }}
                    title="Bannir pour 24 heures"
                  >
                    Ban 24h ⏳
                  </button>
                  <button 
                    onClick={() => handleBan(user.id, user.name, null)}
                    style={{ background: '#da373c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontSize: '12px' }}
                    title="Bannir définitivement"
                  >
                    Ban Perm 🔨
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}