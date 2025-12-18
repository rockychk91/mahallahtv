// ==================== LICENSE MANAGER FOR ADZAN APP ====================
// Versi ES5 untuk kompatibilitas STB Indihome

var LicenseManager = function() {
    // Data paket lisensi
    this.licensePackages = {
        'trial': {
            name: 'Uji Coba',
            price: 50000,
            durationDays: 2,
            features: {
                hiddenLogo: true,
                hiddenSlides: [2, 3, 4], // Slide 2, 3, 4 hidden
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
                    duration: 15, // detik
                    interval: 10, // menit
                    overlayBehavior: 'behind'
                }
            }
        },
        'basic': {
            name: 'Dasar',
            price: 340000,
            durationDays: 365,
            features: {
                hiddenLogo: true,
                hiddenSlides: [2, 4], // Slide 2 dan 4 hidden
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
                    duration: 5, // detik
                    interval: 300, // menit (5 jam)
                    overlayBehavior: 'behind'
                }
            }
        },
        'premium': {
            name: 'Premium',
            price: 570000,
            durationDays: 365,
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
                ads: {
                    enabled: false
                }
            }
        },
        'vip': {
            name: 'VIP',
            price: 1420000,
            durationDays: 99999, // Selamanya
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
                ads: {
                    enabled: false
                }
            }
        }
    };

    // Status lisensi saat ini
    this.currentLicense = null;
    this.adsTimer = null;
    this.isShowingAds = false;
    
    // Default gambar iklan (ganti dengan URL gambar iklan Anda)
    this.adImages = [
        'ads/ad1.jpg',
        'ads/ad2.jpg',
        'ads/ad3.jpg'
    ];
};

// ==================== FUNGSI INISIALISASI ====================
LicenseManager.prototype.initialize = function() {
    console.log('License Manager diinisialisasi');
    
    // Load data lisensi dari localStorage
    this.loadLicense();
    
    // Cek status lisensi
    this.checkLicenseStatus();
    
    // Terapkan restriksi berdasarkan paket
    this.applyLicenseRestrictions();
    
    // Setup iklan jika diperlukan
    this.setupAds();
    
    // Tampilkan popup info lisensi saat pertama kali buka
    this.showLicenseInfoPopup();
};

// ==================== LOAD LICENSE FROM LOCALSTORAGE ====================
LicenseManager.prototype.loadLicense = function() {
    try {
        var savedLicense = localStorage.getItem('adzanAppLicense');
        if (savedLicense) {
            this.currentLicense = JSON.parse(savedLicense);
            
            // Validasi format data
            if (!this.currentLicense.package || !this.currentLicense.startDate || !this.currentLicense.endDate) {
                console.warn('Format lisensi tidak valid, reset ke trial');
                this.resetToTrial();
            } else {
                console.log('Lisensi ' + this.currentLicense.package + ' loaded');
            }
        } else {
            // Jika belum ada lisensi, set ke trial
            this.resetToTrial();
        }
    } catch (error) {
        console.error('Error loading license:', error);
        this.resetToTrial();
    }
};

// ==================== RESET TO TRIAL ====================
LicenseManager.prototype.resetToTrial = function() {
    var startDate = new Date();
    var endDate = new Date();
    endDate.setDate(startDate.getDate() + 2); // 2 hari trial
    
    this.currentLicense = {
        package: 'trial',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentStatus: 'pending' // pending, paid, expired
    };
    
    this.saveLicense();
    console.log('Reset to trial license');
};

// ==================== SAVE LICENSE TO LOCALSTORAGE ====================
LicenseManager.prototype.saveLicense = function() {
    try {
        localStorage.setItem('adzanAppLicense', JSON.stringify(this.currentLicense));
        return true;
    } catch (error) {
        console.error('Error saving license:', error);
        return false;
    }
};

