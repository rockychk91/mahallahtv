// File: offline-license-system-unified-fixed.js
// SISTEM LISENSI OFFLINE UNIFIED - Versi ES5 untuk STB Indihome
// DENGAN FUNGSI UPGRADE LENGKAP - FIXED STYLE VERSION

var OfflineLicenseSystem = function() {
    // Kode lisensi valid (bisa diubah oleh admin)
    this.validLicenseKeys = {
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
            expiryDays: 9999,
            created: '2024-01-01'
        },
        'RH-MTV-VIP001': { // Kode khusus untuk user DEV-MJAH2YDI-GWZ450
            package: 'vip',
            expiryDays: 9999,
            created: '2025-12-18'
        },
        'RH-MTV-BAS001': { // Kode contoh untuk paket dasar
            package: 'basic',
            expiryDays: 365,
            created: '2025-12-18'
        },
        'RH-MTV-PRE001': { // Kode contoh untuk paket premium
            package: 'premium',
            expiryDays: 365,
            created: '2025-12-18'
        }
    };
    
    // Data paket dengan fitur
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
    this.adsTimer = null;
    this.isShowingAds = false;
    
    // Default gambar iklan
    this.adImages = [
        'ads/ad1.jpg',
        'ads/ad2.jpg',
        'ads/ad3.jpg'
    ];
};

// ==================== INISIALISASI ====================
OfflineLicenseSystem.prototype.initialize = function() {
    console.log('Sistem Lisensi Offline - Inisialisasi...');
    
    // 1. Tambahkan styles
    this.addStyles();
    
    // 2. Load license
    this.loadLicense();
    
    // 3. Validasi license
    var isValid = this.validateLicense();
    
    // 4. Tampilkan popup sesuai status
    if (!isValid) {
        this.showActivationPopup();
    } else {
        // Terapkan fitur lisensi
        this.applyLicenseFeatures();
        
        // Tampilkan info lisensi singkat (bukan popup besar)
        this.showBriefLicenseInfo();
    }
    
    // 5. Setup iklan jika diperlukan
    this.setupAds();
    
    return isValid;
};

// ==================== LICENSE MANAGEMENT ====================
OfflineLicenseSystem.prototype.loadLicense = function() {
    try {
        var saved = localStorage.getItem('adzan_offline_license');
        if (saved) {
            this.currentLicense = JSON.parse(saved);
            console.log('Lisensi ditemukan:', this.currentLicense.package);
        }
    } catch (error) {
        console.error('Error loading license:', error);
        this.currentLicense = null;
    }
};

OfflineLicenseSystem.prototype.saveLicense = function() {
    try {
        localStorage.setItem('adzan_offline_license', JSON.stringify(this.currentLicense));
        
        // Juga simpan di key lama untuk kompatibilitas
        localStorage.setItem('adzanAppLicense', JSON.stringify({
            package: this.currentLicense.package,
            startDate: this.currentLicense.startDate,
            endDate: this.currentLicense.expiry,
            paymentStatus: this.currentLicense.status === 'active' ? 'paid' : 'pending'
        }));
        
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
        // Tampilkan popup expired
        this.showExpiredPopup();
        return false;
    }
    
    return true;
};

// ==================== FUNGSI BARU: KELUAR DARI LISENSI ====================
OfflineLicenseSystem.prototype.deactivateLicense = function() {
    if (confirm('Apakah Anda yakin ingin keluar dari lisensi saat ini? Semua data lisensi akan dihapus.')) {
        // Hapus lisensi dari localStorage
        localStorage.removeItem('adzan_offline_license');
        localStorage.removeItem('adzanAppLicense');
        
        // Reset current license
        this.currentLicense = null;
        
        // Hentikan iklan jika berjalan
        if (this.adsTimer) {
            clearInterval(this.adsTimer);
            this.adsTimer = null;
        }
        
        // Tampilkan toast
        this.showToast('Lisensi berhasil dihapus. Silahkan aktivasi lisensi baru.', 'info');
        
        // Tampilkan popup aktivasi setelah 1 detik
        var self = this;
        setTimeout(function() {
            self.showActivationPopup();
        }, 1000);
        
        return true;
    }
    return false;
};

// ==================== FUNGSI BARU: CEK STATUS UPGRADE ====================
OfflineLicenseSystem.prototype.checkUpgradeEligibility = function() {
    if (!this.currentLicense) return false;
    
    var currentPackage = this.currentLicense.package;
    var packagesOrder = ['trial', 'basic', 'premium', 'vip'];
    var currentIndex = packagesOrder.indexOf(currentPackage);
    
    // Jika sudah VIP, tidak bisa upgrade
    if (currentIndex >= 3) {
        return {
            eligible: false,
            message: 'Anda sudah memiliki paket tertinggi (VIP)'
        };
    }
    
    // Hitung berapa hari tersisa
    var expiryDate = new Date(this.currentLicense.expiry);
    var now = new Date();
    var daysLeft = Math.ceil((expiryDate - now) / (1000 * 3600 * 24));
    
    // Jika masa aktif kurang dari 30 hari, beri rekomendasi upgrade
    var recommendation = '';
    if (daysLeft < 30) {
        recommendation = 'Masa aktif tersisa ' + daysLeft + ' hari. Disarankan untuk upgrade.';
    }
    
    return {
        eligible: true,
        currentPackage: currentPackage,
        nextPackage: packagesOrder[currentIndex + 1],
        daysLeft: daysLeft,
        recommendation: recommendation
    };
};

// ==================== FUNGSI BARU: HITUNG HARGA UPGRADE ====================
OfflineLicenseSystem.prototype.calculateUpgradePrice = function(targetPackage) {
    if (!this.currentLicense) return this.licensePackages[targetPackage].price;
    
    var currentPackage = this.currentLicense.package;
    var currentPrice = this.licensePackages[currentPackage].price;
    var targetPrice = this.licensePackages[targetPackage].price;
    
    // Jika upgrade dari trial ke paket berbayar, harga full
    if (currentPackage === 'trial') {
        return targetPrice;
    }
    
    // Hitung sisa nilai paket saat ini (prorata)
    var expiryDate = new Date(this.currentLicense.expiry);
    var startDate = new Date(this.currentLicense.startDate);
    var now = new Date();
    
    var totalDays = Math.ceil((expiryDate - startDate) / (1000 * 3600 * 24));
    var daysUsed = Math.ceil((now - startDate) / (1000 * 3600 * 24));
    var remainingValue = currentPrice * ((totalDays - daysUsed) / totalDays);
    
    // Harga upgrade = harga target - nilai sisa paket saat ini
    var upgradePrice = targetPrice - remainingValue;
    
    // Minimum harga upgrade
    if (upgradePrice < (targetPrice * 0.5)) {
        upgradePrice = targetPrice * 0.5; // Minimum 50% dari harga paket baru
    }
    
    return Math.round(upgradePrice);
};

