// File: offline-license-system.js
// Konversi ke ES5 untuk kompatibilitas STB

var OfflineLicenseSystem = function() {
    // Kode lisensi valid (bisa diubah oleh admin)
    this.validLicenseKeys = {
        // Format: 'RH-MTV-XXXXXX' dengan X = alphanumeric
        // Contoh kode dengan paket tertentu
        'RH-MTV-1Q2W3E': { // Trial
            package: 'trial',
            expiryDays: 2,
            created: '2024-01-01'
        },
        'RH-MTV-4R5T6Y': { // Dasar
            package: 'basic', 
            expiryDays: 365,
            created: '2024-01-01'
        },
        'RH-MTV-7U8I9O': { // Premium
            package: 'premium',
            expiryDays: 365,
            created: '2024-01-01'
        },
        'RH-MTV-0PASD1': { // VIP
            package: 'vip',
            expiryDays: 9999, // Selamanya
            created: '2024-01-01'
        }
    };
    
    // Data paket sama seperti sebelumnya
    this.licensePackages = {
        'trial': {
            name: 'Uji Coba',
            price: 50000,
            features: {
                hiddenLogo: true,
                hiddenSlides: [2, 3, 4],
                hiddenPowerButton: true,
                hiddenVillageName: true,
                maxImages: 2,
                hiddenImsakSyuruq: true,
                maghribIsyaActiveMinutes: 15,
                hiddenSettingsButtons: ['data-masjid', 'running-text', 'slider-duration'],
                hiddenAdzanButtons: ['countdown-adzan', 'countdown-iqamah', 'overlay-duration'],
                hiddenAudio: ['shalawat', 'adzan'],
                ads: {
                    enabled: true,
                    duration: 15,
                    interval: 10,
                    overlayBehavior: 'behind'
                }
            }
        },
        'basic': {
            name: 'Dasar',
            price: 340000,
            features: {
                hiddenLogo: true,
                hiddenSlides: [2, 4],
                hiddenPowerButton: false,
                hiddenVillageName: false,
                maxImages: 2,
                hiddenImsakSyuruq: false,
                maghribIsyaActiveMinutes: 0,
                hiddenSettingsButtons: ['slider-duration'],
                hiddenAdzanButtons: ['overlay-duration'],
                hiddenAudio: ['shalawat', 'adzan'],
                ads: {
                    enabled: true,
                    duration: 5,
                    interval: 300,
                    overlayBehavior: 'behind'
                }
            }
        },
        'premium': {
            name: 'Premium',
            price: 570000,
            features: {
                hiddenLogo: false,
                hiddenSlides: [],
                hiddenPowerButton: false,
                hiddenVillageName: false,
                maxImages: 5,
                hiddenImsakSyuruq: false,
                maghribIsyaActiveMinutes: 0,
                hiddenSettingsButtons: [],
                hiddenAdzanButtons: [],
                hiddenAudio: [],
                ads: { enabled: false }
            }
        },
        'vip': {
            name: 'VIP',
            price: 1420000,
            features: {
                hiddenLogo: false,
                hiddenSlides: [],
                hiddenPowerButton: false,
                hiddenVillageName: false,
                maxImages: 7,
                hiddenImsakSyuruq: false,
                maghribIsyaActiveMinutes: 0,
                hiddenSettingsButtons: [],
                hiddenAdzanButtons: [],
                hiddenAudio: [],
                ads: { enabled: false }
            }
        }
    };
    
    this.currentLicense = null;
    this.deviceId = this.getDeviceId();
};

// ==================== INISIALISASI ====================
OfflineLicenseSystem.prototype.initialize = function() {
    console.log('Offline License System Initializing...');
    
    // 1. Tambahkan styles terlebih dahulu
    this.addStyles();
    
    // 2. Load license dari localStorage
    this.loadLicense();
    
    // 3. Validasi license
    var isValid = this.validateLicense();
    
    // 4. Tampilkan popup sesuai status
    if (!isValid) {
        this.showActivationPopup();
    } else {
        this.showLicenseInfoPopup();
        this.applyLicenseFeatures();
    }
    
    return isValid;
};

// ==================== LICENSE MANAGEMENT ====================
OfflineLicenseSystem.prototype.loadLicense = function() {
    try {
        var saved = localStorage.getItem('adzan_offline_license');
        if (saved) {
            this.currentLicense = JSON.parse(saved);
            console.log('License loaded from cache');
        }
    } catch (error) {
        console.error('Error loading license:', error);
        this.currentLicense = null;
    }
};

OfflineLicenseSystem.prototype.saveLicense = function() {
    try {
        localStorage.setItem('adzan_offline_license', JSON.stringify(this.currentLicense));
        return true;
    } catch (error) {
        console.error('Error saving license:', error);
        return false;
    }
};

OfflineLicenseSystem.prototype.validateLicense = function() {
    if (!this.currentLicense) return false;
    
    // Cek format license
    if (!this.currentLicense.key || !this.currentLicense.expiry) {
        return false;
    }
    
    // Cek apakah kode masih valid
    var licenseInfo = this.validLicenseKeys[this.currentLicense.key];
    if (!licenseInfo) {
        console.log('License key not found in valid keys');
        return false;
    }
    
    // Cek expiry date
    var now = new Date();
    var expiry = new Date(this.currentLicense.expiry);
    
    if (now > expiry) {
        console.log('License expired');
        return false;
    }
    
    return true;
};

