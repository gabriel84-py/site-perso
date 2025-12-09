// ==================== STRUCTURE DU PROJET ====================
// cyber-site/
// ├── server.js (ce fichier)
// ├── package.json
// ├── .env
// ├── database.db (sera créé automatiquement)
// ├── public/
// │   ├── css/
// │   │   └── style.css
// │   ├── js/
// │   │   └── main.js
// │   └── uploads/ (créer ce dossier)
// └── views/
//     ├── layout.html
//     ├── index.html
//     ├── blog.html
//     ├── blog-post.html
//     ├── code.html
//     ├── code-detail.html
//     ├── about.html
//     ├── notes.html
//     ├── login.html
//     └── admin/
//         ├── dashboard.html
//         ├── edit-post.html
//         ├── edit-code.html
//         └── edit-note.html

// ==================== server.js ====================
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const nunjucks = require('nunjucks');
const marked = require('marked');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const csrf = require('csurf');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration de la base de données
const db = new sqlite3.Database('./database.db');

// Initialisation de la base de données
db.serialize(() => {
  // Table utilisateurs
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table articles de blog
  db.run(`CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    tags TEXT,
    published BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table code snippets
  db.run(`CREATE TABLE IF NOT EXISTS code_snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language TEXT,
    tags TEXT,
    file_path TEXT,
    published BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table commentaires privés
  db.run(`CREATE TABLE IF NOT EXISTS private_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table notes privées
  db.run(`CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Vérifier si un utilisateur existe, sinon en créer un par défaut
  db.get('SELECT * FROM users LIMIT 1', async (err, row) => {
    if (!row) {
      const defaultPassword = await bcrypt.hash('ChangeMe123!', 10);
      db.run('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', 
        ['admin', defaultPassword, 'admin@example.com']);
      console.log('⚠️  Utilisateur par défaut créé : admin / ChangeMe123!');
      console.log('⚠️  CHANGEZ CE MOT DE PASSE IMMÉDIATEMENT !');
    }
  });
});

// Configuration des uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Sessions
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db' }),
  secret: process.env.SESSION_SECRET || 'change-this-secret-key-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CSRF protection
const csrfProtection = csrf();

// Rate limiting pour le login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Trop de tentatives de connexion, réessayez plus tard.'
});

// Configuration de Nunjucks
const env = nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production'
});

// Filtres personnalisés
env.addFilter('markdown', (str) => marked.parse(str || ''));
env.addFilter('truncate', (str, length) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
});
env.addFilter('date', (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Middleware d'authentification
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Variables globales pour les templates
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.userId;
  res.locals.currentPath = req.path;
  next();
});

// ==================== ROUTES PUBLIQUES ====================

// Page d'accueil
app.get('/', (req, res) => {
  db.all('SELECT * FROM blog_posts WHERE published = 1 ORDER BY created_at DESC LIMIT 3', (err, posts) => {
    db.all('SELECT * FROM code_snippets WHERE published = 1 ORDER BY created_at DESC LIMIT 3', (err2, snippets) => {
      res.render('index.html', { posts, snippets });
    });
  });
});

// Blog
app.get('/blog', (req, res) => {
  const search = req.query.search || '';
  const tag = req.query.tag || '';
  
  let query = 'SELECT * FROM blog_posts WHERE published = 1';
  const params = [];
  
  if (search) {
    query += ' AND (title LIKE ? OR content LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, posts) => {
    res.render('blog.html', { posts, search, tag });
  });
});

// Article de blog
app.get('/blog/:slug', (req, res) => {
  db.get('SELECT * FROM blog_posts WHERE slug = ? AND published = 1', [req.params.slug], (err, post) => {
    if (!post) return res.status(404).send('Article non trouvé');
    res.render('blog-post.html', { post });
  });
});