// ==================== FUNGSI BARU: GENERATE KODE LISENSI (untuk admin) ====================
OfflineLicenseSystem.prototype.generateLicenseCode = function(packageType, deviceId, customerName) {
    // Generate random code 6 karakter
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = '';
    for (var i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    var licenseCode = 'RH-MTV-' + result;
    
    // Simpan data lisensi yang digenerate (untuk simulasi)
    var licenseData = {
        code: licenseCode,
        package: packageType,
        deviceId: deviceId,
        customerName: customerName,
        generatedAt: new Date().toISOString(),
        status: 'pending' // pending, active, used
    };
    
    // Simpan ke localStorage sementara (dalam real implementation, ini dikirim ke server)
    var generatedLicenses = JSON.parse(localStorage.getItem('generated_licenses') || '[]');
    generatedLicenses.push(licenseData);
    localStorage.setItem('generated_licenses', JSON.stringify(generatedLicenses));
    
    return licenseCode;
};

// ==================== FUNGSI BARU: PANEL ADMIN ====================
OfflineLicenseSystem.prototype.showAdminPanel = function(password) {
    // Password sederhana untuk akses admin
    if (password !== 'admin123') {
        this.showToast('Password admin salah!', 'error');
        return;
    }
    
    this.removeExistingPopup();
    
    var overlay = this.createOverlay();
    
    // Ambil data lisensi yang sudah digenerate
    var generatedLicenses = JSON.parse(localStorage.getItem('generated_licenses') || '[]');
    
    overlay.innerHTML = [
        '<div class="offline-license-popup admin">',
        '    <div class="popup-header">',
        '        <div class="header-icon">',
        '            <i class="bi bi-person-badge"></i>',
        '        </div>',
        '        <h2>PANEL ADMIN LISENSI</h2>',
        '        <p class="subtitle">Generate dan Kelola Kode Lisensi</p>',
        '    </div>',
        '    ',
        '    <div class="popup-body">',
        '        <div class="admin-panel">',
        '            <div class="admin-section">',
        '                <h4><i class="bi bi-plus-circle"></i> Generate Kode Baru</h4>',
        '                <div class="admin-form">',
        '                    <div class="form-group">',
        '                        <label><i class="bi bi-box"></i> Pilih Paket</label>',
        '                        <select id="adminPackageSelect" class="admin-select">',
        '                            <option value="trial">Uji Coba (2 hari)</option>',
        '                            <option value="basic">Dasar (1 tahun)</option>',
        '                            <option value="premium">Premium (1 tahun)</option>',
        '                            <option value="vip">VIP (Seumur Hidup)</option>',
        '                        </select>',
        '                    </div>',
        '                    ',
        '                    <div class="form-group">',
        '                        <label><i class="bi bi-laptop"></i> ID Perangkat (Opsional)</label>',
        '                        <input type="text" id="adminDeviceId" class="admin-input" placeholder="Contoh: DEV-MJAH2YDI-GWZ450">',
        '                    </div>',
        '                    ',
        '                    <div class="form-group">',
        '                        <label><i class="bi bi-person"></i> Nama Customer</label>',
        '                        <input type="text" id="adminCustomerName" class="admin-input" placeholder="Nama customer">',
        '                    </div>',
        '                    ',
        '                    <button id="generateLicenseBtn" class="btn-admin-generate">',
        '                        <i class="bi bi-magic"></i> GENERATE KODE LISENSI',
        '                    </button>',
        '                </div>',
        '            </div>',
        '            ',
        '            <div class="admin-section">',
        '                <h4><i class="bi bi-list-check"></i> Kode yang Telah Digenerate</h4>',
        '                <div class="license-list">',
        (generatedLicenses.length > 0 ? 
            '<table class="admin-table">' +
            '    <thead>' +
            '        <tr>' +
            '            <th>Kode</th>' +
            '            <th>Paket</th>' +
            '            <th>Customer</th>' +
            '            <th>Tanggal</th>' +
            '            <th>Status</th>' +
            '        </tr>' +
            '    </thead>' +
            '    <tbody>' +
            generatedLicenses.map(function(license) {
                return '<tr>' +
                       '    <td><code>' + license.code + '</code></td>' +
                       '    <td>' + (license.package || 'N/A') + '</td>' +
                       '    <td>' + (license.customerName || 'N/A') + '</td>' +
                       '    <td>' + new Date(license.generatedAt).toLocaleDateString('id-ID') + '</td>' +
                       '    <td><span class="status-badge ' + license.status + '">' + license.status.toUpperCase() + '</span></td>' +
                       '</tr>';
            }).join('') +
            '    </tbody>' +
            '</table>' : 
            '<div class="empty-state">' +
            '    <i class="bi bi-inbox"></i>' +
            '    <p>Belum ada kode lisensi yang digenerate</p>' +
            '</div>'),
        '                </div>',
        '                <div class="admin-actions">',
        '                    <button id="exportLicensesBtn" class="btn-admin-secondary">',
        '                        <i class="bi bi-download"></i> Export ke CSV',
        '                    </button>',
        '                    <button id="clearLicensesBtn" class="btn-admin-danger">',
        '                        <i class="bi bi-trash"></i> Hapus Semua',
        '                    </button>',
        '                </div>',
        '            </div>',
        '            ',
        '            <div class="admin-section">',
        '                <h4><i class="bi bi-gear"></i> Pengaturan Sistem</h4>',
        '                <div class="system-settings">',
        '                    <div class="setting-item">',
        '                        <label><i class="bi bi-shield-check"></i> Valid License Keys</label>',
        '                        <div class="setting-value">' + Object.keys(this.validLicenseKeys).length + ' kode aktif</div>',
        '                    </div>',
        '                    ',
        '                    <div class="setting-item">',
        '                        <label><i class="bi bi-device-ssd"></i> Device ID Aktif</label>',
        '                        <div class="setting-value">' + this.deviceId + '</div>',
        '                    </div>',
        '                    ',
        '                    <div class="setting-item">',
        '                        <label><i class="bi bi-clock-history"></i> Lisensi Saat Ini</label>',
        '                        <div class="setting-value">' + (this.currentLicense ? this.currentLicense.package : 'Tidak ada') + '</div>',
        '                    </div>',
        '                </div>',
        '            </div>',
        '        </div>',
        '    </div>',
        '    ',
        '    <div class="popup-footer">',
        '        <div class="admin-footer">',
        '            <button id="closeAdminPanelBtn" class="btn-admin-close">',
        '                <i class="bi bi-x-lg"></i> TUTUP PANEL',
        '            </button>',
        '            <div class="admin-info">',
        '                <p><i class="bi bi-info-circle"></i> Panel Admin - Hanya untuk penggunaan internal</p>',
        '            </div>',
        '        </div>',
        '    </div>',
        '</div>'
    ].join('');
    
    document.body.appendChild(overlay);
    this.darkenBackground();
    
    var self = this;
    
    // Event listener untuk generate license
    document.getElementById('generateLicenseBtn').addEventListener('click', function() {
        var packageType = document.getElementById('adminPackageSelect').value;
        var deviceId = document.getElementById('adminDeviceId').value || 'N/A';
        var customerName = document.getElementById('adminCustomerName').value || 'Anonymous';
        
        if (!customerName.trim()) {
            self.showToast('Masukkan nama customer!', 'error');
            return;
        }
        
        var licenseCode = self.generateLicenseCode(packageType, deviceId, customerName);
        
        // Tampilkan hasil
        var resultHTML = [
            '<div class="license-result">',
            '    <h5><i class="bi bi-check-circle"></i> Kode Lisensi Berhasil Digenerate!</h5>',
            '    <div class="result-details">',
            '        <p><strong>Kode:</strong> <code>' + licenseCode + '</code></p>',
            '        <p><strong>Paket:</strong> ' + self.licensePackages[packageType].name + '</p>',
            '        <p><strong>Customer:</strong> ' + customerName + '</p>',
            '        <p><strong>Device ID:</strong> ' + deviceId + '</p>',
            '    </div>',
            '    <div class="result-actions">',
            '        <button onclick="copyToClipboard(\'' + licenseCode + '\')" class="btn-copy-admin">',
            '            <i class="bi bi-copy"></i> Salin Kode',
            '        </button>',
            '        <button onclick="window.open(\'https://wa.me/?text=Kode%20Lisensi:%20' + encodeURIComponent(licenseCode) + '%0APaket:%20' + encodeURIComponent(self.licensePackages[packageType].name) + '%0ACara%20Aktivasi:%20Buka%20aplikasi%20dan%20masukkan%20kode%20ini\', \'_blank\')" class="btn-whatsapp-admin">',
            '            <i class="bi bi-whatsapp"></i> Kirim via WhatsApp',
            '        </button>',
            '    </div>',
            '</div>'
        ].join('');
        
        // Ganti form dengan hasil
        document.querySelector('.admin-form').innerHTML = resultHTML;
        
        // Refresh license list setelah 2 detik
        setTimeout(function() {
            self.showAdminPanel('admin123'); // Refresh panel
        }, 2000);
    });
    
    // Event listener untuk export
    document.getElementById('exportLicensesBtn').addEventListener('click', function() {
        self.exportLicensesToCSV();
    });
    
    // Event listener untuk clear
    document.getElementById('clearLicensesBtn').addEventListener('click', function() {
        if (confirm('Hapus semua data lisensi yang telah digenerate?')) {
            localStorage.removeItem('generated_licenses');
            self.showToast('Data lisensi berhasil dihapus', 'success');
            setTimeout(function() {
                self.showAdminPanel('admin123'); // Refresh panel
            }, 1000);
        }
    });
    
    // Event listener untuk close
    document.getElementById('closeAdminPanelBtn').addEventListener('click', function() {
        self.removePopup(overlay);
    });
    
    // Klik di luar untuk close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            self.removePopup(overlay);
        }
    });
    
    // Adjust height setelah render
    setTimeout(function() {
        self.adjustPopupHeight();
    }, 100);
};

// ==================== FUNGSI BARU: EXPORT KE CSV ====================
OfflineLicenseSystem.prototype.exportLicensesToCSV = function() {
    var generatedLicenses = JSON.parse(localStorage.getItem('generated_licenses') || '[]');
    
    if (generatedLicenses.length === 0) {
        this.showToast('Tidak ada data untuk diexport', 'warning');
        return;
    }
    
    // Buat header CSV
    var csv = 'Kode,Paket,Device ID,Customer Name,Generated At,Status\n';
    
    // Tambahkan data
    generatedLicenses.forEach(function(license) {
        csv += [
            license.code,
            license.package,
            license.deviceId || 'N/A',
            license.customerName || 'Anonymous',
            new Date(license.generatedAt).toLocaleDateString('id-ID'),
            license.status
        ].join(',') + '\n';
    });
    
    // Buat blob dan download
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'license_data_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.showToast('Data berhasil diexport ke CSV', 'success');
};

// ==================== APPLY LICENSE FEATURES ====================
OfflineLicenseSystem.prototype.applyLicenseFeatures = function() {
    if (!this.currentLicense) {
        console.log('Tidak ada lisensi aktif');
        return;
    }
    
    var packageData = this.licensePackages[this.currentLicense.package];
    if (!packageData) {
        console.log('Paket tidak ditemukan:', this.currentLicense.package);
        return;
    }
    
    var features = packageData.features;
    console.log('Menerapkan fitur untuk paket:', this.currentLicense.package);
    
    // 1. Hidden logo jika diperlukan
    if (features.hiddenLogo) {
        this.hideElement('#masjidLogo');
    }
    
    // 2. Hidden slide tertentu
    for (var i = 0; i < features.hiddenSlides.length; i++) {
        var slideNum = features.hiddenSlides[i];
        var slideId = 'slide' + slideNum;
        this.hideElement('#' + slideId);
    }
    
    // 3. Hidden tombol ON/OFF
    if (features.hiddenPowerButton) {
        this.hideElement('#screenOffBtn');
    }
    
    // 4. Hidden nama desa dari alamat
    if (features.hiddenVillageName) {
        this.modifyAddress();
    }
    
    // 5. Batasi jumlah gambar
    this.limitImages(features.maxImages);
    
    // 6. Hidden card Imsak dan Syuruq
    if (features.hiddenImsakSyuruq) {
        this.hideElement('#timeImsak');
        this.hideElement('#timeSyuruq');
        this.hideElement('#thSyuruq');
    }
    
    // 7. Teks Maghrib & Isya aktif hanya 15 menit pertama (untuk trial)
    if (features.maghribIsyaActiveMinutes > 0) {
        this.handleMaghribIsyaTimer(features.maghribIsyaActiveMinutes);
    }
    
    // 8. Hidden tombol pengaturan
    for (var j = 0; j < features.hiddenSettingsButtons.length; j++) {
        var buttonType = features.hiddenSettingsButtons[j];
        this.hideSettingsButton(buttonType);
    }
    
    // 9. Hidden tombol atur waktu adzan
    for (var k = 0; k < features.hiddenAdzanButtons.length; k++) {
        var adzanButtonType = features.hiddenAdzanButtons[k];
        this.hideAdzanButton(adzanButtonType);
    }
    
    // 10. Hidden audio
    for (var l = 0; l < features.hiddenAudio.length; l++) {
        var audioType = features.hiddenAudio[l];
        this.disableAudio(audioType);
    }
    
    // Update UI dengan info lisensi
    this.updateLicenseUI();
};

// ==================== HELPER FUNCTIONS FOR FEATURES ====================
OfflineLicenseSystem.prototype.hideElement = function(selector) {
    var element = document.querySelector(selector);
    if (element) {
        element.style.display = 'none';
    }
};

OfflineLicenseSystem.prototype.modifyAddress = function() {
    var addressElement = document.getElementById('masjidAddress');
    if (addressElement) {
        var address = addressElement.textContent;
        var modifiedAddress = address.replace(/Desa\s+\w+,?\s*/i, '');
        addressElement.textContent = modifiedAddress || 'Masjid Al-Muthmainnah';
    }
};

OfflineLicenseSystem.prototype.limitImages = function(maxImages) {
    if (typeof settings !== 'undefined' && settings.uploadedImages) {
        if (settings.uploadedImages.length > maxImages) {
            settings.uploadedImages = settings.uploadedImages.slice(0, maxImages);
            if (typeof saveSettings === 'function') {
                saveSettings();
            }
        }
        
        if (typeof loadMainCarousel === 'function') {
            loadMainCarousel();
        }
    }
};

OfflineLicenseSystem.prototype.handleMaghribIsyaTimer = function(minutes) {
    var firstOpenKey = 'firstOpenTime';
    var firstOpenTime = localStorage.getItem(firstOpenKey);
    
    if (!firstOpenTime) {
        firstOpenTime = new Date().getTime();
        localStorage.setItem(firstOpenKey, firstOpenTime);
    }
    
    var now = new Date().getTime();
    var timeDiff = now - parseInt(firstOpenTime);
    var minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff > minutes) {
        this.hideElement('#timeMaghrib');
        this.hideElement('#timeIsya');
    }
};

OfflineLicenseSystem.prototype.hideSettingsButton = function(buttonType) {
    var selector = '';
    
    switch(buttonType) {
        case 'data-masjid':
            selector = 'button[data-bs-target="#offcanvasDataMasjid"]';
            break;
        case 'running-text':
            selector = 'button[data-bs-target="#offcanvasRunningText"]';
            break;
        case 'slider-duration':
            selector = 'button[onclick="showSliderSettingsForm()"]';
            break;
    }
    
    if (selector) {
        this.hideElement(selector);
    }
};

