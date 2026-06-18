import { Utils } from '../modules/utils.js';

// ===== نظام تفضيل الأساتذة ولوحة الشرف =====
const StudentRatings = {
    teachers: [],
    myRatings: [],
    leaderboard: [],
    topTeacher: null,
    topTeachers: [],
    hasTie: false,
    maxVotes: 0,
    votingInProgress: false,
    
    async load() {
        try {
            const response = await fetch('/api/ratings/available-teachers', {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const teachersData = await response.json();
            this.teachers = teachersData.teachers || [];
            
            const ratingsResponse = await fetch('/api/ratings/my-ratings', {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const ratingsData = await ratingsResponse.json();
            this.myRatings = ratingsData.ratings || [];
            
            await this.loadLeaderboard();
            
            this.renderAll();
            this.updateCount();
        } catch (error) {
            console.error('Error loading ratings:', error);
            Utils.showError('فشل تحميل بيانات التصويت');
        }
    },
    
    async loadLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard', {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            });
            const data = await response.json();
            
            console.log('📊 بيانات لوحة الشرف:', data);
            
            this.leaderboard = data.leaderboard || [];
            this.topTeacher = data.topTeacher || null;
            this.topTeachers = data.topTeachers || [];
            this.hasTie = data.hasTie || false;
            this.maxVotes = data.maxVotes || 0;
            
            console.log(`🏆 الأكثر تصويتاً: ${this.topTeachers.length} أستاذ, تعادل: ${this.hasTie}, عدد الأصوات: ${this.maxVotes}`);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    },
    
    renderAll() {
        this.renderLeaderboard();
        this.renderTeachers();
    },
    
    renderLeaderboard() {
        const container = document.getElementById('leaderboardContainer');
        if (!container) return;
        
        let topTeacherHtml = '';
        let hasAnyVotes = false;
        
        // التحقق من وجود أي أصوات
        if (this.leaderboard && this.leaderboard.length > 0) {
            const hasVotes = this.leaderboard.some(t => t.votesCount > 0);
            if (hasVotes) {
                hasAnyVotes = true;
            }
        }
        
        // إذا كان هناك أساتذة في القمة (لديهم أصوات)
        if (this.topTeachers && this.topTeachers.length > 0 && this.topTeachers[0]?.votesCount > 0) {
            const isTie = this.topTeachers.length > 1;
            const votesCount = this.topTeachers[0]?.votesCount || 0;
            
            if (isTie) {
                // حالة التعادل - عرض بطاقات متعددة
                topTeacherHtml = `
                    <div class="golden-card tie">
                        <div class="golden-badge">
                            <i class="fas fa-crown"></i>
                            <span>🏆 الأكثر تفضيلاً - تعادل!</span>
                        </div>
                        <div class="golden-content tie-container">
                            ${this.topTeachers.map((teacher, index) => `
                                <div class="tie-teacher-card ${index === 0 ? 'gold' : 'silver'}">
                                    <div class="tie-avatar">
                                        ${teacher.profileImage ? 
                                            `<img src="${teacher.profileImage}" alt="${teacher.fullName}">` :
                                            `<div class="avatar-placeholder-tie">${teacher.fullName ? teacher.fullName.charAt(0) : '?'}</div>`
                                        }
                                    </div>
                                    <div class="tie-info">
                                        <h3 class="tie-name">${this.escapeHtml(teacher.fullName)}</h3>
                                        <span class="tie-subject">${this.escapeHtml(teacher.subject)}</span>
                                        <span class="tie-votes">
                                            <i class="fas fa-heart" style="color:#ef4444;"></i>
                                            ${teacher.votesCount} تفضيل
                                        </span>
                                    </div>
                                    ${index === 0 ? '<span class="tie-medal">🥇</span>' : '<span class="tie-medal">🥈</span>'}
                                </div>
                            `).join('')}
                        </div>
                        <div class="tie-message">
                            <i class="fas fa-handshake"></i>
                            تعادل مذهل! ${this.topTeachers.length} أساتذة في القمة
                        </div>
                    </div>
                `;
            } else {
                // حالة عدم التعادل - بطاقة واحدة ذهبية
                const teacher = this.topTeachers[0];
                topTeacherHtml = `
                    <div class="golden-card">
                        <div class="golden-badge">
                            <i class="fas fa-crown"></i>
                            <span>🏆 الأكثر تفضيلاً</span>
                        </div>
                        <div class="golden-content">
                            <div class="golden-avatar">
                                ${teacher.profileImage ? 
                                    `<img src="${teacher.profileImage}" alt="${teacher.fullName}">` :
                                    `<div class="avatar-placeholder-golden">${teacher.fullName ? teacher.fullName.charAt(0) : '?'}</div>`
                                }
                            </div>
                            <div class="golden-info">
                                <h2 class="golden-name">${this.escapeHtml(teacher.fullName)}</h2>
                                <span class="golden-subject">${this.escapeHtml(teacher.subject)}</span>
                                <div class="golden-stats">
                                    <span class="golden-votes">
                                        <i class="fas fa-heart" style="color:#ef4444;"></i>
                                        ${teacher.votesCount} تفضيل
                                    </span>
                                </div>
                                <div class="golden-medal">
                                    <i class="fas fa-medal"></i>
                                    🥇 الأكثر تفضيلاً
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        } else if (hasAnyVotes) {
            // إذا كان هناك أصوات ولكن لا يوجد قمة (حالة نادرة)
            topTeacherHtml = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>جاري تجهيز القمة...</p>
                </div>
            `;
        } else {
            // لا يوجد أي أصوات
            topTeacherHtml = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p>لا يوجد تفضيلات حتى الآن</p>
                    <span style="font-size:13px;color:#8a9bae;">كن أول من يفضل الأستاذ المميز!</span>
                </div>
            `;
        }
        
        // التصنيف الهرمي
        let leaderboardHtml = '';
        const filteredLeaderboard = this.leaderboard.filter(t => t.votesCount > 0);
        
        if (filteredLeaderboard && filteredLeaderboard.length > 0) {
            const medals = ['🥇', '🥈', '🥉'];
            
            leaderboardHtml = filteredLeaderboard.map((teacher) => {
                const isTop3 = teacher.rank <= 3;
                const medal = isTop3 ? medals[teacher.rank - 1] : `#${teacher.rank}`;
                
                let cardClass = 'rank-card';
                if (teacher.rank === 1 && teacher.votesCount > 0) cardClass += ' rank-gold';
                else if (teacher.rank === 2) cardClass += ' rank-silver';
                else if (teacher.rank === 3) cardClass += ' rank-bronze';
                
                if (teacher.isTie) cardClass += ' rank-tie';
                
                return `
                    <div class="${cardClass}">
                        <div class="rank-number">${medal}</div>
                        <div class="rank-avatar">
                            ${teacher.profileImage ? 
                                `<img src="${teacher.profileImage}" alt="${teacher.fullName}">` :
                                `<div class="avatar-placeholder-small">${teacher.fullName ? teacher.fullName.charAt(0) : '?'}</div>`
                            }
                        </div>
                        <div class="rank-info">
                            <span class="rank-name">${this.escapeHtml(teacher.fullName)}</span>
                            <span class="rank-subject">${this.escapeHtml(teacher.subject)}</span>
                        </div>
                        <div class="rank-rating">
                            <span class="rank-votes">
                                <i class="fas fa-heart" style="color:#ef4444;"></i>
                                ${teacher.votesCount} تفضيل
                            </span>
                            ${teacher.isTie ? '<span class="rank-tie-badge">⚖️ تعادل</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            leaderboardHtml = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <p>لا يوجد أصوات بعد</p>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="leaderboard-container">
                <div class="top-teacher-section">
                    <h3 class="section-title">
                        <i class="fas fa-crown" style="color:#f59e0b;"></i>
                        ${this.hasTie ? 'القمة المتعادلة 🏆' : 'الأكثر تفضيلاً'}
                    </h3>
                    ${topTeacherHtml}
                </div>
                
                <div class="leaderboard-section">
                    <h3 class="section-title">
                        <i class="fas fa-chart-bar"></i>
                        ترتيب الأساتذة حسب التفضيلات
                    </h3>
                    <div class="leaderboard-list">
                        ${leaderboardHtml}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderTeachers() {
        const container = document.getElementById('teachersRatingContainer');
        if (!container) return;
        
        if (this.teachers.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <p>لا يوجد أساتذة متاحين للتصويت</p>
                </div>
            `;
            return;
        }
        
        const votedCount = this.myRatings.length;
        const maxVotes = 2;
        const canVote = votedCount < maxVotes;
        
        container.innerHTML = this.teachers.map(teacher => {
            const hasVoted = teacher.hasVoted;
            
            return `
                <div class="teacher-rating-card ${hasVoted ? 'voted' : ''}">
                    <div class="teacher-rating-avatar">
                        ${teacher.profileImage ? 
                            `<img src="${teacher.profileImage}" alt="${teacher.fullName}">` :
                            `<div class="avatar-placeholder">${teacher.fullName ? teacher.fullName.charAt(0) : '?'}</div>`
                        }
                    </div>
                    <div class="teacher-rating-info">
                        <h4 class="teacher-name">${this.escapeHtml(teacher.fullName)}</h4>
                        <span class="teacher-subject">${this.escapeHtml(teacher.subject)}</span>
                        <div class="teacher-votes">
                            <span class="votes-count">
                                <i class="fas fa-heart" style="color:#ef4444;"></i>
                                ${teacher.votesCount} تفضيل
                            </span>
                        </div>
                    </div>
                    <div class="teacher-rating-actions">
                        ${hasVoted ? `
                            <div class="voted-badge">
                                <i class="fas fa-check-circle"></i>
                                ✅ مفضل
                            </div>
                            <button class="btn btn-sm btn-danger" onclick="window.StudentRatings.removeVote(${teacher.id})">
                                <i class="fas fa-times"></i> إلغاء التفضيل
                            </button>
                        ` : `
                            ${canVote ? `
                                <button class="btn btn-preference" onclick="window.StudentRatings.addVote(${teacher.id})">
                                    <i class="fas fa-heart"></i>
                                    تفضيل
                                </button>
                            ` : `
                                <div class="no-vote-badge">
                                    <i class="fas fa-info-circle"></i>
                                    وصلت للحد الأقصى (2)
                                </div>
                            `}
                        `}
                    </div>
                </div>
            `;
        }).join('');
        
        this.updateCount();
    },
    
    async addVote(teacherId) {
        if (this.votingInProgress) return;
        this.votingInProgress = true;
        
        try {
            const response = await fetch('/api/ratings/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ teacherId })
            });
            const data = await response.json();
            
            if (data.success) {
                Utils.showSuccess('❤️ تم إضافة تفضيلك بنجاح!');
                await this.load();
            } else {
                Utils.showError(data.error || 'فشل إضافة التفضيل');
            }
        } catch (error) {
            console.error('Error adding vote:', error);
            Utils.showError('حدث خطأ في إضافة التفضيل');
        } finally {
            this.votingInProgress = false;
        }
    },
    
    async removeVote(teacherId) {
        const confirmed = await Utils.confirmAction(
            'إلغاء التفضيل',
            'هل أنت متأكد من إلغاء تفضيل هذا الأستاذ؟'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await fetch(`/api/ratings/remove/${teacherId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success) {
                Utils.showSuccess('✅ تم إلغاء التفضيل بنجاح');
                await this.load();
            } else {
                Utils.showError(data.error || 'فشل إلغاء التفضيل');
            }
        } catch (error) {
            console.error('Error removing vote:', error);
            Utils.showError('حدث خطأ في إلغاء التفضيل');
        }
    },
    
    updateCount() {
        const countEl = document.getElementById('ratingsCount');
        const votedEl = document.getElementById('ratedCount');
        if (countEl) {
            countEl.textContent = `${this.myRatings.length} / 2 تفضيل`;
        }
        if (votedEl) {
            votedEl.textContent = this.myRatings.length;
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { StudentRatings as Ratings };