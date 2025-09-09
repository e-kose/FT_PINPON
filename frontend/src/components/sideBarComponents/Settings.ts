import "../Header";
import "../SideBar";

interface UserLogin {
    email?: string;
    username?: string;
    password: string;
}

class Settings extends HTMLElement {
    private currentUser: UserLogin = {
        email: "user@example.com",
        username: "playerone",
        password: ""
    };

    constructor() {
        super();
        this.render();
    }

    connectedCallback(): void {
        this.setupEvents();
    }

    disconnectedCallback(): void {
        // Event cleanup
    }

    private render(): void {
        this.innerHTML = `
            <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
                <!-- Header Component -->
                <header-component></header-component>
                
                <div class="pt-20">
                    <!-- Sidebar Component -->
                    <sidebar-component current-route="settings"></sidebar-component>
                    
                    <!-- Main Content -->
                    <div class="pl-16">
                <div class="max-w-6xl mx-auto p-6">
                    <!-- Header -->
                    <div class="mb-8">
                        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                            <span class="mr-4 text-4xl">⚙️</span>
                            Settings
                        </h1>
                        <p class="text-gray-600 dark:text-gray-400 ml-16">Manage your account and preferences</p>
                    </div>

                    <!-- Profile Section -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <span class="text-2xl mr-3">👤</span>
                            Profile Information
                        </h2>

                        <!-- Avatar Upload -->
                        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                            <div class="relative group">
                                <div class="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-400 dark:to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                                    ${this.getInitials()}
                                </div>
                                <div class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer" id="avatar-overlay">
                                    <span class="text-white text-sm font-medium">Change</span>
                                </div>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Profile Picture</h3>
                                <p class="text-gray-600 dark:text-gray-400 text-sm mb-3">Upload a new avatar to personalize your profile</p>
                                <input type="file" id="avatar-input" accept="image/*" class="hidden">
                                <button id="upload-avatar-btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                                    Upload New Avatar
                                </button>
                            </div>
                        </div>

                    </div>

                    <!-- Account Information Section -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <span class="text-2xl mr-3">📝</span>
                            Account Information
                        </h2>

                        <!-- Username Section -->
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 mb-6 border-2 border-blue-200 dark:border-gray-500">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                    <span class="mr-2">👤</span>
                                    Username
                                </h3>
                                <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                                    Current: ${this.currentUser.username || 'Not Set'}
                                </span>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-4">
                                <div class="flex-1">
                                    <input 
                                        type="text" 
                                        id="username" 
                                        value="${this.currentUser.username || ''}" 
                                        class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 shadow-md"
                                        placeholder="Enter new username"
                                    >
                                </div>
                                <button id="save-username-btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center">
                                    <span class="mr-2">💾</span>
                                    Save Username
                                </button>
                            </div>
                        </div>

                        <!-- Email Section -->
                        <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border-2 border-green-200 dark:border-gray-500">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                    <span class="mr-2">📧</span>
                                    Email Address
                                </h3>
                                <span class="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                                    Current: ${this.currentUser.email || 'Not Set'}
                                </span>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-4">
                                <div class="flex-1">
                                    <input 
                                        type="email" 
                                        id="email" 
                                        value="${this.currentUser.email || ''}" 
                                        class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-green-400 dark:hover:border-green-500 shadow-md"
                                        placeholder="Enter new email address"
                                    >
                                </div>
                                <button id="save-email-btn" class="px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center">
                                    <span class="mr-2">📨</span>
                                    Save Email
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Security Section -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <span class="text-2xl mr-3">🔒</span>
                            Security
                        </h2>

                        <!-- Change Password -->
                        <div class="space-y-4">
                            <div>
                                <label for="current-password" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Current Password
                                </label>
                                <input 
                                    type="password" 
                                    id="current-password" 
                                    class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                                    placeholder="Enter current password"
                                >
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="new-password" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <input 
                                        type="password" 
                                        id="new-password" 
                                        class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                                        placeholder="Enter new password"
                                    >
                                </div>

                                <div>
                                    <label for="confirm-password" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <input 
                                        type="password" 
                                        id="confirm-password" 
                                        class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                                        placeholder="Confirm new password"
                                    >
                                </div>
                            </div>

                            <button id="change-password-btn" class="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white rounded-xl font-bold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                                Update Password
                            </button>
                        </div>
                    </div>

                    <!-- Game Preferences -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <span class="text-2xl mr-3">🎮</span>
                            Game Preferences
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Sound Settings -->
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                                <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                    <span class="mr-2">🔊</span>
                                    Sound Settings
                                </h3>
                                <div class="space-y-3">
                                    <label class="flex items-center cursor-pointer hover:bg-white dark:hover:bg-gray-600 p-2 rounded-lg transition-all duration-200">
                                        <input type="checkbox" id="sound-effects" checked class="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200">
                                        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Sound Effects</span>
                                    </label>
                                    <label class="flex items-center cursor-pointer hover:bg-white dark:hover:bg-gray-600 p-2 rounded-lg transition-all duration-200">
                                        <input type="checkbox" id="background-music" checked class="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200">
                                        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Background Music</span>
                                    </label>
                                </div>
                            </div>

                            <!-- Display Settings -->
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                                <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                    <span class="mr-2">🖥️</span>
                                    Display Settings
                                </h3>
                                <div class="space-y-3">
                                    <label class="flex items-center cursor-pointer hover:bg-white dark:hover:bg-gray-600 p-2 rounded-lg transition-all duration-200">
                                        <input type="checkbox" id="dark-mode" class="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200">
                                        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
                                    </label>
                                    <label class="flex items-center cursor-pointer hover:bg-white dark:hover:bg-gray-600 p-2 rounded-lg transition-all duration-200">
                                        <input type="checkbox" id="animations" checked class="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200">
                                        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Animations</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Privacy Settings -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                            <span class="text-2xl mr-3">🔐</span>
                            Privacy Settings
                        </h2>

                        <div class="space-y-4">
                            <label class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500">
                                <div>
                                    <span class="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                                        <span class="mr-2">👁️</span>
                                        Show Online Status
                                    </span>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Let other players see when you're online</p>
                                </div>
                                <input type="checkbox" id="show-online-status" checked class="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200">
                            </label>

                            <label class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500">
                                <div>
                                    <span class="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                                        <span class="mr-2">👥</span>
                                        Allow Friend Requests
                                    </span>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Allow other players to send you friend requests</p>
                                </div>
                                <input type="checkbox" id="allow-friend-requests" checked class="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200">
                            </label>

                            <label class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-500">
                                <div>
                                    <span class="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                                        <span class="mr-2">📊</span>
                                        Show Game Stats
                                    </span>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Display your game statistics on your profile</p>
                                </div>
                                <input type="checkbox" id="show-game-stats" checked class="w-5 h-5 text-blue-600 bg-gray-100 border-2 border-gray-300 rounded-lg focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200">
                            </label>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        `;
    }