OfflineLicenseSystem.prototype.hideAdzanButton = function(buttonType) {
    var self = this;
    setTimeout(function() {
        var modal = document.getElementById('prayerSettingsModal');
        if (modal) {
            var buttonSelector = '';
            
            if (buttonType === 'countdown-adzan') {
                buttonSelector = 'button[onclick*="adzan"]';
            } else if (buttonType === 'countdown-iqamah') {
                buttonSelector = 'button[onclick*="iqamah"]';
            } else if (buttonType === 'overlay-duration') {
                buttonSelector = 'button[onclick*="overlay"]';
            }
            
            if (buttonSelector) {
                var buttons = modal.querySelectorAll(buttonSelector);
                for (var i = 0; i < buttons.length; i++) {
                    buttons[i].style.display = 'none';
                }
            }
        }
    }, 1000);
};

OfflineLicenseSystem.prototype.disableAudio = function(audioType) {
    var audioId = '';
    
    switch(audioType) {
        case 'shalawat':
            audioId = 'audioShalawat';
            break;
        case 'adzan':
            audioId = 'audioAdzan';
            break;
    }
    
    if (audioId) {
        var audioElement = document.getElementById(audioId);
        if (audioElement) {
            audioElement.src = '';
            audioElement.removeAttribute('src');
        }
    }
};

// ==================== ADS MANAGEMENT ====================
OfflineLicenseSystem.prototype.setupAds = function() {
    if (!this.currentLicense) return;
    
    var packageData = this.licensePackages[this.currentLicense.package];
    if (!packageData.features.ads.enabled) return;
    
    var adsConfig = packageData.features.ads;
    var self = this;
    
    this.adsTimer = setInterval(function() {
        self.showAd(adsConfig);
    }, adsConfig.interval * 60 * 1000);
    
    setTimeout(function() {
        self.showAd(adsConfig);
    }, 10000);
};

OfflineLicenseSystem.prototype.showAd = function(adsConfig) {
    var blackOverlay = document.getElementById('blackOverlay');
    var screenBlack = document.getElementById('screenblack');
    
    if ((blackOverlay && blackOverlay.style.display === 'block') || 
        (screenBlack && screenBlack.style.display === 'block')) {
        
        if (adsConfig.overlayBehavior === 'behind') {
            console.log('Iklan berjalan di belakang overlay');
            return;
        }
    }
    
    if (this.isShowingAds) return;
    
    this.isShowingAds = true;
    
    var randomAd = this.adImages[Math.floor(Math.random() * this.adImages.length)];
    
    var adOverlay = document.createElement('div');
    adOverlay.id = 'adOverlay';
    adOverlay.style.position = 'fixed';
    adOverlay.style.top = '0';
    adOverlay.style.left = '0';
    adOverlay.style.width = '100%';
    adOverlay.style.height = '100%';
    adOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    adOverlay.style.zIndex = '99990';
    adOverlay.style.display = 'flex';
    adOverlay.style.alignItems = 'center';
    adOverlay.style.justifyContent = 'center';
    adOverlay.style.flexDirection = 'column';
    
    adOverlay.innerHTML = [
        '<div style="max-width: 90%; max-height: 90%;">',
        '    <img src="' + randomAd + '" alt="Iklan" style="width: 100%; height: auto; border-radius: 10px;">',
        '</div>',
        '<div id="adCountdown" style="color: white; font-size: 24px; margin-top: 20px; font-weight: bold;">',
        '    ' + adsConfig.duration,
        '</div>'
    ].join('');
    
    document.body.appendChild(adOverlay);
    
    var countdown = adsConfig.duration;
    var countdownElement = document.getElementById('adCountdown');
    var self = this;
    
    var countdownInterval = setInterval(function() {
        countdown--;
        if (countdownElement) {
            countdownElement.textContent = countdown;
        }
        
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            self.removeAd(adOverlay);
        }
    }, 1000);
    
    adOverlay.addEventListener('click', function() {
        clearInterval(countdownInterval);
        self.removeAd(adOverlay);
    });
};

OfflineLicenseSystem.prototype.removeAd = function(adOverlay) {
    if (adOverlay && adOverlay.parentNode) {
        adOverlay.parentNode.removeChild(adOverlay);
    }
    this.isShowingAds = false;
};

// ==================== ACTIVATION FUNCTIONS ====================
OfflineLicenseSystem.prototype.activateLicense = function(licenseKey) {
    licenseKey = licenseKey.toUpperCase().trim();
    
    if (!this.isValidLicenseFormat(licenseKey)) {
        return {
            success: false,
            message: 'Format kode lisensi tidak valid. Format: RH-MTV-XXXXXX'
        };
    }
    
    var licenseInfo = this.validLicenseKeys[licenseKey];
    if (!licenseInfo) {
        return {
            success: false,
            message: 'Kode lisensi tidak ditemukan atau sudah digunakan'
        };
    }
    
    var startDate = new Date();
    var expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + licenseInfo.expiryDays);
    
    this.currentLicense = {
        key: licenseKey,
        package: licenseInfo.package,
        startDate: startDate.toISOString(),
        expiry: expiryDate.toISOString(),
        deviceId: this.deviceId,
        activatedAt: new Date().toISOString(),
        status: 'active'
    };
    
    if (this.saveLicense()) {
        // Update status kode di generated licenses (jika ada)
        var generatedLicenses = JSON.parse(localStorage.getItem('generated_licenses') || '[]');
        for (var i = 0; i < generatedLicenses.length; i++) {
            if (generatedLicenses[i].code === licenseKey) {
                generatedLicenses[i].status = 'active';
                generatedLicenses[i].activatedAt = new Date().toISOString();
                localStorage.setItem('generated_licenses', JSON.stringify(generatedLicenses));
                break;
            }
        }
        
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
    var pattern = /^RH-MTV-[A-Z0-9]{6}$/;
    return pattern.test(key);
};

// ==================== POPUP SYSTEM (DIPERBAIKI) ====================
OfflineLicenseSystem.prototype.showActivationPopup = function() {
    this.removeExistingPopup();
    
    var overlay = this.createOverlay();
    
    overlay.innerHTML = [
        '<div class="offline-license-popup">',
        '    <div class="popup-header">',
        '        <div class="header-icon">',
        '            <i class="bi bi-shield-lock"></i>',
        '        </div>',
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
        '                ',
        '                <button id="enterAdminPanelBtn" class="btn-admin-panel">',
        '                    <i class="bi bi-person-badge"></i>',
        '                    <span>PANEL ADMIN</span>',
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
    
    this.setupActivationEvents(overlay);
    this.setupPackagePreview();
    this.darkenBackground();
    
    // Adjust height setelah render
    setTimeout(function() {
        self.adjustPopupHeight();
    }, 100);
};

// ==================== FUNGSI BARU: POPUP DETAIL LISENSI DENGAN TOMBOL UPGRADE ====================
OfflineLicenseSystem.prototype.showLicenseDetailsPopup = function() {
    this.removeExistingPopup();
    
    var overlay = this.createOverlay();
    var packageData = this.licensePackages[this.currentLicense.package];
    var expiryDate = new Date(this.currentLicense.expiry);
    var daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 3600 * 24));
    
    // Cek apakah bisa upgrade
    var upgradeInfo = this.checkUpgradeEligibility();
    
    overlay.innerHTML = [
        '<div class="offline-license-popup">',
        '    <div class="popup-header active">',
        '        <div class="header-icon">',
        '            <i class="bi bi-shield-check"></i>',
        '        </div>',
        '        <h2>LISENSI AKTIF</h2>',
        '        <p class="subtitle">' + packageData.name + ' - ' + daysLeft + ' hari tersisa</p>',
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
        '                    <div class="detail-value">' + packageData.name + '</div>',
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
        '                    <li class="' + (packageData.features.maxImages >= 5 ? 'feature-active' : 'feature-inactive') + '">',
        '                        <i class="bi bi-images"></i> Slide Gambar: ' + packageData.features.maxImages + ' gambar',
        '                    </li>',
        '                    <li class="' + (packageData.features.hiddenAudio.length === 0 ? 'feature-active' : 'feature-inactive') + '">',
        '                        <i class="bi bi-music-note-beamed"></i> Audio: ' + (packageData.features.hiddenAudio.length === 0 ? 'Lengkap' : 'Terbatas') + '',
        '                    </li>',
        '                    <li class="' + (packageData.features.ads.enabled ? 'feature-inactive' : 'feature-active') + '">',
        '                        <i class="bi bi-megaphone"></i> Iklan: ' + (packageData.features.ads.enabled ? 'Aktif' : 'Tidak ada') + '',
        '                    </li>',
        '                    <li class="' + (packageData.features.hiddenSettingsButtons.length === 0 ? 'feature-active' : 'feature-inactive') + '">',
        '                        <i class="bi bi-sliders"></i> Pengaturan: ' + (packageData.features.hiddenSettingsButtons.length === 0 ? 'Lengkap' : 'Terbatas') + '',
        '                    </li>',
        '                </ul>',
        '            </div>',
        '            ',
        (upgradeInfo.eligible ? 
            '<div class="upgrade-notification">' +
            '    <h4><i class="bi bi-graph-up-arrow"></i> Rekomendasi Upgrade</h4>' +
            '    <p>' + upgradeInfo.recommendation + '</p>' +
            '    <p>Paket saat ini: <strong>' + packageData.name + '</strong></p>' +
            '    <p>Paket berikutnya: <strong>' + this.licensePackages[upgradeInfo.nextPackage].name + '</strong></p>' +
            '    <button id="showUpgradeOptionsBtn" class="btn-upgrade-notification">' +
            '        <i class="bi bi-arrow-up-right-circle"></i> LIHAT PAKET UPGRADE' +
            '    </button>' +
            '</div>' : ''),
        '            ',
        '            <div class="action-buttons">',
        '                <button id="closePopupBtn" class="btn-close">',
        '                    <i class="bi bi-check-lg"></i> TUTUP',
        '                </button>',
        '                <button id="deactivateLicenseBtn" class="btn-deactivate">',
        '                    <i class="bi bi-key-fill"></i> KELUAR DARI LISENSI',
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
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            self.removePopup(overlay);
        }
    });
    
    document.getElementById('closePopupBtn').addEventListener('click', function() {
        self.removePopup(overlay);
    });
    
    document.getElementById('deactivateLicenseBtn').addEventListener('click', function() {
        if (self.deactivateLicense()) {
            self.removePopup(overlay);
        }
    });
    
    // Jika ada tombol show upgrade options
    var upgradeBtn = document.getElementById('showUpgradeOptionsBtn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', function() {
            self.removePopup(overlay);
            self.showUpgradeOptions();
        });
    }
    
    // Adjust height setelah render
    setTimeout(function() {
        self.adjustPopupHeight();
    }, 100);
};

