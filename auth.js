class SlideAuth {
    constructor() {
        this.PASSWORD = '8888';
        this.SESSION_KEY = 'slide_auth_session';
        this.SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 giờ
    }

    checkAuth() {
        const session = localStorage.getItem(this.SESSION_KEY);
        if (!session) return false;
        
        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            
            if (now > sessionData.expires) {
                this.logout();
                return false;
            }
            
            // Gia hạn session tự động
            this.updateSession();
            return true;
        } catch (e) {
            this.logout();
            return false;
        }
    }

    login(password) {
        if (password === this.PASSWORD) {
            this.updateSession();
            return true;
        }
        return false;
    }

    updateSession() {
        const sessionData = {
            authenticated: true,
            expires: Date.now() + this.SESSION_DURATION
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    }

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    }

    requireAuth() {
        if (!this.checkAuth()) {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
            return false;
        }
        return true;
    }
}

// Khởi tạo auth global
window.slideAuth = new SlideAuth();