// ==================== CHECK LICENSE STATUS ====================
LicenseManager.prototype.checkLicenseStatus = function() {
    if (!this.currentLicense) {
        this.resetToTrial();
        return;
    }
    
    var now = new Date();
    var endDate = new Date(this.currentLicense.endDate);
    
    // Cek apakah lisensi sudah expired
    if (now > endDate && this.currentLicense.package !== 'vip') {
        this.currentLicense.paymentStatus = 'expired';
        this.saveLicense();
        this.showExpiredPopup();
        return false;
    }
    
    // Hitung hari tersisa
    var timeDiff = endDate.getTime() - now.getTime();
    var daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Update UI dengan info lisensi
    this.updateLicenseUI(daysLeft);
    
    return daysLeft > 0;
};

// ==================== APPLY LICENSE RESTRICTIONS ====================
LicenseManager.prototype.applyLicenseRestrictions = function() {
    if (!this.currentLicense) return;
    
    var packageData = this.licensePackages[this.currentLicense.package];
    if (!packageData) return;
    
    var features = packageData.features;
    
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
};

// ==================== HELPER FUNCTIONS FOR RESTRICTIONS ====================
LicenseManager.prototype.hideElement = function(selector) {
    var element = document.querySelector(selector);
    if (element) {
        element.style.display = 'none';
    }
};

LicenseManager.prototype.modifyAddress = function() {
    var addressElement = document.getElementById('masjidAddress');
    if (addressElement) {
        // Hapus bagian "Desa ..." dari alamat
        var address = addressElement.textContent;
        var modifiedAddress = address.replace(/Desa\s+\w+,?\s*/i, '');
        addressElement.textContent = modifiedAddress || 'Masjid Al-Muthmainnah';
    }
};

LicenseManager.prototype.limitImages = function(maxImages) {
    // Limit dalam settings.uploadedImages
    if (typeof settings !== 'undefined' && settings.uploadedImages) {
        if (settings.uploadedImages.length > maxImages) {
            settings.uploadedImages = settings.uploadedImages.slice(0, maxImages);
            if (typeof saveSettings === 'function') {
                saveSettings();
            }
        }
        
        // Update UI jika ada fungsi loadMainCarousel
        if (typeof loadMainCarousel === 'function') {
            loadMainCarousel();
        }
    }
};

LicenseManager.prototype.handleMaghribIsyaTimer = function(minutes) {
    // Simpan waktu pertama kali dibuka
    var firstOpenKey = 'firstOpenTime';
    var firstOpenTime = localStorage.getItem(firstOpenKey);
    
    if (!firstOpenTime) {
        firstOpenTime = new Date().getTime();
        localStorage.setItem(firstOpenKey, firstOpenTime);
    }
    
    var now = new Date().getTime();
    var timeDiff = now - parseInt(firstOpenTime);
    var minutesDiff = timeDiff / (1000 * 60);
    
    // Jika sudah lewat waktu aktif, hide Maghrib dan Isya
    if (minutesDiff > minutes) {
        this.hideElement('#timeMaghrib');
        this.hideElement('#timeIsya');
    }
};

LicenseManager.prototype.hideSettingsButton = function(buttonType) {
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

LicenseManager.prototype.hideAdzanButton = function(buttonType) {
    // Fungsi ini akan dihubungkan dengan modal pengaturan waktu sholat
    // Implementasi akan tergantung struktur HTML modal
    console.log('Hide adzan button: ' + buttonType);
    
    // Contoh: Hide tombol tertentu di modal
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

LicenseManager.prototype.disableAudio = function(audioType) {
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
            // Ganti src dengan file kosong atau null
            audioElement.src = '';
            audioElement.removeAttribute('src');
        }
    }
};

