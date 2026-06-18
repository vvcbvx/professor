// ===== نظام التنقل =====
export const Navigation = {
    currentSection: 'dashboard',
    history: ['dashboard'],
    sectionTitles: {},
    
    init(sectionTitles) {
        this.sectionTitles = sectionTitles;
        this.setupBackButton();
        this.setupNavItems();
        this.setupBottomNavItems();
        this.setupTopNavItems();
    },
    
    setupNavItems() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.dataset.section;
                if (section) {
                    this.navigateTo(section);
                }
            });
        });
    },
    
    setupBottomNavItems() {
        document.querySelectorAll('.nav-item-bottom').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.dataset.section;
                if (section) {
                    this.navigateTo(section);
                }
            });
        });
    },
    
    setupTopNavItems() {
        document.querySelectorAll('.nav-item-top').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.dataset.section;
                if (section) {
                    this.navigateTo(section);
                }
            });
        });
    },
    
    setupBackButton() {
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }
    },
    
    navigateTo(sectionId) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('.content-section').forEach(el => {
            el.classList.remove('active');
        });
        
        const target = document.getElementById(`section-${sectionId}`);
        if (target) {
            target.classList.add('active');
        }

        // تحديث القائمة الجانبية
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.section === sectionId) {
                el.classList.add('active');
            }
        });

        // تحديث الشريط العلوي
        document.querySelectorAll('.nav-item-top').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.section === sectionId) {
                el.classList.add('active');
            }
        });

        // تحديث الشريط السفلي
        document.querySelectorAll('.nav-item-bottom').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.section === sectionId) {
                el.classList.add('active');
            }
        });

        // تحديث العنوان
        const info = this.sectionTitles[sectionId] || { 
            title: sectionId, 
            icon: 'fa-folder' 
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.innerHTML = `<i class="fas ${info.icon}"></i> ${info.title}`;
        }

        // إظهار/إخفاء زر الرجوع
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            if (this.history.length > 1 && this.history[this.history.length - 1] !== sectionId) {
                backBtn.classList.add('visible');
                backBtn.style.display = 'inline-flex';
            } else {
                backBtn.classList.remove('visible');
                backBtn.style.display = 'none';
            }
        }

        if (this.history[this.history.length - 1] !== sectionId) {
            this.history.push(sectionId);
        }

        this.currentSection = sectionId;
        
        if (window.onSectionChange) {
            window.onSectionChange(sectionId);
        }
    },
    
    goBack() {
        if (this.history.length > 1) {
            this.history.pop();
            this.navigateTo(this.history[this.history.length - 1]);
        }
    }
};