# 🚀 Site Personnel Cyber

Site web personnel moderne pour développeur passionné de cybersécurité offensive.

## ✨ Fonctionnalités

- **Blog** : Articles et write-ups avec support Markdown
- **Code** : Snippets et projets avec syntax highlighting
- **Notes privées** : Espace personnel pour organiser vos idées
- **Interface admin** : Gestion complète du contenu
- **Commentaires privés** : Annotations sur vos articles et code
- **Recherche** : Filtrage par tags et recherche full-text
- **Design moderne** : Interface élégante et responsive
- **Sécurité** : Authentification robuste avec bcrypt, CSRF, rate limiting

## 📋 Prérequis

- Node.js 16+ 
- npm ou yarn
- Un VPS (OVH, DigitalOcean, etc.)
- Un nom de domaine (optionnel mais recommandé)

## 🛠️ Installation

### 1. Cloner/Créer le projet

```bash
mkdir cyber-site
cd cyber-site
```

### 2. Créer la structure des dossiers

```bash
mkdir -p public/css public/js public/uploads views/admin
```

### 3. Créer les fichiers

Créez tous les fichiers fournis dans leur dossier respectif :

```
cyber-site/
├── server.js
├── package.json
├── .env
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── uploads/
└── views/
    ├── layout.html
    ├── index.html
    ├── blog.html
    ├── blog-post.html
    ├── code.html
    ├── code-detail.html
    ├── about.html
    ├── notes.html
    ├── login.html
    └── admin/
        ├── dashboard.html
        ├── edit-post.html
        ├── edit-code.html
        └── edit-note.html
```

### 4. Installer les dépendances

```bash
npm install
```

### 5. Configuration

Éditez le fichier `.env` :

```bash
PORT=3000
NODE_ENV=production
SESSION_SECRET=votre-secret-tres-long-et-aleatoire-ici
SITE_URL=https://votre-domaine.com
```

⚠️ **IMPORTANT** : Générez un secret de session sécurisé :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Lancer le serveur

**En développement :**
```bash
npm run dev
```

**En production :**
```bash
npm start
```

Le site sera accessible sur `http://localhost:3000`

## 🔐 Premier login

Au premier démarrage, un utilisateur par défaut est créé :

- **Username** : `admin`
- **Password** : `ChangeMe123!`

⚠️ **CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT !**

Pour changer le mot de passe, accédez à la base de données :

```bash
sqlite3 database.db
```

```sql
-- Générer un nouveau hash bcrypt (avec bcrypt-cli ou online)
UPDATE users SET password = 'nouveau_hash_bcrypt' WHERE username = 'admin';
```

## 🌐 Déploiement sur VPS

### Configuration Nginx

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### SSL avec Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### PM2 pour process management

```bash
npm install -g pm2
pm2 start server.js --name cyber-site
pm2 startup
pm2 save
```

### Commandes PM2 utiles

```bash
pm2 status              # Voir le statut
pm2 logs cyber-site     # Voir les logs
pm2 restart cyber-site  # Redémarrer
pm2 stop cyber-site     # Arrêter
```

## 📝 Utilisation

### Créer un article

1. Connectez-vous à `/login`
2. Allez dans l'admin `/admin`
3. Cliquez sur "Nouvel article"
4. Rédigez en Markdown
5. Publiez !

### Ajouter du code

1. Admin → "Nouveau code"
2. Collez votre code
3. Sélectionnez le langage pour le syntax highlighting
4. Optionnel : uploadez un fichier téléchargeable

### Notes privées

Les notes sont visibles uniquement quand vous êtes connecté. Parfait pour :
- Todo lists
- Idées de recherche
- Notes temporaires
- Brouillons

### Commentaires privés

Sur chaque article/code en mode édition, vous pouvez ajouter des commentaires privés pour garder vos notes et réflexions.

## 🎨 Personnalisation

### Modifier les couleurs

Éditez `public/css/style.css` ligne 2-15 :

```css
:root {
  --primary: #3b82f6;      /* Couleur principale */
  --secondary: #f59e0b;    /* Couleur secondaire */
  --accent: #8b5cf6;       /* Couleur accent */
  /* ... */
}
```

### Modifier le logo

Éditez `views/layout.html` ligne 19 :

```html
<a href="/" class="logo">VotreLogo</a>
```

### Page À propos

Éditez `views/about.html` pour personnaliser votre présentation.

## 🔒 Sécurité

Le site implémente plusieurs mesures de sécurité :

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Protection CSRF sur tous les formulaires
- ✅ Rate limiting sur le login (5 tentatives / 15 min)
- ✅ Headers de sécurité avec Helmet
- ✅ Sessions sécurisées avec cookies httpOnly
- ✅ Prepared statements SQL (protection injection)
- ✅ Input sanitization avec Nunjucks autoescape
- ✅ Upload de fichiers sécurisé avec validation

### Recommandations supplémentaires

- Utilisez HTTPS en production (Let's Encrypt)
- Changez le secret de session régulièrement
- Faites des backups de `database.db`
- Surveillez les logs avec PM2
- Mettez à jour les dépendances régulièrement

## 📦 Backup

### Base de données

```bash
# Backup
cp database.db database.backup.$(date +%Y%m%d).db

# Restauration
cp database.backup.YYYYMMDD.db database.db
```

### Uploads

```bash
tar -czf uploads-backup.tar.gz public/uploads/
```

## 🐛 Dépannage

### Le site ne démarre pas

```bash
# Vérifier les logs
pm2 logs cyber-site

# Tester manuellement
node server.js
```

### Erreur de base de données

```bash
# Vérifier l'intégrité
sqlite3 database.db "PRAGMA integrity_check;"

# Recréer si nécessaire
rm database.db
node server.js  # Recrée automatiquement
```

### Problème de permissions

```bash
chmod 755 public/uploads
chown -R $USER:$USER .
```

## 📚 Technologies utilisées

- **Backend** : Node.js, Express.js
- **Base de données** : SQLite3
- **Templating** : Nunjucks
- **Sécurité** : Helmet, bcrypt, CSRF, rate-limit
- **Markdown** : Marked
- **Syntax Highlighting** : Highlight.js
- **Frontend** : HTML5, CSS3, Vanilla JS

## 🤝 Contribution

C'est votre site personnel, modifiez-le comme vous voulez ! Quelques idées :

- Ajouter des catégories
- Système de commentaires publics
- Analytics
- Newsletter
- API REST
- Multi-utilisateurs

## 📄 Licence

MIT - Faites-en ce que vous voulez !

## 🎯 Roadmap

Fonctionnalités futures possibles :
- [ ] Export Markdown/PDF
- [ ] Galerie d'images
- [ ] Dark/Light mode toggle
- [ ] Statistiques de vues
- [ ] RSS Feed
- [ ] API pour mobile app

---

Créé avec ❤️ pour les passionnés de cybersécurité# site-perso
