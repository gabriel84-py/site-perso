// Initialisation du syntax highlighting
document.addEventListener('DOMContentLoaded', function() {
    // Highlight tous les blocs de code
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }

    // Animation au scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observer tous les cards
    document.querySelectorAll('.card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Smooth scroll pour les ancres
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navigation active au scroll
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Confirmation avant suppression
    document.querySelectorAll('form[action*="/delete"]').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
                e.preventDefault();
            }
        });
    });

    // Preview Markdown en temps réel (si disponible)
    const contentTextarea = document.getElementById('content');
    if (contentTextarea && window.marked) {
        let previewTimeout;
        contentTextarea.addEventListener('input', function() {
            clearTimeout(previewTimeout);
            previewTimeout = setTimeout(() => {
                // Logique de preview si nécessaire
            }, 500);
        });
    }

    // Auto-save brouillon (localStorage)
    const formInputs = document.querySelectorAll('form textarea, form input[type="text"]');
    formInputs.forEach(input => {
        const saveKey = `draft_${input.name}_${window.location.pathname}`;
        
        // Charger le brouillon
        const draft = localStorage.getItem(saveKey);
        if (draft && !input.value) {
            input.value = draft;
        }

        // Sauvegarder automatiquement
        let saveTimeout;
        input.addEventListener('input', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                localStorage.setItem(saveKey, this.value);
            }, 1000);
        });

        // Nettoyer après soumission
        const form = input.closest('form');
        if (form) {
            form.addEventListener('submit', () => {
                localStorage.removeItem(saveKey);
            });
        }
    });

    // Copier du code
    window.copyCode = function(button) {
        const codeBlock = button.closest('.code-block').querySelector('code');
        const text = codeBlock.textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            const originalText = button.textContent;
            button.textContent = '✅ Copié !';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Erreur de copie:', err);
            alert('Impossible de copier le code');
        });
    };

    // Recherche en temps réel améliorée
    const searchInputs = document.querySelectorAll('input[type="search"], #searchInput');
    searchInputs.forEach(input => {
        let searchTimeout;
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                // La recherche est gérée par le backend
            }, 300);
        });
    });

    // Toast notifications
    window.showToast = function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 2rem;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K pour focus sur la recherche
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.querySelector('#searchInput');
            if (searchInput) searchInput.focus();
        }

        // Ctrl/Cmd + S pour sauvegarder (si dans un formulaire)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            const form = document.querySelector('form');
            if (form && (form.querySelector('textarea') || form.querySelector('input[name="title"]'))) {
                e.preventDefault();
                form.submit();
            }
        }
    });
});

// Animations CSS ajoutées dynamiquement
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);