import { API } from '../modules/api.js';
import { Utils } from '../modules/utils.js';
import { Auth } from '../modules/auth.js';

// ===== ملف الأستاذ - الملف الشخصي مع المركز =====
const TeacherProfile = {
    profile: null,
    rankInfo: null,
    allRanks: [],
    isLoading: false,
    
    async load() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📥 تحميل الملف الشخصي للأستاذ...');
            
            // تحميل الملف الشخصي
            const data = await API.get('/api/profile');
            this.profile = data.profile || {};
            console.log('✅ تم تحميل الملف الشخصي:', this.profile);
            
            // تحميل معلومات المركز
            const user = Auth.getUser();
            if (user && user.id) {
                await this.loadRankInfo(user.id);
            }
            
            this.renderProfile();
            this.renderRankInfo();
        } catch (error) {
            console.error('❌ Error loading profile:', error);
            Utils.showError('فشل تحميل الملف الشخصي');
        } finally {
            this.isLoading = false;
        }
    },
    
    async loadRankInfo(teacherId) {
        try {
            console.log(`📥 تحميل معلومات المركز للأستاذ ${teacherId}...`);
            
            // جلب مركز الأستاذ
            const rankResponse = await API.get(`/api/teacher/rank/${teacherId}`);
            this.rankInfo = rankResponse || null;
            console.log('✅ معلومات المركز:', this.rankInfo);
            
            // جلب جميع المراكز
            const allRanksResponse = await API.get('/api/teacher/all-ranks');
            this.allRanks = allRanksResponse.teachers || [];
            console.log('✅ جميع المراكز:', this.allRanks.length, 'أستاذ');
            
        } catch (e) {
            console.error('❌ Error loading rank info:', e);
            this.rankInfo = null;
            this.allRanks = [];
        }
    },
    
    renderProfile() {
        if (!this.profile) return;
        
        const fullNameEl = document.getElementById('fullName');
        const phoneEl = document.getElementById('phone');
        const addressEl = document.getElementById('address');
        const bioEl = document.getElementById('bio');
        
        if (fullNameEl) fullNameEl.value = this.profile.fullName || '';
        if (phoneEl) phoneEl.value = this.profile.phone || '';
        if (addressEl) addressEl.value = this.profile.address || '';
        if (bioEl) bioEl.value = this.profile.bio || '';
        
        // تحديث الصورة الشخصية
        if (this.profile.profileImage) {
            const sidebarAvatar = document.getElementById('sidebarAvatar');
            const profilePreview = document.getElementById('profileAvatarPreview');
            
            if (sidebarAvatar) {
                sidebarAvatar.innerHTML = `<img src="${this.profile.profileImage}" alt="Profile">`;
            }
            if (profilePreview) {
                profilePreview.innerHTML = `<img src="${this.profile.profileImage}" alt="Profile">`;
            }
        }
    },
    
    renderRankInfo() {
        const container = document.getElementById('rankInfoContainer');
        if (!container) {
            console.warn('⚠️ عنصر rankInfoContainer غير موجود');
            return;
        }
        
        console.log('📊 عرض معلومات المركز:', this.rankInfo);
        
        // إذا لم تكن هناك معلومات مركز
        if (!this.rankInfo) {
            container.innerHTML = `
                <div class="rank-info-card empty">
                    <div style="text-align:center;padding:16px;">
                        <i class="fas fa-info-circle" style="font-size:32px;color:#8a9bae;display:block;margin-bottom:8px;"></i>
                        <p style="color:#8a9bae;margin:0;font-size:15px;">
                            لا توجد تصويتات حتى الآن
                        </p>
                        <span style="font-size:13px;color:#8a9bae;">
                            كن أول من يحصل على تفضيلات من الطلاب!
                        </span>
                        <button class="btn btn-sm btn-primary" onclick="window.TeacherProfile.load()" style="margin-top:12px;width:auto;padding:4px 16px;">
                            <i class="fas fa-sync-alt"></i> تحديث
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        const rank = this.rankInfo.rank || 0;
        const total = this.rankInfo.totalTeachers || 0;
        const votes = this.rankInfo.votesCount || 0;
        const maxVotes = this.rankInfo.maxVotes || 0;
        const hasVotes = this.rankInfo.hasVotes || false;
        
        // إذا لم يكن لديه أصوات
        if (!hasVotes || votes === 0) {
            container.innerHTML = `
                <div class="rank-info-card empty">
                    <div style="text-align:center;padding:16px;">
                        <i class="fas fa-heart" style="font-size:32px;color:#8a9bae;display:block;margin-bottom:8px;"></i>
                        <p style="color:#8a9bae;margin:0;font-size:15px;">
                            لا توجد تفضيلات حتى الآن
                        </p>
                        <span style="font-size:13px;color:#8a9bae;">
                            كن أول من يحصل على تفضيلات من الطلاب!
                        </span>
                        <button class="btn btn-sm btn-primary" onclick="window.TeacherProfile.load()" style="margin-top:12px;width:auto;padding:4px 16px;">
                            <i class="fas fa-sync-alt"></i> تحديث
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        // تحديد الميدالية واللون حسب المركز
        let medal = '';
        let rankClass = '';
        let rankTitle = '';
        let medalEmoji = '';
        
        if (rank === 1) {
            medal = '🥇';
            medalEmoji = '🏆';
            rankClass = 'rank-gold';
            rankTitle = '🏆 المركز الأول - الأكثر تفضيلاً!';
        } else if (rank === 2) {
            medal = '🥈';
            medalEmoji = '🥈';
            rankClass = 'rank-silver';
            rankTitle = '🥈 المركز الثاني';
        } else if (rank === 3) {
            medal = '🥉';
            medalEmoji = '🥉';
            rankClass = 'rank-bronze';
            rankTitle = '🥉 المركز الثالث';
        } else {
            medal = `#${rank}`;
            medalEmoji = `#${rank}`;
            rankClass = 'rank-other';
            rankTitle = `المركز ${rank}`;
        }
        
        // حساب النسبة المئوية
        const percentage = maxVotes > 0 ? Math.round((votes / maxVotes) * 100) : 0;
        
        // بناء قائمة جميع المراكز
        let allRanksHtml = '';
        if (this.allRanks && this.allRanks.length > 0) {
            // ترتيب المراكز
            const sortedRanks = [...this.allRanks].sort((a, b) => a.rank - b.rank);
            const topRanks = sortedRanks.slice(0, 10);
            
            allRanksHtml = `
                <div class="rank-all-container" style="margin-top:16px;padding-top:16px;border-top:2px solid #f0f3f8;">
                    <div class="rank-all-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h5 style="font-size:14px;font-weight:700;color:#1a2332;margin:0;">
                            🏅 جميع المراكز
                        </h5>
                        <span style="font-size:12px;color:#8a9bae;">أعلى ${topRanks.length}</span>
                    </div>
                    <div class="rank-all-list" style="display:flex;flex-direction:column;gap:6px;">
                        ${topRanks.map(t => {
                            const isMe = t.id === this.rankInfo.teacherId;
                            let rankMedal = '';
                            if (t.rank === 1) rankMedal = '🥇';
                            else if (t.rank === 2) rankMedal = '🥈';
                            else if (t.rank === 3) rankMedal = '🥉';
                            else rankMedal = `#${t.rank}`;
                            
                            return `
                                <div class="rank-list-item ${isMe ? 'is-me' : ''}" style="
                                    display:flex;
                                    align-items:center;
                                    gap:12px;
                                    padding:8px 12px;
                                    border-radius:10px;
                                    background:${isMe ? '#e8edff' : 'transparent'};
                                    border:${isMe ? '2px solid #4a6cf7' : '1px solid #eef2f7'};
                                    transition:all 0.3s ease;
                                ">
                                    <span class="rank-list-number" style="font-size:18px;font-weight:700;color:#4a6cf7;min-width:40px;">
                                        ${rankMedal}
                                    </span>
                                    <span class="rank-list-name" style="flex:1;font-weight:${isMe ? '700' : '400'};color:${isMe ? '#4a6cf7' : '#1a2332'};">
                                        ${this.escapeHtml(t.fullName)}
                                        ${isMe ? ' 👈 (أنت)' : ''}
                                    </span>
                                    <span class="rank-list-subject" style="font-size:12px;color:#8a9bae;">
                                        ${this.escapeHtml(t.subject)}
                                    </span>
                                    <span class="rank-list-votes" style="display:flex;align-items:center;gap:4px;font-weight:600;color:#ef4444;">
                                        <i class="fas fa-heart" style="color:#ef4444;"></i>
                                        ${t.votesCount}
                                    </span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }
        
        // عرض معلومات المركز
        container.innerHTML = `
            <div class="rank-info-card ${rankClass}" style="
                background:white;
                border-radius:16px;
                padding:20px;
                border:2px solid ${rank === 1 ? '#fbbf24' : rank === 2 ? '#d1d5db' : rank === 3 ? '#f59e0b' : '#e8ecf1'};
                box-shadow: ${rank === 1 ? '0 4px 20px rgba(251,191,36,0.2)' : '0 2px 12px rgba(0,0,0,0.04)'};
            ">
                <div class="rank-info-header" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                    <div class="rank-medal" style="
                        font-size:48px;
                        width:72px;
                        height:72px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:${rank === 1 ? '#fef3c7' : rank === 2 ? '#f3f4f6' : rank === 3 ? '#fef3c7' : '#f0f3f8'};
                        border-radius:50%;
                        flex-shrink:0;
                    ">
                        ${medal}
                    </div>
                    <div class="rank-details" style="flex:1;">
                        <h4 style="font-size:18px;font-weight:700;color:#1a2332;margin:0 0 4px 0;">
                            ${rankTitle}
                        </h4>
                        <div class="rank-position" style="font-size:14px;color:#4a5a6e;">
                            من <strong>${total}</strong> أستاذ
                        </div>
                        <div class="rank-votes-detail" style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                            <i class="fas fa-heart" style="color:#ef4444;"></i>
                            <strong style="font-size:16px;color:#1a2332;">${votes}</strong>
                            <span style="color:#8a9bae;font-size:13px;">تفضيل</span>
                            ${maxVotes > 0 ? `<span style="color:#8a9bae;font-size:13px;">(الأعلى: ${maxVotes})</span>` : ''}
                        </div>
                        <div class="rank-progress" style="margin-top:8px;">
                            <div style="
                                background:#f0f3f8;
                                border-radius:8px;
                                height:8px;
                                overflow:hidden;
                                position:relative;
                            ">
                                <div class="rank-progress-bar" style="
                                    width:${percentage}%;
                                    height:100%;
                                    background:${rank === 1 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : rank === 2 ? 'linear-gradient(90deg, #9ca3af, #d1d5db)' : rank === 3 ? 'linear-gradient(90deg, #d97706, #f59e0b)' : '#4a6cf7'};
                                    border-radius:8px;
                                    transition:width 1s ease;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                ">
                                    <span class="rank-progress-text" style="
                                        font-size:10px;
                                        font-weight:700;
                                        color:white;
                                        position:absolute;
                                        right:4px;
                                    ">
                                        ${percentage}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${allRanksHtml}
                
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #f0f3f8;display:flex;gap:10px;flex-wrap:wrap;">
                    <button class="btn btn-sm btn-primary" onclick="window.TeacherProfile.load()" style="width:auto;padding:4px 16px;">
                        <i class="fas fa-sync-alt"></i> تحديث
                    </button>
                    <span style="font-size:12px;color:#8a9bae;display:flex;align-items:center;gap:4px;">
                        <i class="fas fa-info-circle"></i>
                        آخر تحديث: ${new Date().toLocaleTimeString('ar-SA')}
                    </span>
                </div>
            </div>
        `;
    },
    
    async update(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const bio = document.getElementById('bio').value;
        const imageFile = document.getElementById('profileImageInput').files[0];
        
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('phone', phone);
        formData.append('address', address);
        formData.append('bio', bio);
        if (imageFile) formData.append('profileImage', imageFile);

        try {
            const data = await API.upload('/api/profile', formData);
            if (data.success) {
                Utils.showSuccess('✅ تم حفظ الملف الشخصي بنجاح!');
                await this.load();
            } else {
                Utils.showError('فشل حفظ الملف الشخصي');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Utils.showError('حدث خطأ في حفظ الملف الشخصي');
        }
    },
    
    async changePassword(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        
        if (!currentPassword || !newPassword) {
            Utils.showError('يرجى ملء جميع الحقول');
            return;
        }

        try {
            const data = await API.post('/api/change-password', { currentPassword, newPassword });
            if (data.success) {
                Utils.showSuccess('✅ تم تغيير كلمة المرور بنجاح!');
                document.getElementById('passwordForm').reset();
            } else {
                Utils.showError(data.error || 'فشل تغيير كلمة المرور');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            Utils.showError('حدث خطأ في تغيير كلمة المرور');
        }
    },
    
    previewImage(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('profileAvatarPreview');
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                }
            };
            reader.readAsDataURL(file);
        }
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { TeacherProfile as Profile };