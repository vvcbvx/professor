// ===== مكونات مشتركة =====
export const Components = {
    createDropdown(items, onSelect) {
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown-menu';
        
        items.forEach(item => {
            const option = document.createElement('div');
            option.className = 'dropdown-item';
            option.innerHTML = item.label;
            option.addEventListener('click', () => onSelect(item.value));
            dropdown.appendChild(option);
        });
        
        return dropdown;
    },
    
    createModal(title, content, onSave) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        
        const box = document.createElement('div');
        box.className = 'modal-box';
        
        box.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">${title}</div>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">${content}</div>
            <div class="modal-footer">
                <button class="btn btn-primary" id="modalSave">حفظ</button>
                <button class="btn btn-outline" id="modalCancel">إلغاء</button>
            </div>
        `;
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#modalCancel').addEventListener('click', () => overlay.remove());
        overlay.querySelector('#modalSave').addEventListener('click', () => {
            onSave();
            overlay.remove();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        return overlay;
    }
};