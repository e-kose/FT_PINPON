/**
 * SidebarStateManager - Sidebar durumunu merkezi olarak yöneten sınıf
 * Tüm componentler bu sınıfı kullanarak sidebar durumunu dinleyebilir
 */

export interface SidebarState {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    sidebarWidth: number;
}

export type SidebarStateListener = (state: SidebarState) => void;

class SidebarStateManager {
    private state: SidebarState;
    private listeners: Set<SidebarStateListener> = new Set();

    constructor() {
        // localStorage'dan önceki state'i oku, yoksa default olarak açık
        const savedState = localStorage.getItem('sidebar-state');
        const isCollapsed = savedState ? JSON.parse(savedState) : false; // Default: açık
        
        this.state = {
            isCollapsed,
            isMobileOpen: false,
            sidebarWidth: isCollapsed ? 64 : 288
        };
    }

    /**
     * Sidebar durumunu günceller ve tüm dinleyicileri bilgilendirir
     */
    public updateState(isCollapsed: boolean): void {
        this.state = {
            ...this.state,
            isCollapsed,
            sidebarWidth: isCollapsed ? 64 : 288 // w-16 : w-72
        };

        // localStorage'a kaydet
        localStorage.setItem('sidebar-state', JSON.stringify(isCollapsed));

        // Tüm dinleyicileri bilgilendir
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                console.error('Sidebar state listener error:', error);
            }
        });

        // Custom event de dispatch et (legacy support için)
        const event = new CustomEvent('sidebar-state-changed', {
            detail: this.state
        });
        document.dispatchEvent(event);
    }

    /**
     * Mevcut sidebar durumunu döndürür
     */
    public getState(): SidebarState {
        return { ...this.state };
    }

    /**
     * Mobil drawer durumunu ayarlar
     */
    public setMobileOpen(isMobileOpen: boolean): void {
        if (this.state.isMobileOpen === isMobileOpen) return;
        this.state = {
            ...this.state,
            isMobileOpen
        };

        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                console.error('Sidebar state listener error:', error);
            }
        });

        const event = new CustomEvent('sidebar-state-changed', {
            detail: this.state
        });
        document.dispatchEvent(event);
    }

    /**
     * Mobil drawer'ı toggle eder
     */
    public toggleMobile(): void {
        this.setMobileOpen(!this.state.isMobileOpen);
    }

    /**
     * Mobil drawer'ı kapatır
     */
    public closeMobile(): void {
        this.setMobileOpen(false);
    }

    /**
     * Sidebar durumu değiştiğinde çağrılacak listener ekler
     */
    public addListener(listener: SidebarStateListener): void {
        this.listeners.add(listener);
        
        // Yeni listener'a mevcut durumu hemen bildir
        listener(this.state);
    }

    /**
     * Listener'ı kaldırır
     */
    public removeListener(listener: SidebarStateListener): void {
        this.listeners.delete(listener);
    }

    /**
     * Tüm listener'ları temizler
     */
    public clearListeners(): void {
        this.listeners.clear();
    }

    /**
     * Sidebar'ı toggle eder
     */
    public toggle(): void {
        this.updateState(!this.state.isCollapsed);
    }

    /**
     * Sidebar'ı açar
     */
    public expand(): void {
        if (this.state.isCollapsed) {
            this.updateState(false);
        }
    }

    /**
     * Sidebar'ı kapatır
     */
    public collapse(): void {
        if (!this.state.isCollapsed) {
            this.updateState(true);
        }
    }

    /**
     * Component için Tailwind CSS sınıflarını döndürür
     */
    public getMarginClass(): string {
        return this.state.isCollapsed ? 'ml-0 md:ml-16' : 'ml-0 md:ml-72';
    }

    /**
     * Component için transition sınıflarını döndürür
     */
    public getTransitionClasses(): string[] {
        return ['transition-all', 'duration-300', 'ease-out'];
    }
}

// Singleton instance
export const sidebarStateManager = new SidebarStateManager();
