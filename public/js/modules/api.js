// ===== دوال API =====
export const API = {
    async handleResponse(response) {
        if (response.status === 401) {
            localStorage.removeItem('user');
            window.location.replace('/login.html');
            throw new Error('غير مصرح');
        }
        if (!response.ok) {
            let errorMessage = `خطأ في الاتصال`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // إذا لم يكن هناك JSON
            }
            throw new Error(errorMessage);
        }
        return response.json();
    },

    async get(endpoint) {
        try {
            const response = await fetch(endpoint, {
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Accept': 'application/json'
                }
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('API GET error:', error);
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('API POST error:', error);
            throw error;
        }
    },

    async put(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('API PUT error:', error);
            throw error;
        }
    },

    async delete(endpoint) {
        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('API DELETE error:', error);
            throw error;
        }
    },

    async upload(endpoint, formData) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            return this.handleResponse(response);
        } catch (error) {
            console.error('API UPLOAD error:', error);
            throw error;
        }
    }
};