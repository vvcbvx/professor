import { Utils } from '../modules/utils.js';
import { Auth } from '../modules/auth.js';
import { API } from '../modules/api.js';

// ===== نظام تقييم الطالب =====
const StudentEvaluation = {
    evaluation: null,
    selectedSubject: null,
    subjectDetails: null,
    isLoading: false,
    
    async load() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            const user = Auth.getUser();
            if (!user || !user.id) {
                this.showError('الرجاء تسجيل الدخول أولاً');
                return;
            }
            
            console.log('📥 جلب تقييم الطالب:', user.id);
            
            const response = await fetch(`/api/student/evaluation/${user.id}`, {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل تحميل التقييم');
            }
            
            const data = await response.json();
            console.log('📊 بيانات التقييم:', data);
            
            this.evaluation = data;
            
            // التحقق من وجود بيانات
            if (!data.hasData || !data.subjects || data.subjects.length === 0) {
                this.renderEmptyState('لا توجد بيانات كافية للتقييم');
                return;
            }
            
            this.renderOverview();
            this.renderSubjects();
        } catch (error) {
            console.error('❌ Error loading evaluation:', error);
            this.renderEmptyState(error.message || 'حدث خطأ في تحميل التقييم');
        } finally {
            this.isLoading = false;
        }
    },
    
    showError(message) {
        Utils.showError(message);
    },
    
    renderEmptyState(message = 'لا يوجد معلومات كافية') {
        const container = document.getElementById('evaluationOverview');
        if (container) {
            container.innerHTML = `
                <div class="empty-state" style="padding:40px 20px;text-align:center;">
                    <i class="fas fa-info-circle" style="font-size:48px;color:#f59e0b;display:block;margin-bottom:16px;"></i>
                    <p style="font-size:18px;font-weight:700;color:#1a2332;margin-bottom:8px;">${message}</p>
                    <p style="font-size:14px;color:#8a9bae;max-width:400px;margin:0 auto;">
                        لم تقم بتقديم أي امتحانات حتى الآن، أو لم يتم إضافة ملاحظات عنك.
                        <br>
                        <span style="font-size:13px;color:#4a6cf7;">قم بتقديم امتحانات للحصول على تقييم شامل.</span>
                    </p>
                    <button class="btn btn-primary btn-sm" onclick="window.StudentEvaluation.load()" style="margin-top:16px;width:auto;padding:8px 24px;">
                        <i class="fas fa-sync-alt"></i> تحديث
                    </button>
                </div>
            `;
        }
        
        const subjectsContainer = document.getElementById('evaluationSubjects');
        if (subjectsContainer) {
            subjectsContainer.innerHTML = `
                <div class="empty-state" style="padding:20px;text-align:center;">
                    <i class="fas fa-book" style="font-size:32px;color:#d0d7e0;display:block;margin-bottom:8px;"></i>
                    <p style="color:#8a9bae;font-size:14px;">لا توجد مواد مسجلة</p>
                </div>
            `;
        }
    },
    
    renderOverview() {
        const container = document.getElementById('evaluationOverview');
        if (!container) return;
        
        // التحقق من وجود بيانات
        if (!this.evaluation || !this.evaluation.subjects || this.evaluation.subjects.length === 0) {
            this.renderEmptyState('لا توجد بيانات كافية للتقييم');
            return;
        }
        
        const overall = this.evaluation.overall || {};
        const hasData = this.evaluation.hasData || false;
        
        // إذا لم توجد بيانات، عرض رسالة
        if (!hasData || overall.totalExams === 0) {
            this.renderEmptyState('لا توجد بيانات كافية للتقييم');
            return;
        }
        
        // تحديد الأيقونة حسب المستوى
        const levelIcons = {
            'متفوق': '🏆',
            'جيد جداً': '⭐',
            'جيد': '👍',
            'مقبول': '📖',
            'ضعيف': '📚'
        };
        
        const levelEmojis = {
            'متفوق': '🌟',
            'جيد جداً': '💫',
            'جيد': '✅',
            'مقبول': '📝',
            'ضعيف': '⚠️'
        };
        
        const levelColors = {
            'متفوق': '#10b981',
            'جيد جداً': '#34d399',
            'جيد': '#fbbf24',
            'مقبول': '#f59e0b',
            'ضعيف': '#ef4444'
        };
        
        const levelBgColors = {
            'متفوق': '#d1fae5',
            'جيد جداً': '#d1fae5',
            'جيد': '#fef3c7',
            'مقبول': '#fef3c7',
            'ضعيف': '#fee2e2'
        };
        
        const level = overall.level || 'لا يوجد';
        const levelColor = levelColors[level] || '#8a9bae';
        const levelBgColor = levelBgColors[level] || '#f0f3f8';
        const levelIcon = levelIcons[level] || '📊';
        const levelEmoji = levelEmojis[level] || '📊';
        
        container.innerHTML = `
            <div class="evaluation-overview-card" style="border:2px solid ${levelColor};background:${levelBgColor}20;border-radius:16px;padding:20px;">
                <div class="overall-level" style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px;">
                    <span class="level-icon" style="font-size:32px;">${levelIcon}</span>
                    <span class="level-text" style="font-size:24px;font-weight:800;color:${levelColor};">${level}</span>
                    <span class="level-emoji" style="font-size:24px;">${levelEmoji}</span>
                </div>
                <div class="overall-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
                    <div class="stat-item" style="text-align:center;background:white;padding:12px;border-radius:12px;border:1px solid #eef2f7;">
                        <span class="stat-value" style="display:block;font-size:22px;font-weight:800;color:${levelColor};">${overall.average || 0}%</span>
                        <span class="stat-label" style="font-size:12px;color:#8a9bae;">المعدل العام</span>
                    </div>
                    <div class="stat-item" style="text-align:center;background:white;padding:12px;border-radius:12px;border:1px solid #eef2f7;">
                        <span class="stat-value" style="display:block;font-size:22px;font-weight:800;color:#4a6cf7;">${overall.totalExams || 0}</span>
                        <span class="stat-label" style="font-size:12px;color:#8a9bae;">عدد الامتحانات</span>
                    </div>
                    <div class="stat-item" style="text-align:center;background:white;padding:12px;border-radius:12px;border:1px solid #eef2f7;">
                        <span class="stat-value" style="display:block;font-size:22px;font-weight:800;color:#8b5cf6;">${overall.subjectsCount || 0}</span>
                        <span class="stat-label" style="font-size:12px;color:#8a9bae;">عدد المواد</span>
                    </div>
                </div>
                <div class="overall-progress" style="background:#f0f3f8;border-radius:12px;overflow:hidden;height:24px;position:relative;">
                    <div class="progress-bar" style="width:${overall.average || 0}%;background:${levelColor};height:100%;display:flex;align-items:center;justify-content:center;transition:width 1s ease;">
                        <span class="progress-text" style="color:white;font-size:12px;font-weight:700;">${overall.average || 0}%</span>
                    </div>
                </div>
                ${overall.totalExams > 0 ? `
                    <div style="margin-top:12px;padding:8px 12px;background:${levelBgColor};border-radius:8px;text-align:center;">
                        <span style="font-size:13px;color:#4a5a6e;">
                            ${levelEmoji} مستوى ${level} بناءً على ${overall.totalExams} امتحان في ${overall.subjectsCount} مادة
                        </span>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    renderSubjects() {
        const container = document.getElementById('evaluationSubjects');
        if (!container) return;
        
        if (!this.evaluation || !this.evaluation.subjects || this.evaluation.subjects.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="padding:20px;text-align:center;">
                    <i class="fas fa-book" style="font-size:32px;color:#d0d7e0;display:block;margin-bottom:8px;"></i>
                    <p style="color:#8a9bae;font-size:14px;">لا توجد مواد مسجلة</p>
                </div>
            `;
            return;
        }
        
        const subjects = this.evaluation.subjects || [];
        
        container.innerHTML = subjects.map((subject, index) => {
            const levelColors = {
                'متفوق': '#10b981',
                'جيد جداً': '#34d399',
                'جيد': '#fbbf24',
                'مقبول': '#f59e0b',
                'ضعيف': '#ef4444'
            };
            
            const levelColor = levelColors[subject.level] || '#8a9bae';
            const levelBgColor = levelColor + '20';
            
            return `
                <div class="subject-evaluation-card" onclick="window.StudentEvaluation.showSubjectChart('${encodeURIComponent(subject.subject)}')" style="background:white;border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid #eef2f7;border-right:4px solid ${levelColor};cursor:pointer;transition:all 0.3s ease;">
                    <div class="subject-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
                        <span class="subject-name" style="font-size:16px;font-weight:700;color:#1a2332;">${this.escapeHtml(subject.subject)}</span>
                        <span class="subject-level" style="padding:2px 12px;background:${levelColor};color:white;border-radius:12px;font-size:12px;font-weight:600;">
                            ${subject.level}
                        </span>
                    </div>
                    <div class="subject-details" style="display:flex;gap:16px;font-size:13px;color:#8a9bae;margin-bottom:8px;">
                        <span class="subject-grade">المعدل: <strong style="color:${levelColor};">${subject.average}%</strong></span>
                        <span class="subject-exams">${subject.gradesCount || 0} امتحان</span>
                    </div>
                    <div class="subject-progress" style="background:#f0f3f8;border-radius:8px;overflow:hidden;height:8px;">
                        <div class="progress-bar" style="width:${subject.average}%;background:${levelColor};height:100%;transition:width 1s ease;"></div>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                        <button class="btn btn-sm btn-primary" style="width:auto;padding:4px 16px;font-size:12px;background:#4a6cf7;color:white;border:none;border-radius:8px;cursor:pointer;">
                            <i class="fas fa-chart-line"></i> عرض التفاصيل
                        </button>
                        ${subject.gradesCount > 0 ? `
                            <span style="font-size:11px;color:#8a9bae;display:flex;align-items:center;gap:4px;">
                                <i class="fas fa-check-circle" style="color:#10b981;"></i>
                                ${subject.gradesCount} امتحان
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    async showSubjectChart(subjectEncoded) {
        const subject = decodeURIComponent(subjectEncoded);
        this.selectedSubject = subject;
        
        try {
            const user = Auth.getUser();
            const response = await fetch(`/api/student/subject-details/${user.id}/${encodeURIComponent(subject)}`, {
                credentials: 'include',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error('فشل تحميل تفاصيل المادة');
            }
            
            const data = await response.json();
            this.subjectDetails = data;
            
            this.renderSubjectChart(data);
        } catch (error) {
            console.error('Error loading subject details:', error);
            Utils.showError('فشل تحميل تفاصيل المادة');
        }
    },
    
    renderSubjectChart(data) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay show';
        modal.id = 'subjectChartModal';
        
        const grades = data.gradesData || [];
        const average = data.average || 0;
        
        // تحديد لون المعدل
        const avgColor = average >= 70 ? '#10b981' : average >= 50 ? '#f59e0b' : '#ef4444';
        
        // إنشاء الرسم البياني
        let chartHtml = '';
        if (grades.length > 0) {
            const maxGrade = 100;
            const points = grades.map((g, index) => {
                const x = (index / (grades.length - 1)) * 90 + 5;
                const y = 90 - (g.grade / maxGrade) * 80 + 5;
                return `${x},${y}`;
            }).join(' ');
            
            chartHtml = `
                <div class="chart-container">
                    <div style="position:relative;width:100%;padding:10px 0;">
                        <svg viewBox="0 0 100 100" style="width:100%;height:200px;background:#f8fafc;border-radius:8px;overflow:visible;">
                            <!-- الشبكة -->
                            <line x1="5" y1="90" x2="95" y2="90" stroke="#e8ecf1" stroke-width="0.5"/>
                            <line x1="5" y1="70" x2="95" y2="70" stroke="#e8ecf1" stroke-width="0.5" stroke-dasharray="2,2"/>
                            <line x1="5" y1="50" x2="95" y2="50" stroke="#e8ecf1" stroke-width="0.5" stroke-dasharray="2,2"/>
                            <line x1="5" y1="30" x2="95" y2="30" stroke="#e8ecf1" stroke-width="0.5" stroke-dasharray="2,2"/>
                            <line x1="5" y1="10" x2="95" y2="10" stroke="#e8ecf1" stroke-width="0.5" stroke-dasharray="2,2"/>
                            
                            <!-- خط الرسم -->
                            <polyline points="${points}" fill="none" stroke="#4a6cf7" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
                            
                            <!-- نقاط البيانات -->
                            ${grades.map((g, index) => {
                                const x = (index / (grades.length - 1)) * 90 + 5;
                                const y = 90 - (g.grade / maxGrade) * 80 + 5;
                                const color = g.grade >= 70 ? '#10b981' : g.grade >= 50 ? '#f59e0b' : '#ef4444';
                                return `
                                    <circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="white" stroke-width="1.5" 
                                            style="cursor:pointer;transition:r 0.3s ease;"
                                            onmouseover="this.setAttribute('r','5')" 
                                            onmouseout="this.setAttribute('r','3')"
                                            onclick="alert('التاريخ: ${new Date(g.date).toLocaleDateString('ar-SA')}\\nالدرجة: ${g.grade}%')"/>
                                `;
                            }).join('')}
                            
                            <!-- خط 50% -->
                            <text x="1" y="48" font-size="4" fill="#8a9bae">50%</text>
                            <text x="1" y="28" font-size="4" fill="#8a9bae">70%</text>
                            <text x="1" y="8" font-size="4" fill="#8a9bae">90%</text>
                        </svg>
                    </div>
                    <div class="chart-labels" style="display:flex;justify-content:space-between;padding:0 10px;font-size:9px;color:#8a9bae;margin-top:4px;">
                        ${grades.map(g => `<span>${new Date(g.date).toLocaleDateString('ar-SA')}</span>`).join('')}
                    </div>
                </div>
                
                <div class="chart-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0;">
                    <div class="chart-stat" style="text-align:center;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span class="stat-label" style="display:block;font-size:12px;color:#8a9bae;">المادة</span>
                        <span class="stat-value" style="display:block;font-size:16px;font-weight:700;color:#1a2332;">${this.escapeHtml(data.subject)}</span>
                    </div>
                    <div class="chart-stat" style="text-align:center;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span class="stat-label" style="display:block;font-size:12px;color:#8a9bae;">المعدل</span>
                        <span class="stat-value" style="display:block;font-size:16px;font-weight:700;color:${avgColor};">${average}%</span>
                    </div>
                    <div class="chart-stat" style="text-align:center;padding:12px;background:#f8fafc;border-radius:8px;">
                        <span class="stat-label" style="display:block;font-size:12px;color:#8a9bae;">الامتحانات</span>
                        <span class="stat-value" style="display:block;font-size:16px;font-weight:700;color:#1a2332;">${grades.length}</span>
                    </div>
                </div>
                
                <div class="chart-grades-list" style="margin-top:12px;">
                    <h5 style="font-size:14px;font-weight:600;color:#1a2332;margin-bottom:8px;">📋 تفاصيل الدرجات</h5>
                    ${grades.map(g => `
                        <div class="grade-item" style="display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #f0f2f5;font-size:13px;">
                            <span>${new Date(g.date).toLocaleDateString('ar-SA')}</span>
                            <span class="grade-value" style="font-weight:700;color:${g.grade >= 70 ? '#10b981' : g.grade >= 50 ? '#f59e0b' : '#ef4444'};">${g.grade}%</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            chartHtml = `
                <div class="empty-state" style="padding:40px 20px;text-align:center;">
                    <i class="fas fa-chart-line" style="font-size:40px;color:#d0d7e0;display:block;margin-bottom:12px;"></i>
                    <p style="font-size:16px;color:#8a9bae;">لا توجد درجات مسجلة لهذه المادة</p>
                    <span style="font-size:13px;color:#8a9bae;">قم بتقديم امتحانات للحصول على تقييم</span>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-box" style="max-width:700px;max-height:90vh;overflow-y:auto;">
                <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #f0f3f8;">
                    <div class="modal-title" style="font-size:18px;font-weight:700;color:#1a2332;display:flex;align-items:center;gap:10px;">
                        <i class="fas fa-chart-line" style="color:#4a6cf7;"></i>
                        ${this.escapeHtml(data.subject)}
                    </div>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()" style="width:32px;height:32px;border:none;background:#f0f3f8;border-radius:50%;cursor:pointer;font-size:16px;color:#8a9bae;transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${chartHtml}
                </div>
                <div class="modal-footer" style="display:flex;gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid #f0f2f5;">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()" style="padding:8px 20px;border:2px solid #e8ecf1;border-radius:10px;background:transparent;color:#1a2332;font-weight:600;cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.3s ease;">إغلاق</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // إغلاق عند النقر خارج المودال
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

export { StudentEvaluation as Evaluation };