// ==================== ACTIVATION FUNCTIONS ====================
OfflineLicenseSystem.prototype.activateLicense = function(licenseKey) {
    // Normalize license key (uppercase, remove spaces)
    licenseKey = licenseKey.toUpperCase().trim();
    
    // Validasi format
    if (!this.isValidLicenseFormat(licenseKey)) {
        return {
            success: false,
            message: 'Format kode lisensi tidak valid. Format: RH-MTV-XXXXXX'
        };
    }
    
    // Cek apakah kode valid
    var licenseInfo = this.validLicenseKeys[licenseKey];
    if (!licenseInfo) {
        return {
            success: false,
            message: 'Kode lisensi tidak ditemukan atau sudah digunakan'
        };
    }
    
    // Generate expiry date
    var startDate = new Date();
    var expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + licenseInfo.expiryDays);
    
    // Simpan license
    this.currentLicense = {
        key: licenseKey,
        package: licenseInfo.package,
        startDate: startDate.toISOString(),
        expiry: expiryDate.toISOString(),
        deviceId: this.deviceId,
        activatedAt: new Date().toISOString(),
        status: 'active'
    };
    
    // Simpan ke localStorage
    if (this.saveLicense()) {
        return {
            success: true,
            data: {
                package: licenseInfo.package,
                expiry: expiryDate.toISOString(),
                days: licenseInfo.expiryDays
            }
        };
    }
    
    return {
        success: false,
        message: 'Gagal menyimpan lisensi'
    };
};

OfflineLicenseSystem.prototype.isValidLicenseFormat = function(key) {
    // Format: RH-MTV-XXXXXX dimana X = alphanumeric
    var pattern = /^RH-MTV-[A-Z0-9]{6}$/;
    return pattern.test(key);
};

// ==================== POPUP SYSTEM ====================
OfflineLicenseSystem.prototype.showActivationPopup = function() {
    // Hapus popup lama jika ada
    this.removeExistingPopup();
    
    // Buat overlay
    var overlay = this.createOverlay();
    
    // Konten popup dengan string concatenation untuk ES5
    overlay.innerHTML = [
        '<div class="offline-license-popup">',
        '    <div class="popup-header">',
        '        <h2>AKTIVASI LISENSI OFFLINE</h2>',
        '        <p class="subtitle">Masukkan kode lisensi yang diberikan admin</p>',
        '    </div>',
        '    ',
        '    <div class="popup-body">',
        '        <div class="activation-card">',
        '            <div class="status-indicator inactive">',
        '                <div class="status-dot"></div>',
        '                <span>STATUS: BELUM AKTIF</span>',
        '            </div>',
        '            ',
        '            <div class="license-input-section">',
        '                <div class="input-group">',
        '                    <div class="input-label">',
        '                        <i class="bi bi-key-fill"></i>',
        '                        KODE LISENSI',
        '                    </div>',
        '                    <input ',
        '                        type="text" ',
        '                        id="offlineLicenseKey"',
        '                        placeholder="Contoh: RH-MTV-1Q2W3E"',
        '                        class="license-input"',
        '                        autocomplete="off"',
        '                        maxlength="14"',
        '                        autofocus',
        '                    />',
        '                    <div class="input-hint">',
        '                        Format: RH-MTV-XXXXXX (6 karakter/huruf)',
        '                    </div>',
        '                </div>',
        '                ',
        '                <div class="package-preview" id="packagePreview">',
        '                    <div class="preview-placeholder">',
        '                        <i class="bi bi-box"></i>',
        '                        <p>Paket akan terdeteksi otomatis</p>',
        '                    </div>',
        '                </div>',
        '            </div>',
        '            ',
        '            <div class="action-section">',
        '                <button id="activateOfflineBtn" class="btn-activate-large">',
        '                    <i class="bi bi-check-circle"></i>',
        '                    <span>AKTIVASI LISENSI</span>',
        '                </button>',
        '                ',
        '                <div class="divider">',
        '                    <span>ATAU</span>',
        '                </div>',
        '                ',
        '                <button id="demoModeBtn" class="btn-demo-mode">',
        '                    <i class="bi bi-play-circle"></i>',
        '                    <span>COBA DEMO (15 MENIT)</span>',
        '                </button>',
        '                ',
        '                <button id="contactAdminBtn" class="btn-contact">',
        '                    <i class="bi bi-whatsapp"></i>',
        '                    <span>HUBUNGI ADMIN</span>',
        '                </button>',
        '            </div>',
        '            ',
        '            <div class="info-section">',
        '                <div class="info-box">',
        '                    <h4><i class="bi bi-info-circle"></i> CARA MENDAPATKAN KODE:</h4>',
        '                    <ol>',
        '                        <li>Hubungi admin via WhatsApp</li>',
        '                        <li>Pilih paket yang diinginkan</li>',
        '                        <li>Lakukan pembayaran</li>',
        '                        <li>Admin akan kirim kode lisensi</li>',
        '                        <li>Masukkan kode di atas</li>',
        '                    </ol>',
        '                </div>',
        '                ',
        '                <div class="device-info">',
        '                    <p><strong>ID Perangkat Anda:</strong></p>',
        '                    <code class="device-id">' + this.deviceId + '</code>',
        '                    <button onclick="copyToClipboard(\'' + this.deviceId + '\')" class="btn-copy">',
        '                        <i class="bi bi-copy"></i> Salin ID',
        '                    </button>',
        '                </div>',
        '            </div>',
        '        </div>',
        '    </div>',
        '    ',
        '    <div class="popup-footer">',
        '        <div class="contact-details">',
        '            <p><i class="bi bi-whatsapp"></i> <strong>Admin:</strong> 089609745090</p>',
        '            <p><i class="bi bi-envelope"></i> <strong>Email:</strong> mahallahtv@gmail.com</p>',
        '        </div>',
        '        <p class="click-hint">',
        '            <i class="bi bi-mouse"></i> Klik di luar area ini untuk menutup (jika demo)',
        '        </p>',
        '    </div>',
        '</div>'
    ].join('');
    
    document.body.appendChild(overlay);
    
    // Setup event listeners
    this.setupActivationEvents(overlay);
    
    // Real-time package preview
    this.setupPackagePreview();
    
    // Gelapkan background
    this.darkenBackground();
};