// Code
app.get('/code', (req, res) => {
  const search = req.query.search || '';
  const tag = req.query.tag || '';
  
  let query = 'SELECT * FROM code_snippets WHERE published = 1';
  const params = [];
  
  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }
  
  query += ' ORDER BY created_at DESC';
  
  db.all(query, params, (err, snippets) => {
    res.render('code.html', { snippets, search, tag });
  });
});

// Détail code
app.get('/code/:slug', (req, res) => {
  db.get('SELECT * FROM code_snippets WHERE slug = ? AND published = 1', [req.params.slug], (err, snippet) => {
    if (!snippet) return res.status(404).send('Code non trouvé');
    res.render('code-detail.html', { snippet });
  });
});

// À propos
app.get('/about', (req, res) => {
  res.render('about.html');
});

// Notes (privé)
app.get('/notes', requireAuth, (req, res) => {
  db.all('SELECT * FROM notes ORDER BY updated_at DESC', (err, notes) => {
    res.render('notes.html', { notes });
  });
});

// ==================== AUTHENTIFICATION ====================

// Page de login
app.get('/login', csrfProtection, (req, res) => {
  if (req.session.userId) return res.redirect('/admin');
  res.render('login.html', { csrfToken: req.csrfToken() });
});

// Login
app.post('/login', loginLimiter, csrfProtection, async (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('login.html', { 
        error: 'Identifiants incorrects',
        csrfToken: req.csrfToken()
      });
    }
    
    req.session.userId = user.id;
    req.session.username = user.username;
    res.redirect('/admin');
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ==================== ADMIN ====================

// Dashboard
app.get('/admin', requireAuth, (req, res) => {
  db.all('SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT 5', (err, posts) => {
    db.all('SELECT * FROM code_snippets ORDER BY created_at DESC LIMIT 5', (err2, snippets) => {
      db.all('SELECT * FROM notes ORDER BY updated_at DESC LIMIT 5', (err3, notes) => {
        res.render('admin/dashboard.html', { posts, snippets, notes });
      });
    });
  });
});

// Créer/éditer article
app.get('/admin/blog/new', requireAuth, csrfProtection, (req, res) => {
  res.render('admin/edit-post.html', { post: null, csrfToken: req.csrfToken() });
});

app.get('/admin/blog/:id', requireAuth, csrfProtection, (req, res) => {
  db.get('SELECT * FROM blog_posts WHERE id = ?', [req.params.id], (err, post) => {
    db.all('SELECT * FROM private_comments WHERE item_type = ? AND item_id = ?', 
      ['blog', req.params.id], (err2, comments) => {
      res.render('admin/edit-post.html', { post, comments, csrfToken: req.csrfToken() });
    });
  });
});

app.post('/admin/blog', requireAuth, csrfProtection, (req, res) => {
  const { id, title, slug, content, excerpt, tags, published } = req.body;
  const isPublished = published === 'on' ? 1 : 0;
  
  if (id) {
    db.run('UPDATE blog_posts SET title = ?, slug = ?, content = ?, excerpt = ?, tags = ?, published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, slug, content, excerpt, tags, isPublished, id], () => {
        res.redirect('/admin');
      });
  } else {
    db.run('INSERT INTO blog_posts (title, slug, content, excerpt, tags, published) VALUES (?, ?, ?, ?, ?, ?)',
      [title, slug, content, excerpt, tags, isPublished], () => {
        res.redirect('/admin');
      });
  }
});

// Supprimer article
app.post('/admin/blog/:id/delete', requireAuth, csrfProtection, (req, res) => {
  db.run('DELETE FROM blog_posts WHERE id = ?', [req.params.id], () => {
    db.run('DELETE FROM private_comments WHERE item_type = ? AND item_id = ?', ['blog', req.params.id], () => {
      res.redirect('/admin');
    });
  });
});

// Créer/éditer code
app.get('/admin/code/new', requireAuth, csrfProtection, (req, res) => {
  res.render('admin/edit-code.html', { snippet: null, csrfToken: req.csrfToken() });
});

