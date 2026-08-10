/**
 * KHOEM_AI 3.0 - Accessibility Frontend Client
 */

class AccessibilityClient {
    constructor() {
        this.initListeners();
    }

    // ទាញយកការកំណត់ពី Server ពេលបើកកម្មវិធី
    async fetchSettings() {
        try {
            const response = await fetch('/api/accessibility');
            const result = await response.json();
            if (result.status === 'success') {
                this.applySettings(result.data);
            }
        } catch (error) {
            console.warn('API unavailable, loading from local storage...', error);
            const localData = localStorage.getItem('khoem_ai_accessibility');
            if (localData) {
                this.applySettings(JSON.parse(localData));
            }
        }
    }

    // ផ្ញើការកំណត់ថ្មីទៅកាន់ Server
    async updateSettings(settingsData) {
        try {
            const response = await fetch('/api/accessibility', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsData)
            });
            const result = await response.json();
            if (result.status === 'success') {
                this.applySettings(result.data);
            }
        } catch (error) {
            console.error('Failed to sync settings with server:', error);
            // Fallback: រក្សាទុកក្នុង LocalStorage ធានាថា UI មិនខូច
            localStorage.setItem('khoem_ai_accessibility', JSON.stringify(settingsData));
        }
    }

    //អនុវត្តការកំណត់ទៅលើ UI ផ្ទាល់
    applySettings(data) {
        if (!data) return;

        // Vision Settings
        if (data.vision) {
            const { zoom, rotation, dark_mode, white_mode, high_contrast, large_text } = data.vision;
            
            // Zoom & Rotation
            document.body.style.zoom = `${zoom}%`;
            document.body.style.transform = `rotate(${rotation}deg)`;

            // Themes
            if (dark_mode) {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('white-theme');
            } else if (white_mode) {
                document.body.classList.add('white-theme');
                document.body.classList.remove('dark-theme');
            }

            // High Contrast & Large Text
            document.body.classList.toggle('high-contrast', high_contrast);
            document.body.classList.toggle('large-text', large_text);
        }
    }

    // កំណត់ព្រឹត្តិការណ៍ស្តាប់ការចុចប៊ូតុងផ្សេងៗ
    initListeners() {
        window.addEventListener('DOMContentLoaded', () => {
            this.fetchSettings();
        });
    }
}

// ដំណើរការ Client
const accessibilityClient = new AccessibilityClient();
                                
