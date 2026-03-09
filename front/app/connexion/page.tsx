'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next'; 
import '../../styles/signup.css'; // Ici le chemin ../../ est correct !

export default function Connexion() {
  const { t } = useTranslation(); 
  const [formData, setFormData] = useState({ email: '', password: '' });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push("/server");
      } else {
        alert("Erreur : " + (data.message || "Identifiants incorrects"));
      }
    } catch (error) {
      alert("Erreur de connexion au serveur !");
    }
  };

  return (
    <div className="signup-container">
      <div className="section employeur">
        <h1>{t('login', 'Connexion')}</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">{t('email', 'Email :')}</label>
            <input id="email" type="text" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password', 'Mot de passe :')}</label>
            <input id="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit">{t('login', 'Connexion')}</button>
        </form>
      </div>

      <a href="/" className="formation-link home-link">
        {t('back_home', 'Retour à la page d\'accueil')}
      </a>
    </div>
  );
}