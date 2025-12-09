#!/bin/bash

echo "🚀 Installation du site cyber personnel..."
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Installez Node.js 16+ d'abord."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Générer un secret de session sécurisé
echo ""
echo "🔐 Génération du secret de session..."
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Créer ou mettre à jour le fichier .env
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << EOL
# Configuration du serveur
PORT=3000
NODE_ENV=production

# Secret pour les sessions (généré automatiquement)
SESSION_SECRET=$SESSION_SECRET

# Base de données
DB_PATH=./database.db

# URL du site (pour la production)
SITE_URL=https://votre-domaine.com
EOL
    echo "✅ Fichier .env créé avec un secret sécurisé"
else
    echo "⚠️  Le fichier .env existe déjà, non modifié"
fi

echo ""
echo "✅ Installation terminée !"
echo ""
echo "🎯 Prochaines étapes :"
echo ""
echo "1. Lancez le serveur :"
echo "   npm start"
echo ""
echo "2. Ouvrez votre navigateur :"
echo "   http://localhost:3000"
echo ""
echo "3. Connectez-vous avec :"
echo "   Username: admin"
echo "   Password: ChangeMe123!"
echo ""
echo "⚠️  CHANGEZ LE MOT DE PASSE IMMÉDIATEMENT !"
echo ""
echo "📚 Consultez le README.md pour plus d'informations"
echo ""

# Proposer de démarrer le serveur
read -p "Voulez-vous démarrer le serveur maintenant ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Démarrage du serveur..."
    echo "   Appuyez sur Ctrl+C pour arrêter"
    echo ""
    npm start
fi