// ==================== ADS MANAGEMENT ====================
LicenseManager.prototype.setupAds = function() {
    if (!this.currentLicense) return;
    
    var packageData = this.licensePackages[this.currentLicense.package];
    if (!packageData.features.ads.enabled) return;
    
    var adsConfig = packageData.features.ads;
    var self = this;
    
    // Mulai timer iklan
    this.adsTimer = setInterval(function() {
        self.showAd(adsConfig);
    }, adsConfig.interval * 60 * 1000); // Konversi menit ke milidetik
    
    // Tampilkan iklan pertama setelah delay
    setTimeout(function() {
        self.showAd(adsConfig);
    }, 10000); // 10 detik pertama
};

LicenseManager.prototype.showAd = function(adsConfig) {
    // Jangan tampilkan iklan jika sedang ada black overlay atau screen black
    var blackOverlay = document.getElementById('blackOverlay');
    var screenBlack = document.getElementById('screenblack');
    
    if ((blackOverlay && blackOverlay.style.display === 'block') || 
        (screenBlack && screenBlack.style.display === 'block')) {
        
        // Jika overlayBehavior = 'behind', jangan tampilkan di depan
        if (adsConfig.overlayBehavior === 'behind') {
            console.log('Iklan berjalan di belakang overlay');
            return;
        }
    }
    
    // Jangan tampilkan iklan jika sedang aktif
    if (this.isShowingAds) return;
    
    this.isShowingAds = true;
    
    // Pilih gambar iklan acak
    var randomAd = this.adImages[Math.floor(Math.random() * this.adImages.length)];
    
    // Buat overlay iklan
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
    
    // Buat konten iklan
    adOverlay.innerHTML = [
        '<div style="max-width: 90%; max-height: 90%;">',
        '    <img src="' + randomAd + '" alt="Iklan" style="width: 100%; height: auto; border-radius: 10px;">',
        '</div>',
        '<div id="adCountdown" style="color: white; font-size: 24px; margin-top: 20px; font-weight: bold;">',
        '    ' + adsConfig.duration,
        '</div>'
    ].join('');
    
    document.body.appendChild(adOverlay);
    
    // Countdown untuk iklan
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
    
    // Close iklan jika diklik
    adOverlay.addEventListener('click', function() {
        clearInterval(countdownInterval);
        self.removeAd(adOverlay);
    });
};

LicenseManager.prototype.removeAd = function(adOverlay) {
    if (adOverlay && adOverlay.parentNode) {
        adOverlay.parentNode.removeChild(adOverlay);
    }
    this.isShowingAds = false;
};

// ==================== POPUP FUNCTIONS ====================
LicenseManager.prototype.showLicenseInfoPopup = function() {
    if (!this.currentLicense) return;
    
    // Jangan tampilkan jika sudah expired
    if (this.currentLicense.paymentStatus === 'expired') return;
    
    var packageData = this.licensePackages[this.currentLicense.package];
    var endDate = new Date(this.currentLicense.endDate);
    var daysLeft = Math.ceil((endDate - new Date()) / (1000 * 3600 * 24));
    
    // Buat overlay gelap
    var overlay = document.createElement('div');
    overlay.id = 'licenseInfoOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '99998';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    
    // Buat popup konten
    var popup = document.createElement('div');
    popup.style.background = 'linear-gradient(135deg, #005a31 0%, #00816d 100%)';
    popup.style.color = 'white';
    popup.style.padding = '30px';
    popup.style.borderRadius = '15px';
    popup.style.maxWidth = '500px';
    popup.style.width = '90%';
    popup.style.textAlign = 'center';
    popup.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
    popup.style.animation = 'popupIn 0.5s ease';
    
    popup.innerHTML = [
        '<div style="margin-bottom: 20px;">',
        '    <i class="bi bi-shield-check" style="font-size: 50px; color: #c6f6d5;"></i>',
        '</div>',
        '<h3 style="margin-bottom: 15px;">Status Lisensi Aplikasi</h3>',
        '',
        '<div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">',
        '    <h4 style="color: #c6f6d5;">' + packageData.name + '</h4>',
        '    <div style="font-size: 14px; margin-top: 10px;">',
        '        <p><strong>Berakhir:</strong> ' + endDate.toLocaleDateString('id-ID') + '</p>',
        '        <p><strong>Sisa Hari:</strong> ' + daysLeft + ' hari</p>',
        '    </div>',
        '</div>',
        '',
        '<div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: left;">',
        '    <h5 style="color: #c6f6d5; margin-bottom: 10px;">Fitur:</h5>',
        '    <ul style="padding-left: 20px; margin: 0;">',
        '        <li>Slide Gambar: ' + packageData.features.maxImages + ' gambar</li>',
        '        <li>Audio: ' + (packageData.features.hiddenAudio.length > 0 ? 'Terbatas' : 'Lengkap') + '</li>',
        '        <li>Iklan: ' + (packageData.features.ads.enabled ? 'Aktif' : 'Tidak ada') + '</li>',
        '    </ul>',
        '</div>',
        '',
        '<div style="font-size: 12px; color: #c6f6d5; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.2);">',
        '    <p><i class="bi bi-info-circle"></i> Klik di mana saja untuk keluar dari popup ini</p>',
        '</div>'
    ].join('');
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    var self = this;
    
    // Close popup ketika diklik
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            self.removePopup(overlay);
        }
    });
    
    // Tambahkan CSS animation
    this.addPopupAnimation();
};