OfflineLicenseSystem.prototype.showLicenseInfoPopup = function() {
    this.removeExistingPopup();
    
    var overlay = this.createOverlay();
    var packageInfo = this.licensePackages[this.currentLicense.package];
    var expiryDate = new Date(this.currentLicense.expiry);
    var daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 3600 * 24));
    
    overlay.innerHTML = [
        '<div class="offline-license-popup">',
        '    <div class="popup-header active">',
        '        <div class="header-icon">',
        '            <i class="bi bi-shield-check"></i>',
        '        </div>',
        '        <h2>LISENSI AKTIF</h2>',
        '        <p class="subtitle">' + packageInfo.name + ' - ' + daysLeft + ' hari tersisa</p>',
        '    </div>',
        '    ',
        '    <div class="popup-body">',
        '        <div class="license-details-card">',
        '            <div class="status-indicator active">',
        '                <div class="status-dot"></div>',
        '                <span>STATUS: AKTIF</span>',
        '            </div>',
        '            ',
        '            <div class="details-grid">',
        '                <div class="detail-item">',
        '                    <label><i class="bi bi-box-seam"></i> Paket</label>',
        '                    <div class="detail-value">' + packageInfo.name + '</div>',
        '                </div>',
        '                ',
        '                <div class="detail-item">',
        '                    <label><i class="bi bi-calendar-check"></i> Aktif Sejak</label>',
        '                    <div class="detail-value">' + new Date(this.currentLicense.startDate).toLocaleDateString('id-ID') + '</div>',
        '                </div>',
        '                ',
        '                <div class="detail-item">',
        '                    <label><i class="bi bi-calendar-x"></i> Berakhir</label>',
        '                    <div class="detail-value">' + expiryDate.toLocaleDateString('id-ID') + '</div>',
        '                </div>',
        '                ',
        '                <div class="detail-item">',
        '                    <label><i class="bi bi-key"></i> Kode Lisensi</label>',
        '                    <div class="detail-value license-key">' + this.currentLicense.key + '</div>',
        '                </div>',
        '            </div>',
        '            ',
        '            <div class="features-list">',
        '                <h4><i class="bi bi-stars"></i> Fitur yang Aktif:</h4>',
        '                <ul>',
        '                    <li class="' + (packageInfo.features.maxImages >= 5 ? 'feature-active' : 'feature-inactive') + '">',
        '                        <i class="bi bi-images"></i> Slide Gambar: ' + packageInfo.features.maxImages + ' gambar',
        '                    </li>',
        '                    <li class="' + (packageInfo.features.hiddenAudio.length === 0 ? 'feature-active' : 'feature-inactive') + '">',
        '                        <i class="bi bi-music-note-beamed"></i> Audio: ' + (packageInfo.features.hiddenAudio.length === 0 ? 'Lengkap' : 'Terbatas') + '',
        '                    </li>',
        '                    <li class="' + (packageInfo.features.ads.enabled ? 'feature-inactive' : 'feature-active') + '">',
        '                        <i class="bi bi-megaphone"></i> Iklan: ' + (packageInfo.features.ads.enabled ? 'Aktif' : 'Tidak ada') + '',
        '                    </li>',
        '                    <li class="' + (packageInfo.features.hiddenSettingsButtons.length === 0 ? 'feature-active' : 'feature-inactive') + '">',
        '                        <i class="bi bi-sliders"></i> Pengaturan: ' + (packageInfo.features.hiddenSettingsButtons.length === 0 ? 'Lengkap' : 'Terbatas') + '',
        '                    </li>',
        '                </ul>',
        '            </div>',
        '            ',
        '            <div class="action-buttons">',
        '                <button id="closePopupBtn" class="btn-close">',
        '                    <i class="bi bi-check-lg"></i> LANJUTKAN',
        '                </button>',
        '                <button id="upgradePopupBtn" class="btn-upgrade">',
        '                    <i class="bi bi-graph-up-arrow"></i> UPGRADE PAKET',
        '                </button>',
        '            </div>',
        '        </div>',
        '    </div>',
        '    ',
        '    <div class="popup-footer">',
        '        <p class="click-hint">',
        '            <i class="bi bi-mouse"></i> Klik di luar popup untuk menutup',
        '        </p>',
        '    </div>',
        '</div>'
    ].join('');
    
    document.body.appendChild(overlay);
    
    var self = this;
    
    // Setup event listeners
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            self.removePopup(overlay);
        }
    });
    
    var closeBtn = document.getElementById('closePopupBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            self.removePopup(overlay);
        });
    }
    
    var upgradeBtn = document.getElementById('upgradePopupBtn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', function() {
            self.showUpgradeOptions();
        });
    }
};