// ==================== FUNGSI BARU: POPUP UPGRADE OPTIONS ====================
OfflineLicenseSystem.prototype.showUpgradeOptions = function() {
    this.removeExistingPopup();
    
    var overlay = this.createOverlay();
    var currentPackage = this.currentLicense.package;
    var currentPackageData = this.licensePackages[currentPackage];
    
    var packagesOrder = ['trial', 'basic', 'premium', 'vip'];
    var currentIndex = packagesOrder.indexOf(currentPackage);
    
    var upgradeOptionsHTML = '';
    
    // Tampilkan paket yang lebih tinggi dari paket saat ini
    for (var i = currentIndex + 1; i < packagesOrder.length; i++) {
        var pkg = packagesOrder[i];
        var pkgData = this.licensePackages[pkg];
        var upgradePrice = this.calculateUpgradePrice(pkg);
        
        upgradeOptionsHTML += [
            '<div class="upgrade-option ' + pkg + '">',
            '    <div class="option-badge">UPGRADE</div>',
            '    <h4>' + pkgData.name + '</h4>',
            '    <div class="option-price">Rp ' + upgradePrice.toLocaleString('id-ID') + '</div>',
            '    <div class="option-original-price">Harga normal: Rp ' + pkgData.price.toLocaleString('id-ID') + '</div>',
            '    <div class="option-duration">' + (pkg === 'vip' ? 'SEUMUR HIDUP' : '1 TAHUN') + '</div>',
            '    <ul class="option-features">',
            '        <li><i class="bi bi-check-circle"></i> Max ' + pkgData.features.maxImages + ' gambar</li>',
            '        <li><i class="bi ' + (pkgData.features.hiddenAudio.length === 0 ? 'bi-check-circle' : 'bi-x-circle') + '"></i> Audio ' + (pkgData.features.hiddenAudio.length === 0 ? 'Lengkap' : 'Terbatas') + '</li>',
            '        <li><i class="bi ' + (pkgData.features.ads.enabled ? 'bi-x-circle' : 'bi-check-circle') + '"></i> ' + (pkgData.features.ads.enabled ? 'Dengan Iklan' : 'Tanpa Iklan') + '</li>',
            '        <li><i class="bi bi-check-circle"></i> ' + (pkg === 'vip' ? 'Bonus STB & HDMI Cable' : 'Semua Slide Terbuka') + '</li>',
            '    </ul>',
            '    <button class="btn-upgrade-now" data-package="' + pkg + '">',
            '        <i class="bi bi-arrow-up-right-circle"></i> UPGRADE KE ' + pkgData.name.toUpperCase(),
            '    </button>',
            '</div>'
        ].join('');
    }
    
    overlay.innerHTML = [
        '<div class="offline-license-popup upgrade">',
        '    <div class="popup-header">',
        '        <div class="header-icon">',
        '            <i class="bi bi-graph-up-arrow"></i>',
        '        </div>',
        '        <h2>UPGRADE PAKET</h2>',
        '        <p class="subtitle">Tingkatkan ke paket yang lebih baik</p>',
        '    </div>',
        '    ',
        '    <div class="popup-body">',
        '        <div class="upgrade-container">',
        '            <div class="current-package-info">',
        '                <h4><i class="bi bi-info-circle"></i> Paket Saat Ini:</h4>',
        '                <div class="current-package-card ' + currentPackage + '">',
        '                    <h5>' + currentPackageData.name + '</h5>',
        '                    <p>Max ' + currentPackageData.features.maxImages + ' gambar</p>',
        '                    <p>' + (currentPackageData.features.ads.enabled ? 'Dengan Iklan' : 'Tanpa Iklan') + '</p>',
        '                </div>',
        '            </div>',
        '            ',
        '            <div class="upgrade-options-grid">',
        upgradeOptionsHTML,
        '            </div>',
        '            ',
        '            <div class="upgrade-instructions">',
        '                <h4><i class="bi bi-info-circle"></i> Cara Upgrade:</h4>',
        '                <ol>',
        '                    <li>Pilih paket yang diinginkan</li>',
        '                    <li>Klik tombol "UPGRADE"</li>',
        '                    <li>Hubungi admin via WhatsApp untuk pembayaran</li>',
        '                    <li>Admin akan kirim kode lisensi baru</li>',
        '                    <li>Aktivasi kode baru di aplikasi</li>',
        '                </ol>',
        '            </div>',
        '        </div>',
        '    </div>',
        '    ',
        '    <div class="popup-footer">',
        '        <button id="closeUpgradePopupBtn" class="btn-close">',
        '            <i class="bi bi-x-lg"></i> TUTUP',
        '        </button>',
        '    </div>',
        '</div>'
    ].join('');
    
    document.body.appendChild(overlay);
    this.darkenBackground();
    
    var self = this;
    
    // Event listener untuk tombol close
    document.getElementById('closeUpgradePopupBtn').addEventListener('click', function() {
        self.removePopup(overlay);
    });
    
    // Event listener untuk tombol upgrade
    var upgradeButtons = overlay.querySelectorAll('.btn-upgrade-now');
    for (var j = 0; j < upgradeButtons.length; j++) {
        upgradeButtons[j].addEventListener('click', function() {
            var targetPackage = this.getAttribute('data-package');
            self.processUpgrade(targetPackage, overlay);
        });
    }
    
    // Klik di luar untuk close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            self.removePopup(overlay);
        }
    });
    
    // Adjust height setelah render
    setTimeout(function() {
        self.adjustPopupHeight();
    }, 100);
};

// ==================== FUNGSI BARU: PROSES UPGRADE ====================
OfflineLicenseSystem.prototype.processUpgrade = function(targetPackage, overlay) {
    var targetPackageData = this.licensePackages[targetPackage];
    var upgradePrice = this.calculateUpgradePrice(targetPackage);
    
    // Tampilkan konfirmasi upgrade
    var confirmHTML = [
        '<div class="upgrade-confirmation">',
        '    <h4><i class="bi bi-check-circle"></i> Konfirmasi Upgrade</h4>',
        '    <div class="confirmation-details">',
        '        <p><strong>Dari:</strong> ' + this.licensePackages[this.currentLicense.package].name + '</p>',
        '        <p><strong>Ke:</strong> ' + targetPackageData.name + '</p>',
        '        <p><strong>Harga Upgrade:</strong> Rp ' + upgradePrice.toLocaleString('id-ID') + '</p>',
        '        <p><strong>Device ID:</strong> ' + this.deviceId + '</p>',
        '    </div>',
        '    <div class="confirmation-actions">',
        '        <button id="confirmUpgradeBtn" class="btn-confirm-upgrade">',
        '            <i class="bi bi-check-lg"></i> KONFIRMASI UPGRADE',
        '        </button>',
        '        <button id="cancelUpgradeBtn" class="btn-cancel-upgrade">',
        '            <i class="bi bi-x-lg"></i> BATAL',
        '        </button>',
        '    </div>',
        '</div>'
    ].join('');
    
    // Ganti konten popup
    document.querySelector('.upgrade-container').innerHTML = confirmHTML;
    
    var self = this;
    
    // Event listener untuk konfirmasi
    document.getElementById('confirmUpgradeBtn').addEventListener('click', function() {
        // Tampilkan pesan WhatsApp
        var message = encodeURIComponent(
            'Halo Admin, saya ingin upgrade paket Adzan App.\n\n' +
            'Device ID: ' + self.deviceId + '\n' +
            'Paket Saat Ini: ' + self.licensePackages[self.currentLicense.package].name + '\n' +
            'Paket Tujuan: ' + targetPackageData.name + '\n' +
            'Harga Upgrade: Rp ' + upgradePrice.toLocaleString('id-ID') + '\n\n' +
            'Mohon kirimkan kode lisensi baru untuk paket ' + targetPackageData.name
        );
        
        var whatsappUrl = 'https://wa.me/6289609745090?text=' + message;
        window.open(whatsappUrl, '_blank');
        
        // Tampilkan instruksi
        var instructionHTML = [
            '<div class="upgrade-instruction">',
            '    <h4><i class="bi bi-whatsapp"></i> Upgrade Diproses</h4>',
            '    <div class="instruction-content">',
            '        <p><strong>Langkah selanjutnya:</strong></p>',
            '        <ol>',
            '            <li>WhatsApp telah terbuka. Hubungi admin untuk pembayaran</li>',
            '            <li>Lakukan pembayaran sesuai nominal</li>',
            '            <li>Admin akan mengirimkan kode lisensi baru via WhatsApp</li>',
            '            <li>Kembali ke aplikasi dan masukkan kode baru</li>',
            '            <li>Klik "Aktivasi Kode Baru" untuk mengganti lisensi</li>',
            '        </ol>',
            '        <div class="device-id-reminder">',
            '            <p><strong>Ingat Device ID Anda:</strong></p>',
            '            <code>' + self.deviceId + '</code>',
            '            <button onclick="copyToClipboard(\'' + self.deviceId + '\')" class="btn-copy-small">',
            '                <i class="bi bi-copy"></i> Salin',
            '            </button>',
            '        </div>',
            '    </div>',
            '    <div class="instruction-actions">',
            '        <button id="closeInstructionBtn" class="btn-close">',
            '            <i class="bi bi-check-lg"></i> MENGERTI',
            '        </button>',
            '    </div>',
            '</div>'
        ].join('');
        
        document.querySelector('.upgrade-container').innerHTML = instructionHTML;
        
        document.getElementById('closeInstructionBtn').addEventListener('click', function() {
            self.removePopup(overlay);
            self.showToast('Silahkan lanjutkan proses upgrade via WhatsApp', 'info');
        });
    });
    
    // Event listener untuk batal
    document.getElementById('cancelUpgradeBtn').addEventListener('click', function() {
        // Kembali ke pilihan paket
        self.showUpgradeOptions();
    });
};

// ==================== FUNGSI BARU: SHOW BRIEF LICENSE INFO ====================
OfflineLicenseSystem.prototype.showBriefLicenseInfo = function() {
    if (!this.currentLicense) return;
    
    var packageData = this.licensePackages[this.currentLicense.package];
    var expiryDate = new Date(this.currentLicense.expiry);
    var daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 3600 * 24));
    
    // Hapus badge lama jika ada
    var oldBadge = document.getElementById('licenseInfoBadge');
    if (oldBadge && oldBadge.parentNode) {
        oldBadge.parentNode.removeChild(oldBadge);
    }
    
    // Buat notification kecil di pojok kanan atas
    var infoBadge = document.createElement('div');
    infoBadge.id = 'licenseInfoBadge';
    infoBadge.style.cssText = [
        'position: fixed;',
        'top: 10px;',
        'right: 10px;',
        'background: linear-gradient(135deg, #005a31 0%, #00816d 100%);',
        'color: white;',
        'padding: 8px 15px;',
        'border-radius: 20px;',
        'z-index: 9998;',
        'font-size: 12px;',
        'box-shadow: 0 3px 10px rgba(0,0,0,0.3);',
        'cursor: pointer;',
        'display: flex;',
        'align-items: center;',
        'gap: 8px;',
        'border: 1px solid rgba(255,255,255,0.2);',
        'transition: all 0.3s;'
    ].join('');
    
    // Warna berbeda berdasarkan paket
    if (this.currentLicense.package === 'vip') {
        infoBadge.style.background = 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
        infoBadge.style.color = '#000';
    } else if (this.currentLicense.package === 'premium') {
        infoBadge.style.background = 'linear-gradient(135deg, #6f42c1 0%, #6610f2 100%)';
    } else if (this.currentLicense.package === 'basic') {
        infoBadge.style.background = 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)';
    } else if (this.currentLicense.package === 'trial') {
        infoBadge.style.background = 'linear-gradient(135deg, #fd7e14 0%, #dc3545 100%)';
    }
    
    // Tampilkan icon berbeda berdasarkan paket
    var iconClass = 'bi-shield-check';
    if (this.currentLicense.package === 'vip') iconClass = 'bi-gem';
    else if (this.currentLicense.package === 'premium') iconClass = 'bi-star-fill';
    else if (this.currentLicense.package === 'basic') iconClass = 'bi-shield';
    else if (this.currentLicense.package === 'trial') iconClass = 'bi-clock';
    
    infoBadge.innerHTML = [
        '<i class="bi ' + iconClass + '" style="font-size: 14px;"></i>',
        '<span>' + packageData.name + ' - ' + daysLeft + ' hari</span>'
    ].join('');
    
    document.body.appendChild(infoBadge);
    
    // Klik untuk lihat detail
    var self = this;
    infoBadge.addEventListener('click', function() {
        self.showLicenseDetailsPopup();
    });
    
    // Hover effect
    infoBadge.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
    });
    
    infoBadge.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 3px 10px rgba(0,0,0,0.3)';
    });
    
    // Auto hide opacity setelah 10 detik
    setTimeout(function() {
        if (infoBadge.parentNode) {
            infoBadge.style.opacity = '0.8';
        }
    }, 10000);
};

