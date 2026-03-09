'use client'; 

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import myI18n from './i18n'; 

export default function HomePage() {
  const { t } = useTranslation(); 

  const toggleLanguage = () => {
    const currentLang = myI18n.language || 'fr';
    const newLang = currentLang === 'fr' ? 'en' : 'fr';
    myI18n.changeLanguage(newLang);
  };

  return (
    <div>
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <button 
          onClick={toggleLanguage}
          style={{ padding: '8px 16px', backgroundColor: '#38bdf8', color: 'black', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🌍 {myI18n.language === 'fr' ? 'Switch to English' : 'Passer en Français'}
        </button>
      </div>

      <h2>{t('welcome', 'Bienvenue sur ChatFlow')}</h2> 
      
      <div className="flex justify-center items-center mt-8">
        <Image 
          src="/logo.png" 
          alt="ChatFlow Logo" 
          width={400} 
          height={400}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}