OfflineLicenseSystem.prototype.showExpiredPopup = function() {
    this.removeExistingPopup();
    
    var overlay = this.createOverlay();
    overlay.style.pointerEvents = 'auto'; // Tidak bisa ditutup
    
    overlay.innerHTML = [
        '<div class="offline-license-popup expired">',
        '    <div class="popup-header expired">',
        '        <div class="header-icon">',
        '            <i class="bi bi-exclamation-triangle-fill"></i>',
        '        </div>',
        '        <h2>LISENSI KADALUARSA</h2>',
        '        <p class="subtitle">Aplikasi terkunci hingga diperpanjang</p>',
        '    </div>',
        '    ',
        '    <div class="popup-body">',
        '        <div class="expired-warning-card">',
        '            <div class="warning-icon">',
        '                <i class="bi bi-lock-fill"></i>',
        '            </div>',
        '            ',
        '            <h3>MASA AKTIF TELAH BERAKHIR</h3>',
        '            ',
        '            <div class="warning-message">',
        '                <p>Aplikasi tidak dapat digunakan karena lisensi telah habis masa berlakunya.</p>',
        '                <p>Untuk melanjutkan penggunaan, silahkan perpanjang lisensi.</p>',
        '            </div>',
        '            ',
        '            <div class="reactivation-steps">',
        '                <h4><i class="bi bi-arrow-repeat"></i> LANGKAH PERPANJANGAN:</h4>',
        '                <ol>',
        '                    <li>Hubungi Admin via WhatsApp/Telepon</li>',
        '                    <li>Sebutkan ID Perangkat Anda: <code>' + this.deviceId + '</code></li>',
        '                    <li>Pilih paket perpanjangan</li>',
        '                    <li>Lakukan pembayaran</li>',
        '                    <li>Admin akan berikan kode lisensi baru</li>',
        '                    <li>Masukkan kode baru di aplikasi</li>',
        '                </ol>',
        '            </div>',
        '            ',
        '            <div class="package-options">',
        '                <h4><i class="bi bi-gift"></i> PAKET TERSEDIA:</h4>',
        '                <div class="packages">',
        '                    <div class="package-option">',
        '                        <div class="option-header">DASAR</div>',
        '                        <div class="option-price">Rp 340.000</div>',
        '                        <div class="option-duration">1 Tahun</div>',
        '                        <ul class="option-features">',
        '                            <li>2 Gambar</li>',
        '                            <li>Iklan terbatas</li>',
        '                        </ul>',
        '                    </div>',
        '                    ',
        '                    <div class="package-option featured">',
        '                        <div class="option-header">PREMIUM</div>',
        '                        <div class="option-price">Rp 570.000</div>',
        '                        <div class="option-duration">1 Tahun</div>',
        '                        <ul class="option-features">',
        '                            <li>5 Gambar</li>',
        '                            <li>Tanpa iklan</li>',
        '                            <li>Audio lengkap</li>',
        '                        </ul>',
        '                    </div>',
        '                    ',
        '                    <div class="package-option vip">',
        '                        <div class="option-header">VIP</div>',
        '                        <div class="option-price">Rp 1.420.000</div>',
        '                        <div class="option-duration">SEUMUR HIDUP</div>',
        '                        <ul class="option-features">',
        '                            <li>7 Gambar</li>',
        '                            <li>Semua fitur</li>',
        '                            <li>+ STB & Kabel HDMI</li>',
        '                        </ul>',
        '                    </div>',
        '                </div>',
        '            </div>',
        '            ',
        '            <div class="contact-actions">',
        '                <a href="https://wa.me/6289609745090?text=Halo%20Admin,%20saya%20ingin%20perpanjang%20lisensi%20Adzan%20App.%20ID%20Perangkat:%20' + encodeURIComponent(this.deviceId) + '" ',
        '                   target="_blank" class="btn-whatsapp">',
        '                    <i class="bi bi-whatsapp"></i> HUBUNGI ADMIN VIA WHATSAPP',
        '                </a>',
        '                ',
        '                <button onclick="copyToClipboard(\'' + this.deviceId + '\')" class="btn-copy-id">',
        '                    <i class="bi bi-copy"></i> SALIN ID PERANGKAT',
        '                </button>',
        '                ',
        '                <button onclick="location.reload()" class="btn-retry">',
        '                    <i class="bi bi-arrow-clockwise"></i> COBA LAGI (SETELAH DAPAT KODE BARU)',
        '                </button>',
        '            </div>',
        '        </div>',
        '    </div>',
        '    ',
        '    <div class="popup-footer">',
        '        <div class="cannot-close-warning">',
        '            <i class="bi bi-shield-exclamation"></i>',
        '            POPUP INI TIDAK DAPAT DITUTUP SAMPAI LISENSI DIPERPANJANG',
        '        </div>',
        '    </div>',
        '</div>'
    ].join('');
    
    document.body.appendChild(overlay);
    
    // Nonaktifkan semua interaksi di background
    this.disableAppInteractions();
};