// ==================== FUNGSI BARU: SHOW EXPIRED POPUP ====================
OfflineLicenseSystem.prototype.showExpiredPopup = function() {
    this.removeExistingPopup();
    
    var overlay = this.createOverlay();
    overlay.style.pointerEvents = 'auto';
    
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
        '            <div class="package-comparison">',
        '                <h4><i class="bi bi-gift"></i> PAKET TERSEDIA:</h4>',
        '                <div class="packages-grid">',
        '                    <div class="package-card basic">',
        '                        <h5>DASAR</h5>',
        '                        <div class="price">Rp 340.000</div>',
        '                        <div class="duration">1 TAHUN</div>',
        '                        <ul>',
        '                            <li>2 Gambar</li>',
        '                            <li>Iklan terbatas</li>',
        '                            <li>Audio terbatas</li>',
        '                        </ul>',
        '                    </div>',
        '                    ',
        '                    <div class="package-card premium">',
        '                        <div class="popular-badge">POPULER</div>',
        '                        <h5>PREMIUM</h5>',
        '                        <div class="price">Rp 570.000</div>',
        '                        <div class="duration">1 TAHUN</div>',
        '                        <ul>',
        '                            <li>5 Gambar</li>',
        '                            <li>Tanpa iklan</li>',
        '                            <li>Audio lengkap</li>',
        '                        </ul>',
        '                    </div>',
        '                    ',
        '                    <div class="package-card vip">',
        '                        <div class="vip-badge">VIP</div>',
        '                        <h5>VIP</h5>',
        '                        <div class="price">Rp 1.420.000</div>',
        '                        <div class="duration">SEUMUR HIDUP</div>',
        '                        <ul>',
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
        '                <button id="tryDemoAgainBtn" class="btn-demo-again">',
        '                    <i class="bi bi-play-circle"></i> COBA DEMO LAGI (15 MENIT)',
        '                </button>',
        '            </div>',
        '        </div>',
        '    </div>',
        '    ',
        '    <div class="popup-footer">',
        '        <div class="cannot-close-warning">',
        '            <i class="bi bi-shield-exclamation"></i>',
        '            APLIKASI TERKUNCI SAMPAI LISENSI DIPERPANJANG',
        '        </div>',
        '    </div>',
        '</div>'
    ].join('');
    
    document.body.appendChild(overlay);
    
    var self = this;
    
    // Event listener untuk demo again
    document.getElementById('tryDemoAgainBtn').addEventListener('click', function() {
        self.activateDemoMode();
        self.removePopup(overlay);
    });
    
    this.disableAppInteractions();
    
    // Adjust height setelah render
    setTimeout(function() {
        self.adjustPopupHeight();
    }, 100);
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
    overlay.style.alignItems = 'flex-start';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.animation = 'fadeIn 0.4s ease';
    overlay.style.overflowY = 'auto';
    overlay.style.overflowX = 'hidden';
    return overlay;
};

OfflineLicenseSystem.prototype.removeExistingPopup = function() {
    var existing = document.getElementById('offlineLicenseOverlay');
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }
    this.restoreBackground();
};

