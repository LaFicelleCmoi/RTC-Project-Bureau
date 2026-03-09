'use client'; // On l'ajoute pour pouvoir utiliser le hook de traduction

import '../styles/globals.css';
import Image from 'next/image';
import { Providers } from './Providers';
import { useTranslation } from 'react-i18next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation(); // On récupère l'outil de traduction

  return (
    <html lang="fr">
      <body>
        <Providers>
          <header>
            <div className="header-title">
             <Image 
                src="/logo-icon.png" 
                alt="ChatFlow Logo" 
                width={60} 
                height={40}
                className="object-contain"
              />
              <h1>ChatFlow</h1>
            </div>
         
            <nav>
              {/* On utilise t() pour traduire les menus */}
              <a href="/" className="text-white hover:text-gray-300">{t('home', 'Accueil')}</a> 
              <a href="/inscription" className="text-white hover:text-gray-300">{t('signup', 'Inscription')}</a>
              <a href="/connexion" className="text-white hover:text-gray-300">{t('login', 'Connexion')}</a>
            </nav>
          </header>

          <main>{children}</main>

          <footer>
            <p>© 2026 ChatFlow</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}