// ==================== HELPER FUNCTIONS ====================
OfflineLicenseSystem.prototype.createOverlay = function() {
    var overlay = document.createElement('div');
    overlay.id = 'offlineLicenseOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.92)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.animation = 'fadeIn 0.4s ease';
    return overlay;
};

OfflineLicenseSystem.prototype.removeExistingPopup = function() {
    var existing = document.getElementById('offlineLicenseOverlay');
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }
};

OfflineLicenseSystem.prototype.setupActivationEvents = function(overlay) {
    var self = this;
    var activateBtn = overlay.querySelector('#activateOfflineBtn');
    var licenseInput = overlay.querySelector('#offlineLicenseKey');
    
    // Aktivasi saat tombol ditekan
    activateBtn.addEventListener('click', function() {
        self.processActivation(overlay, activateBtn, licenseInput);
    });
    
    // Aktivasi saat tekan Enter
    licenseInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            self.processActivation(overlay, activateBtn, licenseInput);
        }
    });
    
    // Demo mode
    overlay.querySelector('#demoModeBtn').addEventListener('click', function() {
        self.activateDemoMode();
        self.removePopup(overlay);
    });
    
    // Hubungi admin
    overlay.querySelector('#contactAdminBtn').addEventListener('click', function() {
        window.open('https://wa.me/6289609745090?text=Halo%20Admin,%20saya%20ingin%20membeli%20lisensi%20Adzan%20App.%20ID%20Perangkat:%20' + encodeURIComponent(self.deviceId), '_blank');
    });
    
    // Bisa ditutup dengan klik di luar (hanya untuk demo mode)
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            // Hanya izinkan close jika belum ada lisensi aktif
            if (!self.currentLicense || !self.validateLicense()) {
                self.removePopup(overlay);
            }
        }
    });
};

OfflineLicenseSystem.prototype.processActivation = function(overlay, activateBtn, licenseInput) {
    var self = this;
    var licenseKey = licenseInput.value.trim();
    
    if (!licenseKey) {
        this.showToast('Masukkan kode lisensi', 'error');
        licenseInput.focus();
        return;
    }
    
    // Tampilkan loading
    activateBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> MEMPROSES...';
    activateBtn.disabled = true;
    
    // Simulasi delay processing
    setTimeout(function() {
        // Aktivasi lisensi
        var result = self.activateLicense(licenseKey);
        
        if (result.success) {
            // Sukses
            self.showToast('✓ Lisensi berhasil diaktifkan!', 'success');
            
            // Update UI
            activateBtn.innerHTML = '<i class="bi bi-check-circle"></i> BERHASIL!';
            activateBtn.className = 'btn-success-large';
            
            // Tutup popup setelah 2 detik dan reload
            setTimeout(function() {
                self.removePopup(overlay);
                setTimeout(function() {
                    location.reload();
                }, 500);
            }, 2000);
            
        } else {
            // Gagal
            self.showToast(result.message, 'error');
            activateBtn.innerHTML = '<i class="bi bi-check-circle"></i> AKTIVASI LISENSI';
            activateBtn.disabled = false;
            licenseInput.focus();
        }
    }, 800);
};

OfflineLicenseSystem.prototype.setupPackagePreview = function() {
    var self = this;
    var licenseInput = document.getElementById('offlineLicenseKey');
    var packagePreview = document.getElementById('packagePreview');
    
    if (!licenseInput || !packagePreview) return;
    
    licenseInput.addEventListener('input', function(e) {
        var key = e.target.value.toUpperCase().trim();
        
        // Clear preview jika input kosong
        if (!key) {
            packagePreview.innerHTML = [
                '<div class="preview-placeholder">',
                '    <i class="bi bi-box"></i>',
                '    <p>Paket akan terdeteksi otomatis</p>',
                '</div>'
            ].join('');
            return;
        }
        
        // Cek kode di database
        var licenseInfo = self.validLicenseKeys[key];
        
        if (licenseInfo) {
            var packageData = self.licensePackages[licenseInfo.package];
            
            packagePreview.innerHTML = [
                '<div class="package-detected ' + licenseInfo.package + '">',
                '    <div class="package-icon">',
                '        <i class="bi bi-shield-check"></i>',
                '    </div>',
                '    <div class="package-info">',
                '        <h4>' + packageData.name + '</h4>',
                '        <p>' + licenseInfo.expiryDays + ' hari aktif</p>',
                '        <div class="package-features">',
                '            <span><i class="bi bi-images"></i> ' + packageData.features.maxImages + ' gambar</span>',
                '            <span><i class="bi ' + (packageData.features.hiddenAudio.length === 0 ? 'bi-check-lg' : 'bi-x-lg') + '"></i> Audio</span>',
                '            <span><i class="bi ' + (packageData.features.ads.enabled ? 'bi-x-lg' : 'bi-check-lg') + '"></i> Iklan</span>',
                '        </div>',
                '    </div>',
                '</div>'
            ].join('');
        } else {
            // Format benar tapi kode tidak ditemukan
            if (self.isValidLicenseFormat(key)) {
                packagePreview.innerHTML = [
                    '<div class="package-invalid">',
                    '    <div class="package-icon">',
                    '        <i class="bi bi-exclamation-circle"></i>',
                    '    </div>',
                    '    <div class="package-info">',
                    '        <h4>Kode Tidak Dikenali</h4>',
                    '        <p>Kode lisensi tidak ditemukan dalam database</p>',
                    '    </div>',
                '</div>'
                ].join('');
            }
        }
    });
};