OfflineLicenseSystem.prototype.setupActivationEvents = function(overlay) {
    var self = this;
    var activateBtn = overlay.querySelector('#activateOfflineBtn');
    var licenseInput = overlay.querySelector('#offlineLicenseKey');
    
    activateBtn.addEventListener('click', function() {
        self.processActivation(overlay, activateBtn, licenseInput);
    });
    
    licenseInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            self.processActivation(overlay, activateBtn, licenseInput);
        }
    });
    
    overlay.querySelector('#demoModeBtn').addEventListener('click', function() {
        self.activateDemoMode();
        self.removePopup(overlay);
    });
    
    overlay.querySelector('#contactAdminBtn').addEventListener('click', function() {
        window.open('https://wa.me/6289609745090?text=Halo%20Admin,%20saya%20ingin%20membeli%20lisensi%20Adzan%20App.%20ID%20Perangkat:%20' + encodeURIComponent(self.deviceId), '_blank');
    });
    
    // Event listener untuk panel admin
    overlay.querySelector('#enterAdminPanelBtn').addEventListener('click', function() {
        var password = prompt('Masukkan password admin:');
        if (password) {
            self.showAdminPanel(password);
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
    
    activateBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> MEMPROSES...';
    activateBtn.disabled = true;
    
    setTimeout(function() {
        var result = self.activateLicense(licenseKey);
        
        if (result.success) {
            self.showToast('✓ Lisensi ' + self.licensePackages[result.data.package].name + ' berhasil diaktifkan!', 'success');
            
            activateBtn.innerHTML = '<i class="bi bi-check-circle"></i> BERHASIL!';
            activateBtn.className = 'btn-success-large';
            
            setTimeout(function() {
                self.removePopup(overlay);
                setTimeout(function() {
                    location.reload();
                }, 500);
            }, 2000);
            
        } else {
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
        
        if (!key) {
            packagePreview.innerHTML = [
                '<div class="preview-placeholder">',
                '    <i class="bi bi-box"></i>',
                '    <p>Paket akan terdeteksi otomatis</p>',
                '</div>'
            ].join('');
            return;
        }
        
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
    this.applyLicenseFeatures();
    
    var self = this;
    setTimeout(function() {
        self.showExpiredPopup();
    }, 15 * 60 * 1000);
    
    this.showToast('Mode demo aktif selama 15 menit', 'info');
};

OfflineLicenseSystem.prototype.getDeviceId = function() {
    var deviceId = localStorage.getItem('adzan_device_id');
    if (!deviceId) {
        var timestamp = Date.now().toString(36);
        var random = Math.random().toString(36).substr(2, 6);
        deviceId = 'DEV-' + timestamp + '-' + random;
        deviceId = deviceId.toUpperCase();
        localStorage.setItem('adzan_device_id', deviceId);
    }
    return deviceId;
};

// ==================== UTILITY FUNCTIONS ====================
OfflineLicenseSystem.prototype.updateLicenseUI = function() {
    if (!this.currentLicense) return;
    
    var packageData = this.licensePackages[this.currentLicense.package];
    var endDate = new Date(this.currentLicense.expiry);
    var daysLeft = Math.ceil((endDate - new Date()) / (1000 * 3600 * 24));
    
    var packageElement = document.getElementById('licensePackage');
    var statusElement = document.getElementById('licenseStatusText');
    var expiryElement = document.getElementById('licenseExpiryDate');
    var daysLeftElement = document.getElementById('licenseDaysLeft');
    
    if (packageElement) {
        packageElement.textContent = packageData.name;
    }
    
    if (statusElement) {
        if (daysLeft > 7) {
            statusElement.className = 'badge bg-success';
            statusElement.textContent = 'Aktif';
        } else if (daysLeft > 0) {
            statusElement.className = 'badge bg-warning';
            statusElement.textContent = 'Hampir Habis';
        } else {
            statusElement.className = 'badge bg-danger';
            statusElement.textContent = 'Kadaluarsa';
        }
    }
    
    if (expiryElement) {
        expiryElement.textContent = endDate.toLocaleDateString('id-ID');
    }
    
    if (daysLeftElement) {
        daysLeftElement.textContent = daysLeft > 0 ? daysLeft : 0;
    }
};

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
    var elements = document.querySelectorAll('body > *:not(#offlineLicenseOverlay)');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.pointerEvents = 'none';
        elements[i].style.opacity = '0.2';
        elements[i].style.filter = 'blur(3px)';
    }
};

// ==================== FUNGSI BARU: ADJUST POPUP HEIGHT ====================
OfflineLicenseSystem.prototype.adjustPopupHeight = function() {
    var popup = document.querySelector('.offline-license-popup');
    if (!popup) return;
    
    var viewportHeight = window.innerHeight;
    var popupHeight = popup.offsetHeight;
    var maxHeight = viewportHeight * 0.9;
    
    if (popupHeight > maxHeight) {
        popup.style.maxHeight = maxHeight + 'px';
        
        var body = popup.querySelector('.popup-body');
        if (body) {
            var header = popup.querySelector('.popup-header');
            var footer = popup.querySelector('.popup-footer');
            var headerHeight = header ? header.offsetHeight : 0;
            var footerHeight = footer ? footer.offsetHeight : 0;
            
            body.style.maxHeight = (maxHeight - headerHeight - footerHeight - 40) + 'px';
            body.style.overflowY = 'auto';
        }
    } else {
        popup.style.maxHeight = 'none';
        
        var body = popup.querySelector('.popup-body');
        if (body) {
            body.style.maxHeight = 'none';
            body.style.overflowY = 'visible';
        }
    }
    
    // Center the popup vertically if it's smaller than viewport
    if (popupHeight < viewportHeight * 0.8) {
        popup.style.marginTop = ((viewportHeight - popupHeight) / 2 - 20) + 'px';
    } else {
        popup.style.marginTop = '20px';
    }
};

// ==================== TOAST NOTIFICATION ====================
OfflineLicenseSystem.prototype.showToast = function(message, type) {
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
    setTimeout(function() {
        if (selfToast.parentNode) {
            selfToast.parentNode.removeChild(selfToast);
        }
    }, 4000);
};

// ==================== STYLING (DIPERBAIKI) ====================
OfflineLicenseSystem.prototype.addStyles = function() {
    if (document.getElementById('offline-license-styles')) return;
    
    var style = document.createElement('style');
    style.id = 'offline-license-styles';
    
    var css = `
        /* ==================== BASE ANIMATIONS ==================== */
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
        
        /* ==================== OVERLAY ==================== */
        #offlineLicenseOverlay {
            z-index: 99999 !important;
            overflow-y: auto !important;
            align-items: flex-start !important;
            padding: 20px !important;
            background: rgba(0, 0, 0, 0.92) !important;
        }
        
        /* ==================== MAIN POPUP ==================== */
        .offline-license-popup {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
            color: #333333 !important;
            border-radius: 20px;
            width: 100%;
            max-width: 800px;
            overflow: hidden;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
            border: 2px solid #005a31;
            animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            margin: 20px auto !important;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        
        /* Admin dan Upgrade popup lebih lebar */
        .offline-license-popup.admin,
        .offline-license-popup.upgrade {
            max-width: 900px !important;
        }
        
        /* Expired popup */
        .offline-license-popup.expired {
            border-color: #dc3545;
        }
        
        /* ==================== POPUP HEADER ==================== */
        .popup-header {
            padding: 30px;
            text-align: center;
            background: linear-gradient(135deg, #005a31 0%, #00816d 100%) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: white !important;
            flex-shrink: 0;
        }
        
        .popup-header.active {
            background: linear-gradient(135deg, #00816d 0%, #005a31 100%) !important;
        }
        
        .popup-header.expired {
            background: linear-gradient(135deg, #8b0000 0%, #dc3545 100%) !important;
        }
        
        .header-icon {
            font-size: 60px;
            color: white;
            margin-bottom: 15px;
            display: block;
        }
        
        .popup-header h2 {
            margin: 0 0 10px 0;
            font-size: 28px;
            font-weight: 800;
            color: white !important;
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }
        
        .subtitle {
            margin: 0;
            color: rgba(255, 255, 255, 0.9) !important;
            font-size: 16px;
        }
        
        /* ==================== POPUP BODY (SCROLLABLE) ==================== */
        .popup-body {
            padding: 30px;
            overflow-y: auto;
            overflow-x: hidden;
            flex: 1;
            background: #ffffff !important;
            color: #333333 !important;
            max-height: 60vh;
        }
        
        /* Untuk admin panel yang lebih panjang */
        .offline-license-popup.admin .popup-body {
            max-height: 65vh !important;
        }
        
        /* Custom scrollbar */
        .popup-body::-webkit-scrollbar {
            width: 8px;
        }
        
        .popup-body::-webkit-scrollbar-track {
            background: rgba(0, 90, 49, 0.1);
            border-radius: 4px;
        }
        
        .popup-body::-webkit-scrollbar-thumb {
            background: #005a31;
            border-radius: 4px;
        }
        
        .popup-body::-webkit-scrollbar-thumb:hover {
            background: #00816d;
        }
        
        /* ==================== CARDS ==================== */
        .activation-card,
        .license-details-card,
        .expired-warning-card,
        .admin-panel,
        .upgrade-container {
            background: rgba(255, 255, 255, 0.98) !important;
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(0, 90, 49, 0.2);
            color: #333333 !important;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }
        
        /* ==================== STATUS INDICATOR ==================== */
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 20px;
            border-radius: 50px;
            background: rgba(0, 0, 0, 0.05);
            margin-bottom: 25px;
            font-weight: bold;
            font-size: 14px;
            color: #333333 !important;
        }
        
        .status-indicator.inactive {
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(220, 53, 69, 0.3);
            color: #dc3545 !important;
        }
        
        .status-indicator.active {
            background: rgba(40, 167, 69, 0.1);
            border: 1px solid rgba(40, 167, 69, 0.3);
            color: #28a745 !important;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
        }
        
        /* ==================== LICENSE INPUT ==================== */
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
            color: #005a31 !important;
            font-weight: 600;
            font-size: 16px;
        }
        
        .license-input {
            width: 100%;
            padding: 18px 20px;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 1px;
            background: #ffffff !important;
            border: 2px solid #005a31;
            border-radius: 10px;
            color: #333333 !important;
            text-align: center;
            text-transform: uppercase;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
            box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .license-input:focus {
            outline: none;
            border-color: #005a31;
            box-shadow: 0 0 0 4px rgba(0, 90, 49, 0.3), inset 0 2px 5px rgba(0, 0, 0, 0.1);
            background: #ffffff !important;
        }
        
        .input-hint {
            margin-top: 8px;
            color: #666666 !important;
            font-size: 13px;
            text-align: center;
        }
        
        /* ==================== PACKAGE PREVIEW ==================== */
        .package-preview {
            background: rgba(0, 90, 49, 0.05) !important;
            border-radius: 10px;
            padding: 20px;
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333333 !important;
            border: 1px dashed rgba(0, 90, 49, 0.3);
        }
        
        .preview-placeholder {
            text-align: center;
            color: #666666 !important;
        }
        
        .preview-placeholder i {
            font-size: 40px;
            margin-bottom: 10px;
            display: block;
            color: #999999;
        }
        
        .package-detected {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 15px;
            background: rgba(0, 90, 49, 0.1) !important;
            border-radius: 10px;
            border: 1px solid rgba(0, 90, 49, 0.3);
            animation: slideUp 0.3s ease;
            color: #333333 !important;
            width: 100%;
        }
        
        .package-detected.trial {
            background: rgba(255, 193, 7, 0.1) !important;
            border-color: rgba(255, 193, 7, 0.3);
        }
        
        .package-detected.basic {
            background: rgba(13, 110, 253, 0.1) !important;
            border-color: rgba(13, 110, 253, 0.3);
        }
        
        .package-detected.premium {
            background: rgba(111, 66, 193, 0.1) !important;
            border-color: rgba(111, 66, 193, 0.3);
        }
        
        .package-detected.vip {
            background: linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(220, 53, 69, 0.1)) !important;
            border-color: rgba(255, 193, 7, 0.3);
        }
        
        .package-icon {
            font-size: 40px;
            color: #005a31;
        }
        
        .package-detected.trial .package-icon { color: #fd7e14; }
        .package-detected.basic .package-icon { color: #0d6efd; }
        .package-detected.premium .package-icon { color: #6f42c1; }
        .package-detected.vip .package-icon { color: #ffc107; }
        
        .package-info h4 {
            margin: 0 0 5px 0;
            font-size: 22px;
            color: #333333 !important;
        }
        
        .package-info p {
            margin: 0 0 10px 0;
            color: #666666 !important;
        }
        
        .package-features {
            display: flex;
            gap: 15px;
            font-size: 14px;
            flex-wrap: wrap;
        }
        
        .package-features span {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 4px 10px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 5px;
            color: #333333;
        }
        
        .package-invalid {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 15px;
            background: rgba(220, 53, 69, 0.1) !important;
            border-radius: 10px;
            border: 1px solid rgba(220, 53, 69, 0.3);
            animation: slideUp 0.3s ease;
            color: #333333 !important;
            width: 100%;
        }
        
        .package-invalid .package-icon {
            color: #dc3545;
        }
        
        /* ==================== BUTTONS ==================== */
        .action-section {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin: 25px 0;
        }
        
        /* Primary buttons - Green */
        .btn-activate-large,
        .btn-contact,
        .btn-whatsapp,
        .btn-upgrade-now,
        .btn-admin-generate,
        .btn-confirm-upgrade,
        .btn-whatsapp-admin {
            background: linear-gradient(135deg, #005a31 0%, #00816d 100%) !important;
            color: white !important;
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
            width: 100%;
            text-decoration: none;
        }
        
        .btn-activate-large:hover,
        .btn-contact:hover,
        .btn-whatsapp:hover,
        .btn-upgrade-now:hover,
        .btn-admin-generate:hover,
        .btn-confirm-upgrade:hover,
        .btn-whatsapp-admin:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 90, 49, 0.4);
        }
        
        .btn-activate-large:active,
        .btn-contact:active,
        .btn-whatsapp:active,
        .btn-upgrade-now:active,
        .btn-admin-generate:active,
        .btn-confirm-upgrade:active,
        .btn-whatsapp-admin:active {
            transform: translateY(-1px);
        }
        
        .btn-success-large {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
        }
        
        /* Secondary buttons - Light */
        .btn-demo-mode,
        .btn-copy,
        .btn-admin-secondary,
        .btn-cancel-upgrade,
        .btn-close,
        .btn-admin-close,
        .btn-copy-admin {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #333333 !important;
            border: 2px solid #005a31;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
        }
        
        .btn-demo-mode:hover,
        .btn-copy:hover,
        .btn-admin-secondary:hover,
        .btn-cancel-upgrade:hover,
        .btn-close:hover,
        .btn-admin-close:hover,
        .btn-copy-admin:hover {
            background: rgba(0, 90, 49, 0.1) !important;
            transform: translateY(-2px);
        }
        
        /* Danger buttons - Red */
        .btn-deactivate,
        .btn-admin-danger {
            background: linear-gradient(135deg, #dc3545 0%, #b02a37 100%) !important;
            color: white !important;
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
            width: 100%;
        }
        
        .btn-deactivate:hover,
        .btn-admin-danger:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(220, 53, 69, 0.4);
        }
        
        /* Special buttons */
        .btn-admin-panel {
            background: linear-gradient(135deg, #6f42c1 0%, #6610f2 100%) !important;
            color: white !important;
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
            width: 100%;
        }
        
        .btn-admin-panel:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(111, 66, 193, 0.4);
        }
        
        .btn-upgrade-notification {
            background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%) !important;
            color: #000 !important;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            margin-top: 15px;
        }
        
        .btn-upgrade-notification:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 193, 7, 0.4);
        }
        
        .btn-demo-again {
            background: rgba(13, 110, 253, 0.1) !important;
            color: #0d6efd !important;
            border: 2px solid rgba(13, 110, 253, 0.3);
            padding: 18px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            transition: all 0.3s;
        }
        
        .btn-demo-again:hover {
            background: rgba(13, 110, 253, 0.2) !important;
            transform: translateY(-2px);
        }
        
        .btn-copy-id {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #333333 !important;
            border: 2px solid #005a31;
            padding: 18px;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            transition: all 0.3s;
        }
        
        .btn-copy-id:hover {
            background: rgba(0, 90, 49, 0.1) !important;
            transform: translateY(-2px);
        }
        
        .btn-copy-small {
            background: rgba(255, 255, 255, 0.9) !important;
            color: #333333 !important;
            border: 1px solid #005a31;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            margin-left: 10px;
            transition: all 0.3s;
        }
        
        .btn-copy-small:hover {
            background: rgba(0, 90, 49, 0.1) !important;
        }
        
        /* ==================== DIVIDER ==================== */
        .divider {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 10px 0;
            color: #666666 !important;
        }
        
        .divider::before,
        .divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid rgba(0, 90, 49, 0.2);
        }
        
        .divider span {
            padding: 0 15px;
        }
        
        /* ==================== INFO SECTIONS ==================== */
        .info-section {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 1px solid rgba(0, 90, 49, 0.1);
        }
        
        .info-box,
        .upgrade-instructions,
        .upgrade-notification {
            background: rgba(0, 90, 49, 0.05) !important;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 4px solid #005a31;
            color: #333333 !important;
        }
        
        .info-box h4,
        .upgrade-instructions h4,
        .upgrade-notification h4 {
            color: #005a31 !important;
            margin-top: 0;
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
            color: #333333 !important;
        }
        
        .device-info {
            background: rgba(0, 90, 49, 0.05) !important;
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(0, 90, 49, 0.2);
        }
        
        .device-info p {
            margin: 0 0 10px 0;
            color: #005a31 !important;
            font-weight: 600;
        }
        
        .device-id {
            display: block;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.05);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            color: #005a31 !important;
            font-size: 14px;
            word-break: break-all;
            font-weight: bold;
        }
        
        /* ==================== FOOTER ==================== */
        .popup-footer {
            padding: 20px 30px;
            background: rgba(0, 90, 49, 0.05) !important;
            border-top: 1px solid rgba(0, 90, 49, 0.1);
            text-align: center;
            color: #333333 !important;
            flex-shrink: 0;
        }
        
        .contact-details {
            margin-bottom: 15px;
            color: #666666 !important;
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
            color: #666666 !important;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .cannot-close-warning {
            color: #dc3545 !important;
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 10px;
            background: rgba(220, 53, 69, 0.1);
            border-radius: 5px;
            border: 1px solid rgba(220, 53, 69, 0.3);
        }
        
        .admin-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .admin-info p {
            margin: 0;
            color: #666666 !important;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        /* ==================== LICENSE DETAILS ==================== */
        .details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        
        @media (max-width: 768px) {
            .details-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .detail-item {
            background: rgba(0, 0, 0, 0.03);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(0, 90, 49, 0.1);
        }
        
        .detail-item label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #005a31 !important;
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .detail-value {
            color: #333333 !important;
            font-weight: bold;
            font-size: 16px;
        }
        
        .license-key {
            font-family: 'Courier New', monospace;
            color: #005a31 !important;
            background: rgba(0, 90, 49, 0.05);
            padding: 5px 10px;
            border-radius: 5px;
            display: inline-block;
            font-weight: bold;
        }
        
        .features-list {
            background: rgba(0, 90, 49, 0.03);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid rgba(0, 90, 49, 0.1);
        }
        
        .features-list h4 {
            color: #005a31 !important;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .features-list ul {
            list-style: none;
            padding: 0;
            margin: 15px 0 0 0;
        }
        
        .features-list li {
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #333333 !important;
        }
        
        .feature-active {
            background: rgba(0, 90, 49, 0.1);
            border-left: 4px solid #28a745;
        }
        
        .feature-inactive {
            background: rgba(220, 53, 69, 0.05);
            border-left: 4px solid #dc3545;
        }
        
        .action-buttons {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .action-buttons {
                flex-direction: column;
            }
        }
        
        /* ==================== ADMIN PANEL ==================== */
        .admin-panel {
            display: grid;
            gap: 20px;
        }
        
        .admin-section {
            background: rgba(255, 255, 255, 0.95) !important;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid rgba(0, 90, 49, 0.2);
            margin-bottom: 20px;
            color: #333333 !important;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
        }
        
        .admin-section h4 {
            color: #005a31 !important;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 2px solid rgba(0, 90, 49, 0.2);
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .admin-form {
            display: grid;
            gap: 15px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #005a31 !important;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .admin-select,
        .admin-input {
            width: 100%;
            padding: 12px 15px;
            background: #ffffff !important;
            border: 1px solid #005a31;
            border-radius: 8px;
            color: #333333 !important;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .admin-select:focus,
        .admin-input:focus {
            outline: none;
            border-color: #005a31;
            box-shadow: 0 0 0 3px rgba(0, 90, 49, 0.2);
        }
        
        .license-list {
            max-height: 300px;
            overflow-y: auto;
            margin: 15px 0;
            border: 1px solid rgba(0, 90, 49, 0.2);
            border-radius: 8px;
        }
        
        .license-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .license-list::-webkit-scrollbar-thumb {
            background: rgba(0, 90, 49, 0.5);
            border-radius: 3px;
        }
        
        .admin-table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff !important;
            color: #333333 !important;
        }
        
        .admin-table th {
            background: rgba(0, 90, 49, 0.1) !important;
            color: #005a31 !important;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid rgba(0, 90, 49, 0.2);
            position: sticky;
            top: 0;
        }
        
        .admin-table td {
            padding: 10px 15px;
            background: #ffffff !important;
            color: #333333 !important;
            border-bottom: 1px solid rgba(0, 90, 49, 0.1);
        }
        
        .admin-table tr:hover td {
            background: rgba(0, 90, 49, 0.05) !important;
        }
        
        .admin-table code {
            font-family: 'Courier New', monospace;
            background: rgba(0, 90, 49, 0.05);
            padding: 3px 6px;
            border-radius: 4px;
            color: #005a31;
            font-weight: bold;
        }
        
        .status-badge {
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            text-align: center;
            min-width: 70px;
        }
        
        .status-badge.pending {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
            border: 1px solid rgba(255, 193, 7, 0.3);
        }
        
        .status-badge.active {
            background: rgba(40, 167, 69, 0.2);
            color: #28a745;
            border: 1px solid rgba(40, 167, 69, 0.3);
        }
        
        .status-badge.used {
            background: rgba(108, 117, 125, 0.2);
            color: #6c757d;
            border: 1px solid rgba(108, 117, 125, 0.3);
        }
        
        .admin-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        @media (max-width: 768px) {
            .admin-actions {
                flex-direction: column;
            }
        }
        
        .system-settings {
            display: grid;
            gap: 10px;
        }
        
        .setting-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: rgba(0, 0, 0, 0.02);
            border-radius: 8px;
            border: 1px solid rgba(0, 90, 49, 0.1);
        }
        
        .setting-item label {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #005a31 !important;
            font-weight: 600;
        }
        
        .setting-value {
            color: #333333 !important;
            font-weight: bold;
            background: rgba(0, 90, 49, 0.05);
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #999999 !important;
        }
        
        .empty-state i {
            font-size: 50px;
            margin-bottom: 15px;
            display: block;
            color: #cccccc;
        }
        
        .empty-state p {
            margin: 0;
            font-size: 16px;
        }
        
        .license-result {
            background: rgba(0, 90, 49, 0.1) !important;
            border-radius: 10px;
            padding: 20px;
            border: 2px solid rgba(0, 90, 49, 0.3);
            color: #333333 !important;
        }
        
        .license-result h5 {
            color: #005a31 !important;
            margin-top: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .result-details {
            margin: 15px 0;
        }
        
        .result-details p {
            margin: 8px 0;
            color: #333333 !important;
        }
        
        .result-details strong {
            color: #005a31 !important;
        }
        
        .result-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        @media (max-width: 768px) {
            .result-actions {
                flex-direction: column;
            }
        }
        
        /* ==================== UPGRADE OPTIONS ==================== */
        .upgrade-container {
            display: grid;
            gap: 25px;
        }
        
        .current-package-info h4 {
            color: #005a31 !important;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .current-package-card {
            background: rgba(255, 255, 255, 0.9) !important;
            border-radius: 10px;
            padding: 20px;
            border: 2px solid rgba(0, 90, 49, 0.3);
            text-align: center;
            color: #333333 !important;
        }
        
        .current-package-card.trial {
            border-color: rgba(253, 126, 20, 0.5);
        }
        
        .current-package-card.basic {
            border-color: rgba(13, 110, 253, 0.5);
        }
        
        .current-package-card.premium {
            border-color: rgba(111, 66, 193, 0.5);
        }
        
        .current-package-card.vip {
            border-color: rgba(255, 193, 7, 0.5);
        }
        
        .current-package-card h5 {
            margin-top: 0;
            color: #333333 !important;
            font-size: 20px;
        }
        
        .current-package-card p {
            margin: 8px 0;
            color: #666666 !important;
        }
        
        .upgrade-options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        
        @media (max-width: 768px) {
            .upgrade-options-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .upgrade-option {
            background: rgba(255, 255, 255, 0.95) !important;
            border-radius: 15px;
            padding: 25px;
            position: relative;
            border: 2px solid rgba(0, 90, 49, 0.3);
            transition: all 0.3s;
            color: #333333 !important;
            text-align: center;
        }
        
        .upgrade-option:hover {
            transform: translateY(-5px);
            border-color: #005a31;
            box-shadow: 0 10px 25px rgba(0, 90, 49, 0.15);
        }
        
        .upgrade-option.basic {
            border-color: rgba(13, 110, 253, 0.5);
        }
        
        .upgrade-option.premium {
            border-color: rgba(111, 66, 193, 0.5);
        }
        
        .upgrade-option.vip {
            border-color: rgba(255, 193, 7, 0.5);
        }
        
        .upgrade-option.basic:hover {
            border-color: #0d6efd;
            box-shadow: 0 10px 25px rgba(13, 110, 253, 0.15);
        }
        
        .upgrade-option.premium:hover {
            border-color: #6f42c1;
            box-shadow: 0 10px 25px rgba(111, 66, 193, 0.15);
        }
        
        .upgrade-option.vip:hover {
            border-color: #ffc107;
            box-shadow: 0 10px 25px rgba(255, 193, 7, 0.15);
        }
        
        .option-badge {
            position: absolute;
            top: -12px;
            right: 15px;
            background: linear-gradient(135deg, #005a31 0%, #00816d 100%);
            color: white;
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 3px 10px rgba(0, 90, 49, 0.3);
        }
        
        .upgrade-option.basic .option-badge {
            background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
        }
        
        .upgrade-option.premium .option-badge {
            background: linear-gradient(135deg, #6f42c1 0%, #6610f2 100%);
        }
        
        .upgrade-option.vip .option-badge {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #000;
        }
        
        .upgrade-option h4 {
            margin-top: 0;
            color: #333333 !important;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .option-price {
            font-size: 32px;
            font-weight: bold;
            color: #005a31 !important;
            margin: 15px 0;
        }
        
        .upgrade-option.basic .option-price {
            color: #0d6efd !important;
        }
        
        .upgrade-option.premium .option-price {
            color: #6f42c1 !important;
        }
        
        .upgrade-option.vip .option-price {
            color: #ffc107 !important;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .option-original-price {
            text-decoration: line-through;
            color: #999999 !important;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .option-duration {
            background: rgba(0, 90, 49, 0.1);
            display: inline-block;
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #005a31 !important;
        }
        
        .upgrade-option.basic .option-duration {
            background: rgba(13, 110, 253, 0.1);
            color: #0d6efd !important;
        }
        
        .upgrade-option.premium .option-duration {
            background: rgba(111, 66, 193, 0.1);
            color: #6f42c1 !important;
        }
        
        .upgrade-option.vip .option-duration {
            background: rgba(255, 193, 7, 0.1);
            color: #000 !important;
        }
        
        .option-features {
            list-style: none;
            padding: 0;
            margin: 20px 0;
            text-align: left;
        }
        
        .option-features li {
            padding: 8px 0;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #333333 !important;
            border-bottom: 1px solid rgba(0, 90, 49, 0.1);
        }
        
        .option-features li:last-child {
            border-bottom: none;
        }
        
        .option-features .bi-check-circle {
            color: #28a745;
        }
        
        .option-features .bi-x-circle {
            color: #dc3545;
        }
        
        .upgrade-confirmation,
        .upgrade-instruction {
            background: rgba(255, 255, 255, 0.95) !important;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            border: 2px solid rgba(0, 90, 49, 0.3);
            color: #333333 !important;
        }
        
        .upgrade-confirmation h4,
        .upgrade-instruction h4 {
            color: #005a31 !important;
            margin-top: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            font-size: 24px;
        }
        
        .confirmation-details {
            text-align: left;
            background: rgba(0, 90, 49, 0.05);
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
            border: 1px solid rgba(0, 90, 49, 0.1);
        }
        
        .confirmation-details p {
            margin: 10px 0;
            color: #333333 !important;
        }
        
        .confirmation-details strong {
            color: #005a31 !important;
        }
        
        .confirmation-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 25px;
        }
        
        @media (max-width: 768px) {
            .confirmation-actions {
                flex-direction: column;
            }
        }
        
        .instruction-content {
            text-align: left;
            margin: 25px 0;
        }
        
        .instruction-content p {
            margin: 15px 0;
            color: #333333 !important;
        }
        
        .instruction-content ol {
            padding-left: 20px;
            margin: 15px 0;
        }
        
        .instruction-content li {
            margin-bottom: 10px;
            color: #333333 !important;
        }
        
        .device-id-reminder {
            background: rgba(255, 215, 0, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 25px;
            border: 1px solid rgba(255, 215, 0, 0.3);
            text-align: center;
        }
        
        .device-id-reminder p {
            margin: 0 0 10px 0;
            color: #333333 !important;
            font-weight: 600;
        }
        
        .device-id-reminder code {
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.05);
            padding: 10px;
            border-radius: 5px;
            display: block;
            margin: 10px 0;
            color: #005a31 !important;
            font-weight: bold;
            word-break: break-all;
        }
        
        .instruction-actions {
            margin-top: 25px;
        }
        
        /* ==================== EXPIRED POPUP PACKAGE COMPARISON ==================== */
        .package-comparison {
            margin: 30px 0;
        }
        
        .package-comparison h4 {
            color: #005a31 !important;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
        }
        
        .packages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        @media (max-width: 768px) {
            .packages-grid {
                grid-template-columns: 1fr;
            }
        }
        
        .package-card {
            background: rgba(255, 255, 255, 0.95) !important;
            border-radius: 15px;
            padding: 25px;
            position: relative;
            border: 2px solid rgba(0, 90, 49, 0.2);
            transition: all 0.3s;
            color: #333333 !important;
            text-align: center;
        }
        
        .package-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .package-card.basic {
            border-color: rgba(13, 110, 253, 0.3);
        }
        
        .package-card.premium {
            border-color: rgba(111, 66, 193, 0.3);
            transform: scale(1.05);
            border-width: 3px;
        }
        
        .package-card.vip {
            border-color: rgba(255, 193, 7, 0.3);
        }
        
        .popular-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #6f42c1 0%, #6610f2 100%);
            color: white;
            padding: 6px 20px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 3px 10px rgba(111, 66, 193, 0.3);
        }
        
        .vip-badge {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #000;
            padding: 6px 20px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 3px 10px rgba(255, 215, 0, 0.3);
        }
        
        .package-card h5 {
            margin-top: 0;
            font-size: 22px;
            color: #333333 !important;
            margin-bottom: 15px;
        }
        
        .package-card .price {
            font-size: 28px;
            font-weight: bold;
            color: #005a31 !important;
            margin: 15px 0;
        }
        
        .package-card.basic .price {
            color: #0d6efd !important;
        }
        
        .package-card.premium .price {
            color: #6f42c1 !important;
        }
        
        .package-card.vip .price {
            color: #ffc107 !important;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .package-card .duration {
            background: rgba(0, 90, 49, 0.1);
            display: inline-block;
            padding: 6px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #005a31 !important;
        }
        
        .package-card.basic .duration {
            background: rgba(13, 110, 253, 0.1);
            color: #0d6efd !important;
        }
        
        .package-card.premium .duration {
            background: rgba(111, 66, 193, 0.1);
            color: #6f42c1 !important;
        }
        
        .package-card.vip .duration {
            background: rgba(255, 193, 7, 0.1);
            color: #000 !important;
        }
        
        .package-card ul {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 14px;
            text-align: left;
        }
        
        .package-card li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(0, 90, 49, 0.1);
            color: #333333 !important;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .package-card li:last-child {
            border-bottom: none;
        }
        
        /* ==================== WARNING CARD ==================== */
        .warning-icon {
            font-size: 80px;
            color: #dc3545;
            margin-bottom: 20px;
            animation: pulse 1.5s infinite;
            display: block;
            text-align: center;
        }
        
        .warning-message {
            background: rgba(220, 53, 69, 0.05);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #dc3545;
            text-align: center;
        }
        
        .warning-message p {
            margin: 10px 0;
            color: #333333 !important;
            font-size: 16px;
        }
        
        .contact-actions {
            display: flex;
            flex-direction: column;
            gap: 15px;
            margin-top: 30px;
        }
        
        /* ==================== TOAST NOTIFICATION ==================== */
        .license-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white !important;
            font-weight: bold;
            z-index: 100000;
            animation: slideUp 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
        }
        
        .toast-success {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
            border-left: 4px solid #155724;
        }
        
        .toast-error {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%) !important;
            border-left: 4px solid #721c24;
        }
        
        .toast-info {
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%) !important;
            border-left: 4px solid #0c5460;
        }
        
        /* ==================== RESPONSIVE DESIGN ==================== */
        @media (max-width: 992px) {
            .offline-license-popup {
                max-width: 95% !important;
            }
            
            .popup-header {
                padding: 25px;
            }
            
            .popup-body {
                padding: 25px;
            }
        }
        
        @media (max-width: 768px) {
            .offline-license-popup {
                max-width: 98% !important;
                margin: 10px auto !important;
            }
            
            .popup-header {
                padding: 20px;
            }
            
            .popup-header h2 {
                font-size: 24px;
            }
            
            .header-icon {
                font-size: 50px;
            }
            
            .popup-body {
                padding: 20px;
                max-height: 70vh !important;
            }
            
            .activation-card,
            .license-details-card,
            .expired-warning-card,
            .admin-section,
            .upgrade-container {
                padding: 20px;
            }
            
            .license-input {
                font-size: 18px;
                padding: 15px;
            }
            
            .btn-activate-large,
            .btn-demo-mode,
            .btn-contact,
            .btn-admin-panel,
            .btn-deactivate,
            .btn-whatsapp,
            .btn-copy-id,
            .btn-demo-again {
                padding: 16px;
                font-size: 15px;
            }
            
            .admin-footer {
                flex-direction: column;
                text-align: center;
            }
            
            .admin-table {
                font-size: 12px;
            }
            
            .admin-table th,
            .admin-table td {
                padding: 8px 10px;
            }
            
            .upgrade-options-grid {
                grid-template-columns: 1fr;
            }
            
            .packages-grid {
                grid-template-columns: 1fr;
            }
            
            .package-card.premium {
                transform: scale(1);
            }
            
            .action-buttons,
            .confirmation-actions,
            .result-actions,
            .admin-actions {
                flex-direction: column;
            }
        }
        
        @media (max-width: 480px) {
            .offline-license-popup {
                border-radius: 15px;
            }
            
            .popup-header {
                padding: 15px;
            }
            
            .popup-header h2 {
                font-size: 20px;
            }
            
            .subtitle {
                font-size: 14px;
            }
            
            .header-icon {
                font-size: 40px;
            }
            
            .popup-body {
                padding: 15px;
                max-height: 75vh !important;
            }
            
            .popup-footer {
                padding: 15px;
            }
            
            .activation-card,
            .license-details-card,
            .expired-warning-card,
            .admin-section,
            .upgrade-container {
                padding: 15px;
            }
            
            .license-input {
                font-size: 16px;
                padding: 12px;
            }
            
            .details-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .package-features {
                flex-direction: column;
                gap: 8px;
            }
            
            .warning-icon {
                font-size: 60px;
            }
            
            .package-card,
            .upgrade-option {
                padding: 20px;
            }
        }
        
        /* ==================== FIX FOR SCROLL ON MOBILE ==================== */
        @media (max-width: 768px) {
            #offlineLicenseOverlay {
                padding: 10px !important;
                align-items: flex-start !important;
            }
            
            .offline-license-popup {
                margin-top: 10px !important;
                margin-bottom: 10px !important;
            }
        }
        
        /* ==================== PRINT STYLES ==================== */
        @media print {
            #offlineLicenseOverlay {
                position: relative !important;
                background: white !important;
            }
            
            .offline-license-popup {
                box-shadow: none !important;
                border: 2px solid #000 !important;
                max-width: 100% !important;
                margin: 0 !important;
            }
            
            .btn-activate-large,
            .btn-demo-mode,
            .btn-contact,
            .btn-admin-panel,
            .btn-deactivate,
            .btn-close,
            .btn-copy,
            .btn-copy-id,
            .btn-demo-again,
            .btn-upgrade-now,
            .btn-upgrade-notification,
            .btn-confirm-upgrade,
            .btn-cancel-upgrade,
            .btn-admin-generate,
            .btn-admin-secondary,
            .btn-admin-danger,
            .btn-admin-close,
            .btn-copy-admin,
            .btn-whatsapp-admin,
            .btn-whatsapp {
                display: none !important;
            }
        }
    `;
    
    style.textContent = css;
    document.head.appendChild(style);
};

// ==================== GLOBAL FUNCTIONS ====================
function copyToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        var successful = document.execCommand('copy');
        if (successful) {
            showGlobalToast('✓ Berhasil disalin ke clipboard', 'success');
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
    
    var backgroundColor = '#17a2b8';
    if (type === 'success') backgroundColor = '#28a745';
    else if (type === 'error') backgroundColor = '#dc3545';
    else if (type === 'warning') backgroundColor = '#ffc107';
    
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
        'font-weight: bold;',
        'display: flex;',
        'align-items: center;',
        'gap: 10px;',
        'max-width: 400px;'
    ].join('');
    
    var icon = '';
    if (type === 'success') icon = 'bi-check-circle';
    else if (type === 'error') icon = 'bi-exclamation-circle';
    else if (type === 'warning') icon = 'bi-exclamation-triangle';
    else icon = 'bi-info-circle';
    
    toast.innerHTML = [
        '<i class="bi ' + icon + '"></i>',
        '<span>' + message + '</span>'
    ].join('');
    
    document.body.appendChild(toast);
    
    setTimeout(function() {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// ==================== INITIALIZE ====================
window.offlineLicense = new OfflineLicenseSystem();

// Tambahkan resize listener untuk adjust height
window.addEventListener('resize', function() {
    if (window.offlineLicense && typeof window.offlineLicense.adjustPopupHeight === 'function') {
        window.offlineLicense.adjustPopupHeight();
    }
});

// Tunggu sampai DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Tunggu sebentar sebelum inisialisasi
        setTimeout(function() {
            window.offlineLicense.initialize();
        }, 1500);
    });
} else {
    setTimeout(function() {
        window.offlineLicense.initialize();
    }, 1500);
}

// Export untuk penggunaan global
if (typeof window !== 'undefined') {
    window.OfflineLicenseSystem = OfflineLicenseSystem;
    window.copyToClipboard = copyToClipboard;
}