LicenseManager.prototype.showExpiredPopup = function() {
    // Hentikan semua timer dan audio
    if (typeof stopAllAudio === 'function') {
        stopAllAudio();
    }
    
    if (this.adsTimer) {
        clearInterval(this.adsTimer);
    }
    
    // Buat overlay yang tidak bisa di-close
    var overlay = document.createElement('div');
    overlay.id = 'expiredLicenseOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    
    // Buat popup konten
    var popup = document.createElement('div');
    popup.style.background = 'linear-gradient(135deg, #8B0000 0%, #DC143C 100%)';
    popup.style.color = 'white';
    popup.style.padding = '40px';
    popup.style.borderRadius = '15px';
    popup.style.maxWidth = '500px';
    popup.style.width = '90%';
    popup.style.textAlign = 'center';
    popup.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.7)';
    popup.style.animation = 'popupIn 0.5s ease';
    
    popup.innerHTML = [
        '<div style="margin-bottom: 20px;">',
        '    <i class="bi bi-exclamation-triangle-fill" style="font-size: 60px; color: #FFD700;"></i>',
        '</div>',
        '<h2 style="margin-bottom: 20px; color: #FFD700;">Masa Aktif Habis</h2>',
        '',
        '<div style="background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">',
        '    <p style="font-size: 18px; margin-bottom: 15px;">',
        '        Masa aktif aplikasi ini telah berakhir.',
        '    </p>',
        '    <p style="font-size: 16px;">',
        '        Untuk melanjutkan penggunaan, silahkan hubungi kami:',
        '    </p>',
        '</div>',
        '',
        '<div style="background: rgba(255, 255, 255, 0.15); padding: 20px; border-radius: 10px; margin-bottom: 25px;">',
        '    <h4 style="color: #FFD700; margin-bottom: 15px;"><i class="bi bi-envelope-fill"></i> Email</h4>',
        '    <div style="font-size: 22px; font-weight: bold; background: rgba(0, 0, 0, 0.3); padding: 10px; border-radius: 5px;">',
        '        mahallahtv@gmail.com',
        '    </div>',
        '    <p style="margin-top: 15px; font-size: 14px; color: #FFD700;">',
        '        Hubungi kami untuk perpanjangan lisensi',
        '    </p>',
        '</div>',
        '',
        '<div style="font-size: 12px; color: rgba(255, 255, 255, 0.7); margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.2);">',
        '    <p><i class="bi bi-telephone"></i> Support: 089609745090</p>',
        '</div>'
    ].join('');
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Tambahkan CSS animation
    this.addPopupAnimation();
    
    // Nonaktifkan semua interaksi kecuali popup
    this.disableAppInteractions();
};

