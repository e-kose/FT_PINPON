import "../utils/Header.ts";
import "../utils/SideBar.ts";
import type { User } from '../../types/User.ts';
import { getUser, setUser } from '../../store/UserStore.ts';
import { sidebarStateManager } from "../../router/SidebarStateManager";
import type { SidebarStateListener } from "../../router/SidebarStateManager";

class Settings extends HTMLElement {
    private currentUser: User | null = null;
    private sidebarListener: SidebarStateListener | null = null;

    constructor() {
        super();
        // Load current user from UserStore
        this.currentUser = getUser();
        this.render();
        this.attachEventListeners();
    }

    connectedCallback(): void {
        this.attachEventListeners();
        this.setupSidebarListener();
    }

    disconnectedCallback(): void {
        // Event cleanup
        if (this.sidebarListener) {
            sidebarStateManager.removeListener(this.sidebarListener);
            this.sidebarListener = null;
        }
    }

    private render(): void {
        // if (!this.currentUser) {
        //     this.innerHTML = `
        //         <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        //             <div class="text-center backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/20">
        //                 <h1 class="text-2xl font-bold text-white mb-4">Kullanıcı Bilgisi Bulunamadı</h1>
        //                 <p class="text-blue-200">Lütfen önce giriş yapın.</p>
        //             </div>
        //         </div>	
        //     `;
        //     return;
        // }

        this.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
                <!-- Header Component -->
                <header-component></header-component>
                
                <div class="pt-20">
                    <!-- Sidebar Component -->
                    <sidebar-component current-route="settings"></sidebar-component>
                    
                    <!-- Main Content -->
                    <div class="pl-16 transition-all duration-300" id="settingsMainContent">
                        <div class="max-w-4xl mx-auto p-6">
                            <!-- Page Header -->
                            <div class="mb-8">
                                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Ayarlar</h1>
                                <p class="text-gray-600 dark:text-gray-400 mt-2">Hesap bilgilerinizi ve tercihlerinizi yönetin</p>
                            </div>

                            <!-- Account Section -->
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Hesap</h2>
                                </div>
                                <div class="p-6">
                                    <!-- Profile Photo -->
                                    <div class="flex items-center space-x-6 mb-6">
                                        <div class="relative">
                                            ${this.currentUser?.profile?.avatar_url ? 
                                                `<img src="${this.currentUser.profile.avatar_url}" alt="Avatar" class="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600">` :
                                                `<div class="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-300 dark:border-gray-600">
                                                    ${this.getInitials()}
                                                </div>`
                                            }
                                            <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" id="avatar-overlay">
                                                <span class="text-white text-xs">Değiştir</span>
                                            </div>
                                        </div>
                                      
                                    </div>

                                    <!-- Form Fields -->
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <!-- Username -->
                                        <div>
                                            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Kullanıcı Adı *
                                            </label>
                                            <input 
                                                type="text" 
                                                id="username" 
                                                value="${this.currentUser?.username || ''}"
                                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="Kullanıcı adınız"
                                            >
                                        </div>

                                        <!-- Full Name -->
                                        <div>
                                            <label for="fullname" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tam Ad *
                                            </label>
                                            <input 
                                                type="text" 
                                                id="fullname" 
                                                value="${this.currentUser?.profile?.full_name || ''}"
                                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="Tam adınız"
                                            >
                                        </div>

                                        <!-- Email -->
                                        <div>
                                            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                E-posta *
                                            </label>
                                            <input 
                                                type="email" 
                                                id="email" 
                                                value="${this.currentUser?.email || ''}"
                                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                placeholder="email@example.com"
                                            >
                                        </div>

                                        <!-- Account Type (Read-only) -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Hesap Türü
                                            </label>
                                            <div class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                                                Standart Kullanıcı
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Biography -->
                                    <div class="mt-6">
                                        <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Biyografi
                                        </label>
                                        <textarea 
                                            id="bio" 
                                            rows="4"
                                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                                            placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
                                        >${this.currentUser?.profile?.bio || ''}</textarea>
                                    </div>

                                    <!-- Save Button -->
                                    <div class="mt-6 flex justify-end">
                                        <button id="save-account-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                            Değişiklikleri Kaydet
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Security Section -->
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Güvenlik</h2>
                                </div>
                                <div class="p-6">
                                    <!-- Password Change -->
                                    <div class="mb-6">
                                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Şifre Değiştir</h3>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label for="current-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Mevcut Şifre
                                                </label>
                                                <input 
                                                    type="password" 
                                                    id="current-password"
                                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="Mevcut şifreniz"
                                                >
                                            </div>
                                            <div></div>
                                            <div>
                                                <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Yeni Şifre
                                                </label>
                                                <input 
                                                    type="password" 
                                                    id="new-password"
                                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="Yeni şifreniz"
                                                >
                                            </div>
                                            <div>
                                                <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Şifre Onayı
                                                </label>
                                                <input 
                                                    type="password" 
                                                    id="confirm-password"
                                                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                                    placeholder="Yeni şifrenizi tekrar girin"
                                                >
                                            </div>
                                        </div>

                                        <!-- Password Requirements -->
                                        <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Şifre Gereksinimleri:</h4>
                                            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <li>• En az 8 karakter</li>
                                                <li>• En az bir büyük harf</li>
                                                <li>• En az bir küçük harf</li>
                                                <li>• En az bir rakam</li>
                                                <li>• En az bir özel karakter (!@#$%^&*)</li>
                                            </ul>
                                        </div>

                                        <div class="mt-6">
                                            <button id="change-password-btn" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                                                Şifreyi Değiştir
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Two-Factor Authentication -->
                                    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-lg font-medium text-gray-900 dark:text-white">İki Faktörlü Doğrulama (2FA)</h3>
                                                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Hesabınız için ekstra güvenlik katmanı ekleyin</p>
                                            </div>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" id="2fa-toggle" class="sr-only peer" ${this.currentUser?.is_2fa_enabled === 1 ? 'checked' : ''}>
                                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- General Information Section -->
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
                                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Genel Bilgiler</h2>
                                </div>
                                <div class="p-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <!-- Created At -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Hesap Oluşturma Tarihi
                                            </label>
                                            <div class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                                                ${this.formatDate(this.currentUser?.created_at)}
                                            </div>
                                        </div>

                                        <!-- Last Updated -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Son Güncelleme
                                            </label>
                                            <div class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                                                ${this.formatDate(this.currentUser?.updated_at)}
                                            </div>
                                        </div>

                                        <!-- User ID -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Kullanıcı ID
                                            </label>
                                            <div class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                                                #${this.currentUser?.id}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Preferences Section -->
                            <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
                                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                                    <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Tercihler</h2>
                                </div>
                                <div class="p-6">
                                    <!-- Dark Mode -->
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <h3 class="text-lg font-medium text-gray-900 dark:text-white">Karanlık Mod</h3>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Gözlerinizi korumak için koyu tema kullanın</p>
                                        </div>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="dark-mode-toggle" class="sr-only peer" checked>
                                            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Hidden file input -->
            <input type="file" id="avatar-input" accept="image/*" class="hidden">
        `;
    }

    private attachEventListeners(): void {
                // Avatar upload functionality
        const avatarOverlay = this.querySelector('#avatar-overlay');
        const uploadBtn = this.querySelector('#upload-btn');
        const avatarInput = this.querySelector('#avatar-input') as HTMLInputElement;

        avatarOverlay?.addEventListener('click', () => {
            avatarInput?.click();
        });

        uploadBtn?.addEventListener('click', () => {
            avatarInput?.click();
        });

        // Avatar remove button
        const removeBtn = this.querySelector('#remove-avatar-btn');
        removeBtn?.addEventListener('click', () => {
            
        });

        avatarInput?.addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });

        // Account section save button
        const saveAccountBtn = this.querySelector('#save-account-btn');
        saveAccountBtn?.addEventListener('click', () => {
            this.saveAccountSettings();
        });

        // Password change button
        const changePasswordBtn = this.querySelector('#change-password-btn');
        changePasswordBtn?.addEventListener('click', () => {
            this.handlePasswordChange();
        });

        // 2FA toggle
        const twoFaToggle = this.querySelector('#2fa-toggle') as HTMLInputElement;
        twoFaToggle?.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.handle2FAToggle(target.checked);
        });

        // Dark mode toggle
        const darkModeToggle = this.querySelector('#dark-mode-toggle') as HTMLInputElement;
        darkModeToggle?.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.handleThemeToggle(target.checked);
        });
    }

    private getInitials(): string {
        const fullName = this.currentUser?.profile?.full_name || this.currentUser?.username || 'U';
        return fullName.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2);
    }

    private formatDate(dateString?: string): string {
        if (!dateString) return 'Bilinmiyor';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Event Handler Methods
    private handleAvatarUpload(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showNotification('Dosya boyutu 5MB\'dan küçük olmalıdır!', 'error');
                return;
            }

            if (!file.type.startsWith('image/')) {
                this.showNotification('Lütfen geçerli bir resim dosyası seçin!', 'error');
                return;
            }

            // Create a temporary URL for the uploaded file
            const imageUrl = URL.createObjectURL(file);
            
            // Update user's avatar
            if (this.currentUser && this.currentUser.profile) {
                this.currentUser.profile.avatar_url = imageUrl;
                setUser(this.currentUser, "TOKEN GİRİLECEK");
                this.render(); // Re-render to show new avatar
                this.attachEventListeners(); // Re-attach events after render
                this.showNotification('Avatar başarıyla yüklendi!', 'success');
            }

            // Here you would also upload the file to your server
            // and update the avatar_url with the server URL
        }
    }

    private saveAccountSettings(): void {
        const username = (this.querySelector('#username') as HTMLInputElement)?.value;
        const email = (this.querySelector('#email') as HTMLInputElement)?.value;
        const fullname = (this.querySelector('#fullname') as HTMLInputElement)?.value;
        const bio = (this.querySelector('#bio') as HTMLTextAreaElement)?.value;

        if (!username || !email || !fullname) {
            this.showNotification('Lütfen gerekli alanları doldurun!', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showNotification('Geçerli bir e-posta adresi girin!', 'error');
            return;
        }

        // Update user data
        if (this.currentUser) {
            this.currentUser.username = username;
            this.currentUser.email = email;
            if (!this.currentUser.profile) {
                this.currentUser.profile = {
                    user_id: this.currentUser.id,
                    full_name: '',
                    avatar_url: '',
                    bio: ''
                };
            }
            this.currentUser.profile.full_name = fullname;
            this.currentUser.profile.bio = bio;

            // Update store
            setUser(this.currentUser, "TOKEN GİRİLECEK");
            this.showNotification('Hesap bilgileri başarıyla güncellendi!', 'success');
            this.render(); // Re-render to show updates
        }
    }

    private handlePasswordChange(): void {
        const currentPassword = (this.querySelector('#current-password') as HTMLInputElement)?.value;
        const newPassword = (this.querySelector('#new-password') as HTMLInputElement)?.value;
        const confirmPassword = (this.querySelector('#confirm-password') as HTMLInputElement)?.value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Lütfen tüm şifre alanlarını doldurun!', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('Yeni şifreler eşleşmiyor!', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showNotification('Şifre en az 8 karakter olmalıdır!', 'error');
            return;
        }

        // Password validation regex
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;
        if (!passwordRegex.test(newPassword)) {
            this.showNotification('Şifre gereksinimleri karşılanmıyor!', 'error');
            return;
        }

        // Here you would make an API call to change password
        this.showNotification('Şifre başarıyla değiştirildi!', 'success');
        
        // Clear password fields
        (this.querySelector('#current-password') as HTMLInputElement).value = '';
        (this.querySelector('#new-password') as HTMLInputElement).value = '';
        (this.querySelector('#confirm-password') as HTMLInputElement).value = '';
    }

    private handle2FAToggle(enabled: boolean): void {
        if (this.currentUser) {
            this.currentUser.is_2fa_enabled = enabled ? 1 : 0; // Convert boolean to number
            setUser(this.currentUser,"Token Gİrilecek");
            
            const message = enabled ? 
                'İki faktörlü doğrulama etkinleştirildi!' : 
                'İki faktörlü doğrulama devre dışı bırakıldı!';
            this.showNotification(message, 'success');
        }
    }

    private handleThemeToggle(isDark: boolean): void {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        this.showNotification('Tema tercihi kaydedildi!', 'success');
    }

    private showNotification(message: string, type: 'success' | 'error'): void {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 transition-all duration-300 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Utility Methods
    private validateEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Public Methods
    public updateUserInfo(userInfo: Partial<User>): void {
        if (!this.currentUser) return;
        this.currentUser = { ...this.currentUser, ...userInfo };
        this.render();
    }

    public getCurrentUserInfo(): User | null {
        return this.currentUser;
    }

    private setupSidebarListener(): void {
        // State manager'dan sidebar durumunu dinle
        this.sidebarListener = (state) => {
            this.adjustMainContentMargin(state.isCollapsed);
        };
        
        sidebarStateManager.addListener(this.sidebarListener);
    }

    private adjustMainContentMargin(isCollapsed: boolean): void {
        const mainContent = this.querySelector('#settingsMainContent');
        if (mainContent) {
            // Transition sınıflarını ekle (zaten HTML'de var ama emin olmak için)
            const transitionClasses = sidebarStateManager.getTransitionClasses();
            mainContent.classList.add(...transitionClasses);
            
            if (isCollapsed) {
                // Sidebar kapalı - margin'i azalt
                mainContent.classList.remove('pl-72');
                mainContent.classList.add('pl-16');
            } else {
                // Sidebar açık - margin'i artır
                mainContent.classList.remove('pl-16');
                mainContent.classList.add('pl-72');
            }
        }
    }

    public validateForm(): boolean {
        return true;
    }
}

customElements.define('settings-component', Settings);

export default Settings;