OfflineLicenseSystem.prototype.activateDemoMode = function() {
    // Set demo mode 15 menit
    var startDate = new Date();
    var expiryDate = new Date();
    expiryDate.setMinutes(startDate.getMinutes() + 15);
    
    this.currentLicense = {
        key: 'DEMO-MODE',
        package: 'trial',
        startDate: startDate.toISOString(),
        expiry: expiryDate.toISOString(),
        deviceId: this.deviceId,
        activatedAt: new Date().toISOString(),
        status: 'demo'
    };
    
    this.saveLicense();
    
    // Terapkan fitur trial
    this.applyLicenseFeatures();
    
    var self = this;
    
    // Set timer untuk expired
    setTimeout(function() {
        self.showExpiredPopup();
    }, 15 * 60 * 1000);
    
    this.showToast('Mode demo aktif selama 15 menit', 'info');
};

OfflineLicenseSystem.prototype.getDeviceId = function() {
    // Generate device ID yang unik
    var deviceId = localStorage.getItem('adzan_device_id');
    if (!deviceId) {
        // Gunakan kombinasi timestamp dan random string
        var timestamp = Date.now().toString(36);
        var random = Math.random().toString(36).substr(2, 6);
        deviceId = 'DEV-' + timestamp + '-' + random;
        deviceId = deviceId.toUpperCase();
        localStorage.setItem('adzan_device_id', deviceId);
    }
    return deviceId;
};

// ==================== TOAST NOTIFICATION ====================
OfflineLicenseSystem.prototype.showToast = function(message, type) {
    // Hapus toast lama
    var oldToast = document.querySelector('.license-toast');
    if (oldToast && oldToast.parentNode) {
        oldToast.parentNode.removeChild(oldToast);
    }
    
    var toast = document.createElement('div');
    toast.className = 'license-toast toast-' + type;
    
    var icon = '';
    if (type === 'success') {
        icon = 'check-circle';
    } else if (type === 'error') {
        icon = 'exclamation-circle';
    } else {
        icon = 'info-circle';
    }
    
    toast.innerHTML = [
        '<i class="bi bi-' + icon + '"></i>',
        '<span>' + message + '</span>'
    ].join('');
    
    document.body.appendChild(toast);
    
    var selfToast = toast;
    
    // Auto remove after 4 seconds
    setTimeout(function() {
        if (selfToast.parentNode) {
            selfToast.parentNode.removeChild(selfToast);
        }
    }, 4000);
};

// ==================== UTILITY FUNCTIONS ====================
OfflineLicenseSystem.prototype.removePopup = function(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
    this.restoreBackground();
};

OfflineLicenseSystem.prototype.darkenBackground = function() {
    var elements = document.querySelectorAll('body > *:not(#offlineLicenseOverlay)');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.filter = 'brightness(0.3) blur(2px)';
        elements[i].style.pointerEvents = 'none';
    }
};

OfflineLicenseSystem.prototype.restoreBackground = function() {
    var elements = document.querySelectorAll('body > *:not(#offlineLicenseOverlay)');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.filter = '';
        elements[i].style.pointerEvents = '';
    }
};

OfflineLicenseSystem.prototype.disableAppInteractions = function() {
    // Nonaktifkan semua interaksi di background
    var elements = document.querySelectorAll('body > *:not(#offlineLicenseOverlay)');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.pointerEvents = 'none';
        elements[i].style.opacity = '0.2';
        elements[i].style.filter = 'blur(3px)';
    }
};

OfflineLicenseSystem.prototype.applyLicenseFeatures = function() {
    // Implementasi sama seperti sebelumnya
    // ... (gunakan kode dari license-manager.js)
    console.log('Applying license features for package:', this.currentLicense ? this.currentLicense.package : 'none');
};

OfflineLicenseSystem.prototype.showUpgradeOptions = function() {
    // Implementasi modal upgrade
    console.log('Show upgrade options');
    // Bisa gunakan modal Bootstrap atau custom modal
};