    private setupEvents(): void {
        // Avatar upload button
        const uploadBtn = this.querySelector('#upload-avatar-btn');
        const avatarInput = this.querySelector('#avatar-input') as HTMLInputElement;
        const avatarOverlay = this.querySelector('#avatar-overlay');

        uploadBtn?.addEventListener('click', () => {
            avatarInput?.click();
        });

        avatarOverlay?.addEventListener('click', () => {
            avatarInput?.click();
        });

        avatarInput?.addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });

        // Save username button
        const saveUsernameBtn = this.querySelector('#save-username-btn');
        saveUsernameBtn?.addEventListener('click', () => {
            this.handleSaveUsername();
        });

        // Save email button
        const saveEmailBtn = this.querySelector('#save-email-btn');
        saveEmailBtn?.addEventListener('click', () => {
            this.handleSaveEmail();
        });

        // Save settings button
        const saveBtn = this.querySelector('#save-settings-btn');
        saveBtn?.addEventListener('click', () => {
            this.handleSaveSettings();
        });

        // Change password button
        const changePasswordBtn = this.querySelector('#change-password-btn');
        changePasswordBtn?.addEventListener('click', () => {
            this.handleChangePassword();
        });

        // Reset settings button
        const resetBtn = this.querySelector('#reset-settings-btn');
        resetBtn?.addEventListener('click', () => {
            this.handleResetSettings();
        });

        // Dark mode toggle
        const darkModeToggle = this.querySelector('#dark-mode') as HTMLInputElement;
        darkModeToggle?.addEventListener('change', (e) => {
            this.handleDarkModeToggle((e.target as HTMLInputElement).checked);
        });
    }

    private getInitials(): string {
        const username = this.currentUser.username || 'U';
        return username.charAt(0).toUpperCase();
    }

    // Event Handler Methods - İşlevler size bırakıldı
    private handleAvatarUpload(event: Event): void {
        // TODO: Avatar upload işlevi buraya eklenecek
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            // Avatar upload logic here
            console.log('Avatar upload:', file);
        }
    }

    private handleSaveUsername(): void {
        // TODO: Username kaydetme işlevi buraya eklenecek
        const username = (this.querySelector('#username') as HTMLInputElement)?.value;
        
        if (username && username !== this.currentUser.username) {
            console.log('Save username:', username);
            // API call to save username
            this.currentUser.username = username;
            this.render(); // Re-render to show updated current username
        } else {
            console.error('Invalid username');
        }
    }

    private handleSaveEmail(): void {
        // TODO: Email kaydetme işlevi buraya eklenecek
        const email = (this.querySelector('#email') as HTMLInputElement)?.value;
        
        if (email && email !== this.currentUser.email && this.validateEmail(email)) {
            console.log('Save email:', email);
            // API call to save email
            console.log('Email updated successfully!');
            this.currentUser.email = email;
            this.render(); // Re-render to show updated current email
        } else {
            console.error('Invalid email');
        }
    }

    private handleSaveSettings(): void {
        // TODO: General settings kaydetme işlevi buraya eklenecek
        console.log('Save general settings');
        // API call to save general settings (preferences, privacy, etc.)
        console.log('Settings saved successfully!');
    }

    private handleChangePassword(): void {
        // TODO: Şifre değiştirme işlevi buraya eklenecek
        const currentPassword = (this.querySelector('#current-password') as HTMLInputElement)?.value;
        const newPassword = (this.querySelector('#new-password') as HTMLInputElement)?.value;
        const confirmPassword = (this.querySelector('#confirm-password') as HTMLInputElement)?.value;
        
        console.log('Change password:', { currentPassword, newPassword, confirmPassword });
        // Validate and change password
    }

    private handleResetSettings(): void {
        // TODO: Ayarları sıfırlama işlevi buraya eklenecek
        console.log('Reset settings');
        // Reset all settings to default
    }

    private handleDarkModeToggle(enabled: boolean): void {
        // TODO: Dark mode toggle işlevi buraya eklenecek
        console.log('Dark mode:', enabled);
        // Toggle dark mode
    }

    // Public Methods - İşlevler size bırakıldı
    public updateUserInfo(userInfo: Partial<UserLogin>): void {
        // TODO: Kullanıcı bilgilerini güncelleme
        this.currentUser = { ...this.currentUser, ...userInfo };
        this.render();
    }

    public getCurrentUserInfo(): UserLogin {
        // TODO: Mevcut kullanıcı bilgilerini döndürme
        return this.currentUser;
    }

    public validateForm(): boolean {
        // TODO: Form validasyonu
        return true;
    }

    private validateEmail(email: string): boolean {
        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    

}

customElements.define("settings-component", Settings);