LicenseManager.prototype.removePopup = function(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
};

LicenseManager.prototype.addPopupAnimation = function() {
    // Cek apakah style sudah ada
    if (document.getElementById('license-popup-animation')) return;
    
    var style = document.createElement('style');
    style.id = 'license-popup-animation';
    style.textContent = '@keyframes popupIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }';
    document.head.appendChild(style);
};

LicenseManager.prototype.disableAppInteractions = function() {
    // Nonaktifkan semua klik di luar popup
    var elements = document.querySelectorAll('body > *:not(#expiredLicenseOverlay)');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.pointerEvents = 'none';
        elements[i].style.opacity = '0.3';
    }
};

// ==================== UPDATE LICENSE UI ====================
LicenseManager.prototype.updateLicenseUI = function(daysLeft) {
    var self = this;
    
    // Update info lisensi di offcanvas info aplikasi jika ada
    var updateElements = function() {
        var packageElement = document.getElementById('licensePackage');
        var statusElement = document.getElementById('licenseStatusText');
        var expiryElement = document.getElementById('licenseExpiryDate');
        var daysLeftElement = document.getElementById('licenseDaysLeft');
        
        if (packageElement) {
            var packageName = self.licensePackages[self.currentLicense.package] ? self.licensePackages[self.currentLicense.package].name : 'Trial';
            packageElement.textContent = packageName;
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
            var endDate = new Date(self.currentLicense.endDate);
            expiryElement.textContent = endDate.toLocaleDateString('id-ID');
        }
        
        if (daysLeftElement) {
            daysLeftElement.textContent = daysLeft > 0 ? daysLeft : 0;
        }
    };
    
    // Coba update sekarang dan setiap 10 detik (untuk handle async load)
    updateElements();
    setTimeout(updateElements, 10000);
};

// ==================== FUNGSI UNTUK UPGRADE LICENSE ====================
LicenseManager.prototype.upgradeLicense = function(packageType, paymentData) {
    if (!this.licensePackages[packageType]) {
        console.error('Package tidak valid');
        return false;
    }
    
    var startDate = new Date();
    var endDate = new Date();
    endDate.setDate(startDate.getDate() + this.licensePackages[packageType].durationDays);
    
    this.currentLicense = {
        package: packageType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentStatus: 'paid',
        paymentData: paymentData
    };
    
    if (this.saveLicense()) {
        // Hentikan timer iklan lama
        if (this.adsTimer) {
            clearInterval(this.adsTimer);
        }
        
        // Reload aplikasi untuk menerapkan perubahan
        setTimeout(function() {
            location.reload();
        }, 2000);
        
        return true;
    }
    
    return false;
};

// ==================== GET LICENSE INFO ====================
LicenseManager.prototype.getLicenseInfo = function() {
    if (!this.currentLicense) return null;
    
    var packageData = this.licensePackages[this.currentLicense.package];
    var endDate = new Date(this.currentLicense.endDate);
    var now = new Date();
    var daysLeft = Math.ceil((endDate - now) / (1000 * 3600 * 24));
    
    return {
        package: this.currentLicense.package,
        packageName: packageData.name,
        price: packageData.price,
        startDate: this.currentLicense.startDate,
        endDate: this.currentLicense.endDate,
        daysLeft: daysLeft > 0 ? daysLeft : 0,
        isExpired: now > endDate,
        features: packageData.features
    };
};

// ==================== GLOBAL LICENSE MANAGER INSTANCE ====================
window.licenseManager = new LicenseManager();

// ==================== INTEGRASI DENGAN APLIKASI UTAMA ====================

// Fungsi untuk diintegrasikan dengan aplikasi utama
function initializeLicenseSystem() {
    // Tunggu sampai DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.licenseManager.initialize();
        });
    } else {
        window.licenseManager.initialize();
    }
}