// ==================== STYLING ====================
OfflineLicenseSystem.prototype.addStyles = function() {
    // Cek apakah style sudah ada
    if (document.getElementById('offline-license-styles')) return;
    
    var style = document.createElement('style');
    style.id = 'offline-license-styles';
    style.textContent = `
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                transform: translateY(50px) scale(0.95); 
                opacity: 0; 
            }
            to { 
                transform: translateY(0) scale(1); 
                opacity: 1; 
            }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        /* Popup Styles */
        .offline-license-popup {
            background: linear-gradient(135deg, #0c3321 0%, #005a31 100%);
            color: white;
            border-radius: 20px;
            max-width: 800px;
            width: 100%;
            max-height: calc(100vh - 40px);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
            border: 2px solid rgba(198, 246, 213, 0.2);
            animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .offline-license-popup.expired {
            background: linear-gradient(135deg, #4a0000 0%, #8b0000 100%);
            border-color: rgba(255, 100, 100, 0.3);
        }
        
        .popup-header {
            padding: 30px;
            text-align: center;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .popup-header.active {
            background: rgba(0, 90, 49, 0.4);
        }
        
        .popup-header.expired {
            background: rgba(139, 0, 0, 0.4);
        }
        
        .header-icon {
            font-size: 60px;
            color: #c6f6d5;
            margin-bottom: 15px;
        }
        
        .popup-header.expired .header-icon {
            color: #ff9999;
        }
        
        .popup-header h2 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 800;
            color: white;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .subtitle {
            margin: 0;
            color: rgba(255, 255, 255, 0.8);
            font-size: 16px;
        }
        
        .popup-body {
            padding: 30px;

            /* ⬇️ BODY FLEXIBLE & SCROLL */
            flex: 1 1 auto;
            overflow-y: auto;

            /* Smooth scrolling di STB */
            -webkit-overflow-scrolling: touch;
        }

        .popup-header,
        .popup-footer {
            flex-shrink: 0;
        }


        
        /* Activation Card */
        .activation-card {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 20px;
            border-radius: 50px;
            background: rgba(255, 255, 255, 0.1);
            margin-bottom: 25px;
            font-weight: bold;
            font-size: 14px;
        }
        
        .status-indicator.inactive {
            color: #ff9999;
            border: 1px solid rgba(255, 100, 100, 0.3);
        }
        
        .status-indicator.active {
            color: #99ff99;
            border: 1px solid rgba(100, 255, 100, 0.3);
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
        }
        
        /* License Input */
        .license-input-section {
            margin-bottom: 30px;
        }
        
        .input-group {
            margin-bottom: 25px;
        }
        
        .input-label {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            color: #c6f6d5;
            font-weight: 600;
            font-size: 16px;
        }
        
        .license-input {
            width: 100%;
            padding: 18px 20px;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 1px;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: white;
            text-align: center;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
        }
        
        .license-input:focus {
            outline: none;
            border-color: #005a31;
            box-shadow: 0 0 0 4px rgba(0, 90, 49, 0.3);
            background: rgba(0, 0, 0, 0.4);
        }
        
        .input-hint {
            margin-top: 8px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 13px;
            text-align: center;
        }
        
        /* Package Preview */
        .package-preview {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            padding: 20px;
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .preview-placeholder {
            text-align: center;
            color: rgba(255, 255, 255, 0.5);
        }
        
        .preview-placeholder i {
            font-size: 40px;
            margin-bottom: 10px;
            display: block;
        }
        
        .package-detected {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 15px;
            background: rgba(0, 90, 49, 0.3);
            border-radius: 10px;
            border: 1px solid rgba(198, 246, 213, 0.3);
            animation: slideUp 0.3s ease;
        }
        
        .package-detected.trial {
            background: rgba(255, 193, 7, 0.1);
            border-color: rgba(255, 193, 7, 0.3);
        }
        
        .package-detected.basic {
            background: rgba(13, 110, 253, 0.1);
            border-color: rgba(13, 110, 253, 0.3);
        }
        
        .package-detected.premium {
            background: rgba(111, 66, 193, 0.1);
            border-color: rgba(111, 66, 193, 0.3);
        }
        
        .package-detected.vip {
            background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(220, 53, 69, 0.1));
            border-color: rgba(255, 193, 7, 0.3);
        }
        
        .package-icon {
            font-size: 40px;
            color: #c6f6d5;
        }
        
        .package-info h4 {
            margin: 0 0 5px 0;
            font-size: 22px;
            color: white;
        }
        
        .package-info p {
            margin: 0 0 10px 0;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .package-features {
            display: flex;
            gap: 15px;
            font-size: 14px;
        }
        
        .package-features span {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
        }
        
        /* Action Buttons */
        .action-section {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 25px 0;
        }
        
        .btn-activate-large {
            background: linear-gradient(135deg, #005a31 0%, #00816d 100%);
            color: white;
            border: none;
            padding: 20px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .btn-activate-large:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 90, 49, 0.4);
        }
        
        .btn-activate-large:active {
            transform: translateY(-1px);
        }
        
        .btn-success-large {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
        }
        
        .btn-demo-mode {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 18px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .btn-demo-mode:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .btn-contact {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            border: none;
            padding: 18px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        
        .btn-contact:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(37, 211, 102, 0.3);
        }
        
        .divider {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 10px 0;
            color: rgba(255, 255, 255, 0.5);
        }
        
        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .divider span {
            padding: 0 15px;
        }
        
        /* Info Sections */
        .info-section {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .info-box {
            background: rgba(0, 0, 0, 0.2);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .info-box h4 {
            margin-top: 0;
            color: #c6f6d5;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-box ol {
            padding-left: 20px;
            margin: 15px 0 0 0;
        }
        
        .info-box li {
            margin-bottom: 8px;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .device-info {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .device-id {
            display: block;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.5);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            color: #ffd700;
            font-size: 14px;
            word-break: break-all;
        }
        
        .btn-copy {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 15px;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }
        
        .btn-copy:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        /* Footer */
        .popup-footer {
            padding: 20px 30px;
            background: rgba(0, 0, 0, 0.4);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        }
        
        .contact-details {
            margin-bottom: 15px;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .contact-details p {
            margin: 5px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .click-hint {
            margin: 0;
            color: rgba(255, 255, 255, 0.6);
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .cannot-close-warning {
            color: #ff9999;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 10px;
            background: rgba(255, 0, 0, 0.1);
            border-radius: 5px;
            border: 1px solid rgba(255, 100, 100, 0.3);
        }
        
        /* Toast Notification */
        .license-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: bold;
            z-index: 100000;
            animation: slideUp 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .toast-success {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border-left: 4px solid #155724;
        }
        
        .toast-error {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
            border-left: 4px solid #721c24;
        }
        
        .toast-info {
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            border-left: 4px solid #0c5460;
        }
        
        /* Expired Popup Specific */
        .expired-warning-card {
            text-align: center;
        }
        
        .warning-icon {
            font-size: 70px;
            color: #ff6b6b;
            margin-bottom: 20px;
            animation: pulse 1.5s infinite;
        }
        
        .warning-message {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #ff6b6b;
        }
        
        .warning-message p {
            margin: 10px 0;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .reactivation-steps {
            text-align: left;
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .reactivation-steps h4 {
            color: #ffd700;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .reactivation-steps ol {
            padding-left: 25px;
            margin: 15px 0 0 0;
        }
        
        .reactivation-steps li {
            margin-bottom: 10px;
            color: rgba(255, 255, 255, 0.9);
            padding-left: 5px;
        }
        
        .reactivation-steps code {
            background: rgba(255, 215, 0, 0.1);
            color: #ffd700;
            padding: 2px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        
        /* Package Options in Expired Popup */
        .packages {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .package-option {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            border: 2px solid transparent;
            transition: all 0.3s;
        }
        
        .package-option.featured {
            background: rgba(255, 215, 0, 0.1);
            border-color: #ffd700;
            transform: scale(1.05);
        }
        
        .package-option.vip {
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(139, 0, 0, 0.1));
            border-color: #ffd700;
        }
        
        .option-header {
            font-size: 18px;
            font-weight: bold;
            color: white;
            margin-bottom: 10px;
        }
        
        .option-price {
            font-size: 24px;
            font-weight: bold;
            color: #ffd700;
            margin-bottom: 5px;
        }
        
        .option-duration {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .option-features {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .option-features li {
            margin: 5px 0;
            padding: 3px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Contact Actions */
        .contact-actions {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 30px;
        }
        
        .btn-whatsapp {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            text-decoration: none;
            padding: 20px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.3s;
        }
        
        .btn-whatsapp:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(37, 211, 102, 0.4);
        }
        
        .btn-copy-id {
            background: rgba(255, 255, 255, 0.1);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 18px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.3s;
        }
        
        .btn-copy-id:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .btn-retry {
            background: rgba(13, 110, 253, 0.2);
            color: white;
            border: 2px solid rgba(13, 110, 253, 0.5);
            padding: 18px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            transition: all 0.3s;
        }
        
        .btn-retry:hover {
            background: rgba(13, 110, 253, 0.3);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .offline-license-popup {
                max-width: 95%;
            }
            
            .popup-body {
                padding: 20px;
            }
            
            .popup-header {
                padding: 20px;
            }
            
            .popup-header h2 {
                font-size: 22px;
            }
            
            .license-input {
                font-size: 18px;
                padding: 15px;
            }
            
            .packages {
                grid-template-columns: 1fr;
            }
            
            .package-option.featured {
                transform: none;
            }
            
            .btn-activate-large,
            .btn-demo-mode,
            .btn-contact {
                font-size: 16px;
                padding: 16px;
            }
        }
        
        @media (max-width: 480px) {
            .popup-body {
                padding: 15px;
            }
            
            .activation-card {
                padding: 20px;
            }
            
            .popup-header h2 {
                font-size: 20px;
            }
            
            .header-icon {
                font-size: 50px;
            }
        }
    `;
    
    document.head.appendChild(style);
};

