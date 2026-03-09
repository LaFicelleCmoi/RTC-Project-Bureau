import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      "welcome": "Bienvenue sur ChatFlow",
      "home": "Accueil",
      "signup": "S'inscrire",
      "login": "Connexion",
      "my_servers": "Mes serveurs",
      "create_server": "Créer un serveur",
      "join_server": "Rejoindre un serveur",
      "send": "Envoyer",
      "message_placeholder": "Envoyer un message dans",
      "leave": "Quitter",
      "delete": "Supprimer",
      "email": "Email :",
      "password": "Mot de passe :",
      "name": "Nom :",
      "first_name": "Prénom :",
      "phone": "Téléphone :",
      "back_home": "Retour à la page d'accueil",
      "invite_code": "Code d'invitation :",
      "join": "Rejoindre",
      "create": "Créer",
      "create_channel": "Créer un channel",
      "leave_server": "Quitter le serveur",
      "delete_server": "Supprimer le serveur",
      "server_channels": "Channels du serveur",
      "server_members": "Membres du serveur",
      "online": "En ligne",
      "today": "Aujourd'hui",
      "channel_creation": "Création de channel"
    }
  },
  en: {
    translation: {
      "welcome": "Welcome to ChatFlow",
      "home": "Home",
      "signup": "Sign Up",
      "login": "Login",
      "my_servers": "My Servers",
      "create_server": "Create a server",
      "join_server": "Join a server",
      "send": "Send",
      "message_placeholder": "Send a message in",
      "leave": "Leave",
      "delete": "Delete",
      "email": "Email:",
      "password": "Password:",
      "name": "Name:",
      "first_name": "First Name:",
      "phone": "Phone:",
      "back_home": "Back to Home",
      "invite_code": "Invite Code:",
      "join": "Join",
      "create": "Create",
      "create_channel": "Create a channel",
      "leave_server": "Leave server",
      "delete_server": "Delete server",
      "server_channels": "Server Channels",
      "server_members": "Server Members",
      "online": "Online",
      "today": "Today",
      "channel_creation": "Channel creation"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr", // Langue par défaut
    fallbackLng: "fr",
    interpolation: { escapeValue: false }
  });

export default i18n;