// Panggil inisialisasi
initializeLicenseSystem();

// ==================== FUNGSI UNTUK MENAMPILKAN MODAL UPGRADE ====================
function showUpgradeModal() {
    var licenseInfo = window.licenseManager.getLicenseInfo();
    if (!licenseInfo) return;
    
    // Buat modal upgrade
    var modalHTML = [
        '<div class="modal fade" id="upgradeLicenseModal" tabindex="-1" data-bs-backdrop="static">',
        '    <div class="modal-dialog modal-dialog-centered">',
        '        <div class="modal-content">',
        '            <div class="modal-header bg-primary text-white">',
        '                <h4 class="modal-title"><i class="bi bi-gift-fill me-2"></i>Upgrade Lisensi</h4>',
        '                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>',
        '            </div>',
        '            <div class="modal-body">',
        '                <div class="text-center mb-4">',
        '                    <h5>Paket Saat Ini: ' + licenseInfo.packageName + '</h5>',
        '                    <p class="text-muted">Sisa: ' + licenseInfo.daysLeft + ' hari</p>',
        '                </div>',
        '                ',
        '                <div class="row">',
        '                    <div class="col-md-6 mb-3">',
        '                        <div class="card h-100 border-primary">',
        '                            <div class="card-header bg-primary text-white">',
        '                                <h6 class="mb-0">Paket Dasar</h6>',
        '                            </div>',
        '                            <div class="card-body">',
        '                                <h3 class="text-center">Rp 340.000</h3>',
        '                                <p class="text-center"><small>1 Tahun</small></p>',
        '                                <ul class="small">',
        '                                    <li>Max 2 gambar</li>',
        '                                    <li>Tanpa audio shalawat/adzan</li>',
        '                                    <li>Iklan 5 detik/5 jam</li>',
        '                                </ul>',
        '                                <button class="btn btn-primary w-100" onclick="upgradeToPackage(\'basic\')">',
        '                                    Pilih Paket',
        '                                </button>',
        '                            </div>',
        '                        </div>',
        '                    </div>',
        '                    ',
        '                    <div class="col-md-6 mb-3">',
        '                        <div class="card h-100 border-success">',
        '                            <div class="card-header bg-success text-white">',
        '                                <h6 class="mb-0">Paket Premium</h6>',
        '                            </div>',
        '                            <div class="card-body">',
        '                                <h3 class="text-center">Rp 570.000</h3>',
        '                                <p class="text-center"><small>1 Tahun</small></p>',
        '                                <ul class="small">',
        '                                    <li>Max 5 gambar</li>',
        '                                    <li>Audio lengkap</li>',
        '                                    <li>Tanpa iklan</li>',
        '                                </ul>',
        '                                <button class="btn btn-success w-100" onclick="upgradeToPackage(\'premium\')">',
        '                                    Pilih Paket',
        '                                </button>',
        '                            </div>',
        '                        </div>',
        '                    </div>',
        '                </div>',
        '                ',
        '                <div class="card border-warning mt-3">',
        '                    <div class="card-header bg-warning text-dark">',
        '                        <h6 class="mb-0">Paket VIP</h6>',
        '                    </div>',
        '                    <div class="card-body">',
        '                        <h3 class="text-center">Rp 1.420.000</h3>',
        '                        <p class="text-center"><small>Seumur Hidup + STB & Kabel HDMI</small></p>',
        '                        <ul class="small">',
        '                            <li>Max 7 gambar</li>',
        '                            <li>Semua fitur premium</li>',
        '                            <li>Dukungan hardware</li>',
        '                        </ul>',
        '                        <button class="btn btn-warning w-100" onclick="upgradeToPackage(\'vip\')">',
        '                            Pilih Paket',
        '                        </button>',
        '                    </div>',
        '                </div>',
        '                ',
        '                <div class="alert alert-info mt-3">',
        '                    <i class="bi bi-info-circle me-2"></i>',
        '                    Hubungi kami untuk proses pembayaran: ',
        '                    <strong>mahallahtv@gmail.com</strong>',
        '                </div>',
        '            </div>',
        '        </div>',
        '    </div>',
        '</div>'
    ].join('');
    
    // Tambahkan modal ke body jika belum ada
    if (!document.getElementById('upgradeLicenseModal')) {
        var modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
    }
    
    // Tampilkan modal
    var modalElement = document.getElementById('upgradeLicenseModal');
    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        var modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        // Fallback jika Bootstrap tidak tersedia
        modalElement.style.display = 'block';
        modalElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
    }
}