// ==================== GLOBAL FUNCTIONS ====================
function copyToClipboard(text) {
    // Fallback untuk browser lama
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        var successful = document.execCommand('copy');
        if (successful) {
            showGlobalToast('✓ ID disalin ke clipboard', 'success');
        } else {
            showGlobalToast('Gagal menyalin', 'error');
        }
    } catch (err) {
        console.error('Copy failed:', err);
        showGlobalToast('Gagal menyalin', 'error');
    }
    
    document.body.removeChild(textArea);
}

function showGlobalToast(message, type) {
    var toast = document.createElement('div');
    
    var backgroundColor = '#17a2b8'; // default info
    if (type === 'success') backgroundColor = '#28a745';
    else if (type === 'error') backgroundColor = '#dc3545';
    
    toast.style.cssText = [
        'position: fixed;',
        'top: 20px;',
        'right: 20px;',
        'padding: 15px 25px;',
        'background: ' + backgroundColor + ';',
        'color: white;',
        'border-radius: 8px;',
        'z-index: 100001;',
        'animation: slideUp 0.3s ease;',
        'box-shadow: 0 5px 15px rgba(0,0,0,0.3);',
        'font-weight: bold;'
    ].join('');
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// ==================== INITIALIZE ====================
window.offlineLicense = new OfflineLicenseSystem();

// Tunggu sampai DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Tunggu sebentar sebelum inisialisasi
        setTimeout(function() {
            window.offlineLicense.initialize();
        }, 1000);
    });
} else {
    // DOM sudah siap
    setTimeout(function() {
        window.offlineLicense.initialize();
    }, 1000);
}

// Export untuk penggunaan global
if (typeof window !== 'undefined') {
    window.OfflineLicenseSystem = OfflineLicenseSystem;
    window.copyToClipboard = copyToClipboard;
}