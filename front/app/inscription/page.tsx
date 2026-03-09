'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next'; // <-- Import
import '../../styles/signup.css';

export default function Inscription() {
  const { t } = useTranslation(); // <-- Initialisation
  const [formData, setFormData] = useState({ name: '', first_name: '', phone_number: '', mail: '', password: '' });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
     // ... ton code handleSubmit ne change pas ...
     e.preventDefault();
     try {
       const response = await fetch("http://localhost:3001/api/User", {
         method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData),
       });
       const data = await response.json();
       if (data.success) {
         router.push("/connexion");
       } else {
         alert("Erreur : " + data.message);
       }
     } catch (error) {
       alert("Erreur de connexion au serveur !");
     }
  };

  return (
    <div className="signup-container">
      <div className="section employeur">
        <h1>{t('signup', "S'inscrire")}</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t('name', 'Nom :')}</label>
            <input id="name" type="text" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="first_name">{t('first_name', 'Prénom :')}</label>
            <input id="first_name" type="text" value={formData.first_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone_number">{t('phone', 'Téléphone :')}</label>
            <input id="phone_number" type="text" value={formData.phone_number} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="mail">{t('email', 'Email :')}</label>
            <input id="mail" type="mail" value={formData.mail} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('password', 'Mot de passe :')}</label>
            <input id="password" type="password" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit">{t('signup', "S'inscrire")}</button>
        </form>
      </div>

      <a href="/" className="formation-link home-link">{t('back_home', "Retour à la page d'accueil")}</a>
    </div>
  );
}