function upgradeToPackage(packageType) {
    // Simulasi proses upgrade
    // Dalam implementasi nyata, ini akan terhubung dengan sistem pembayaran
    
    var paymentData = {
        method: 'bank_transfer',
        amount: window.licenseManager.licensePackages[packageType].price,
        timestamp: new Date().toISOString()
    };
    
    // Tampilkan konfirmasi
    if (confirm('Anda akan mengupgrade ke paket ' + packageType + '. Hubungi kami untuk pembayaran: mahallahtv@gmail.com')) {
        // Simpan data pembayaran sementara
        localStorage.setItem('pendingUpgrade', JSON.stringify({
            package: packageType,
            paymentData: paymentData
        }));
        
        // Tutup modal
        var modalElement = document.getElementById('upgradeLicenseModal');
        if (modalElement) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                var modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            } else {
                modalElement.style.display = 'none';
            }
        }
        
        alert('Silahkan hubungi kami untuk proses pembayaran. Setelah pembayaran, lisensi akan diaktifkan.');
    }
}

// ==================== FUNGSI UNTUK INTEGRASI DENGAN OFFLINE LICENSE SYSTEM ====================
function integrateWithOfflineLicense() {
    // Cek apakah ada lisensi offline
    var offlineLicense = localStorage.getItem('adzan_offline_license');
    if (offlineLicense) {
        try {
            var licenseData = JSON.parse(offlineLicense);
            
            // Konversi format lisensi offline ke format yang digunakan oleh LicenseManager
            var packageType = licenseData.package;
            var startDate = new Date(licenseData.startDate);
            var endDate = new Date(licenseData.expiry);
            
            // Hitung durationDays
            var timeDiff = endDate.getTime() - startDate.getTime();
            var durationDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            // Simpan ke LicenseManager
            window.licenseManager.currentLicense = {
                package: packageType,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                paymentStatus: licenseData.status === 'active' ? 'paid' : 'pending'
            };
            
            window.licenseManager.saveLicense();
            console.log('Lisensi offline berhasil diintegrasikan');
            
        } catch (error) {
            console.error('Error mengintegrasikan lisensi offline:', error);
        }
    }
}

// Panggil fungsi integrasi saat inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if (window.licenseManager) {
            integrateWithOfflineLicense();
        }
    }, 2000);
});

// ==================== COMPATIBILITY POLYFILLS ====================
// Polyfill untuk Object.values jika tidak tersedia
if (!Object.values) {
    Object.values = function(obj) {
        var values = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                values.push(obj[key]);
            }
        }
        return values;
    };
}

// Polyfill untuk String.includes jika tidak tersedia
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

// Polyfill untuk Array.includes jika tidak tersedia
if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
        if (this == null) {
            throw new TypeError('Array.prototype.includes called on null or undefined');
        }
        var O = Object(this);
        var len = O.length >>> 0;
        if (len === 0) {
            return false;
        }
        var n = fromIndex | 0;
        var k = Math.max(n >= 0 ? n : len + n, 0);
        while (k < len) {
            if (O[k] === searchElement) {
                return true;
            }
            k++;
        }
        return false;
    };
}