app.get('/admin/code/:id', requireAuth, csrfProtection, (req, res) => {
  db.get('SELECT * FROM code_snippets WHERE id = ?', [req.params.id], (err, snippet) => {
    db.all('SELECT * FROM private_comments WHERE item_type = ? AND item_id = ?', 
      ['code', req.params.id], (err2, comments) => {
      res.render('admin/edit-code.html', { snippet, comments, csrfToken: req.csrfToken() });
    });
  });
});

app.post('/admin/code', requireAuth, csrfProtection, upload.single('file'), (req, res) => {
  const { id, title, slug, description, code, language, tags, published } = req.body;
  const isPublished = published === 'on' ? 1 : 0;
  const filePath = req.file ? `/uploads/${req.file.filename}` : null;
  
  if (id) {
    db.run('UPDATE code_snippets SET title = ?, slug = ?, description = ?, code = ?, language = ?, tags = ?, published = ?, file_path = COALESCE(?, file_path), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, slug, description, code, language, tags, isPublished, filePath, id], () => {
        res.redirect('/admin');
      });
  } else {
    db.run('INSERT INTO code_snippets (title, slug, description, code, language, tags, published, file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, slug, description, code, language, tags, isPublished, filePath], () => {
        res.redirect('/admin');
      });
  }
});

// Supprimer code
app.post('/admin/code/:id/delete', requireAuth, csrfProtection, (req, res) => {
  db.run('DELETE FROM code_snippets WHERE id = ?', [req.params.id], () => {
    db.run('DELETE FROM private_comments WHERE item_type = ? AND item_id = ?', ['code', req.params.id], () => {
      res.redirect('/admin');
    });
  });
});

// Ajouter commentaire privé
app.post('/admin/comment', requireAuth, csrfProtection, (req, res) => {
  const { item_type, item_id, comment } = req.body;
  db.run('INSERT INTO private_comments (item_type, item_id, comment) VALUES (?, ?, ?)',
    [item_type, item_id, comment], () => {
      res.redirect('back');
    });
});

// Créer/éditer note
app.get('/admin/notes/new', requireAuth, csrfProtection, (req, res) => {
  res.render('admin/edit-note.html', { note: null, csrfToken: req.csrfToken() });
});

app.get('/admin/notes/:id', requireAuth, csrfProtection, (req, res) => {
  db.get('SELECT * FROM notes WHERE id = ?', [req.params.id], (err, note) => {
    res.render('admin/edit-note.html', { note, csrfToken: req.csrfToken() });
  });
});

app.post('/admin/notes', requireAuth, csrfProtection, (req, res) => {
  const { id, title, content, tags } = req.body;
  
  if (id) {
    db.run('UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, tags, id], () => {
        res.redirect('/notes');
      });
  } else {
    db.run('INSERT INTO notes (title, content, tags) VALUES (?, ?, ?)',
      [title, content, tags], () => {
        res.redirect('/notes');
      });
  }
});

// Supprimer note
app.post('/admin/notes/:id/delete', requireAuth, csrfProtection, (req, res) => {
  db.run('DELETE FROM notes WHERE id = ?', [req.params.id], () => {
    res.redirect('/notes');
  });
});

// ==================== API ====================

// API pour recherche en temps réel
app.get('/api/search', (req, res) => {
  const { q, type } = req.query;
  
  if (type === 'blog') {
    db.all('SELECT id, title, slug FROM blog_posts WHERE published = 1 AND title LIKE ? LIMIT 5',
      [`%${q}%`], (err, results) => {
        res.json(results);
      });
  } else if (type === 'code') {
    db.all('SELECT id, title, slug FROM code_snippets WHERE published = 1 AND title LIKE ? LIMIT 5',
      [`%${q}%`], (err, results) => {
        res.json(results);
      });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📁 Base de données SQLite : database.db`);
  console.log(`🔐 Page de connexion : http://localhost:${PORT}/login`);
});

// Gestion des erreurs
process.on('SIGINT', () => {
  db.close(() => {
    console.log('\n🛑 Serveur arrêté proprement');
    process.exit(0);
  });
});