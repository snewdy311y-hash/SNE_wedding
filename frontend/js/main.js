/**
 * =============================================================================
 * MAIN.JS - Core Functionality untuk Undangan Pernikahan
 * =============================================================================
 */

// =============================================================================
// GLOBAL VARIABLES
// =============================================================================
let weddingConfig = null;
let guestData = null;
let guestCode = null;
let countdownInterval = null;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Get guest code from URL
    guestCode = getGuestCodeFromURL();
    
    // Initialize AOS (Animate On Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }
    
    // Load data
    await loadInitialData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start countdown
    startCountdown();
    
    // Load wishes (dikomentar karena daftar ucapan disembunyikan)
    // loadWishes();
});

/**
 * Load initial data from API
 */
async function loadInitialData() {
    try {
        // Load wedding config
        const configResult = await getConfig();
        if (configResult.success) {
            weddingConfig = configResult.data;
            populateWeddingData();
        }
        
        // Load guest data if code exists
        if (guestCode) {
            const guestResult = await getGuest(guestCode);
            if (guestResult.success) {
                guestData = guestResult.data;
                populateGuestData();
            } else {
                showQRTicketSection(); // Tetap tampilkan QR jika ada code
            }
        }
        
        // Selalu tampilkan blok E-Ticket (QR atau pesan "buka dari link")
        showQRTicketSection();
    } catch (error) {
        console.error('Error loading data:', error);
        showQRTicketSection();
    }
}

/**
 * Populate wedding data to page
 */
function populateWeddingData() {
    if (!weddingConfig) return;
    
    // Names
    setText('.groom-name', weddingConfig.namaPria);
    setText('.bride-name', weddingConfig.namaWanita);
    setText('.groom-fullname', weddingConfig.namaLengkapPria);
    setText('.bride-fullname', weddingConfig.namaLengkapWanita);
    setText('.groom-parents', weddingConfig.namaOrtuPria);
    setText('.bride-parents', weddingConfig.namaOrtuWanita);
    
    // Photos
    setImage('.groom-photo', weddingConfig.fotoPria);
    setImage('.bride-photo', weddingConfig.fotoWanita);
    setImage('.couple-photo', weddingConfig.fotoCouple);
    
    // Event details
    setText('.akad-date', formatTanggalIndonesia(weddingConfig.tanggalAkad));
    setText('.akad-time', weddingConfig.waktuAkad + ' WIB');
    setText('.resepsi-date', formatTanggalIndonesia(weddingConfig.tanggalResepsi));
    setText('.resepsi-time', `${weddingConfig.waktuResepsiMulai} - ${weddingConfig.waktuResepsiSelesai} WIB`);
    
    // Venue
    setText('.venue-name', weddingConfig.namaVenue);
    setText('.venue-address', weddingConfig.alamatVenue);
    
    // Set maps link
    const mapsLinks = document.querySelectorAll('.maps-link');
    mapsLinks.forEach(link => {
        link.href = weddingConfig.linkMaps || '#';
    });
    
    // Quote/Ayat
    setText('.quote-text', weddingConfig.ayatQuran);
    setText('.quote-source', weddingConfig.sumberAyat);
    setText('.opening-message', weddingConfig.pesanPembuka);
    
    // Bank accounts
    setText('.bank-info-1', weddingConfig.rekeningBank);
    setText('.bank-info-2', weddingConfig.rekeningBank2);
    
    // Gallery
    populateGallery();
    
    // Music
    if (weddingConfig.linkMusic) {
        musicPlayer.init(weddingConfig.linkMusic, 'music-toggle');
    }
}

/**
 * Populate guest data
 */
function populateGuestData() {
    if (!guestData) return;
    
    // Guest name in invitation
    setText('.guest-name', guestData.nama);
    
    // Show personalized message
    const guestSection = document.querySelector('.guest-greeting');
    if (guestSection) {
        guestSection.style.display = 'block';
    }
    
    // Pre-fill RSVP form
    const namaInput = document.getElementById('rsvp-nama');
    if (namaInput) {
        namaInput.value = guestData.nama;
    }
    
    const jumlahInput = document.getElementById('rsvp-jumlah');
    if (jumlahInput) {
        jumlahInput.max = guestData.jumlahKursi || 2;
        jumlahInput.value = guestData.jumlahHadir || 1;
    }
    
    // Show current RSVP status
    if (guestData.statusRsvp && guestData.statusRsvp !== 'Belum') {
        showRSVPStatus(guestData.statusRsvp, guestData.jumlahHadir);
    }
    
    // Tampilkan E-Ticket / QR untuk check-in (jika ada code)
    showQRTicketSection();
}

/**
 * Tampilkan blok E-Ticket: jika ada code di URL tampilkan QR; jika tidak tampilkan pesan.
 * Selalu dipanggil setelah load data agar section E-Ticket selalu terlihat.
 */
function showQRTicketSection() {
    var withCodeEl = document.getElementById('qr-ticket-with-code');
    var noCodeEl = document.getElementById('qr-ticket-no-code');
    var imgEl = document.getElementById('qr-ticket-img');
    var nameEl = document.getElementById('qr-ticket-guest-name');
    var codeEl = document.getElementById('qr-ticket-code');
    
    if (!withCodeEl || !noCodeEl) return;
    
    if (guestCode) {
        // Ada code di URL: tampilkan QR + nama + kode
        withCodeEl.style.display = 'block';
        noCodeEl.style.display = 'none';
        
        if (imgEl) {
            var invitationUrl = window.location.href;
            var qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(invitationUrl);
            imgEl.src = qrApiUrl;
            imgEl.alt = 'QR Code Check-in';
        }
        if (nameEl) nameEl.textContent = guestData ? guestData.nama : 'Tamu';
        if (codeEl) codeEl.innerHTML = 'Kode: <strong>' + guestCode + '</strong>';
    } else {
        // Tidak ada code: tampilkan pesan "buka dari link panitia"
        withCodeEl.style.display = 'none';
        noCodeEl.style.display = 'block';
    }
}

/**
 * Populate gallery with photos
 */
function populateGallery() {
    const gallery = document.querySelector('.gallery-grid');
    if (!gallery || !weddingConfig.galleryFotos) return;
    
    gallery.innerHTML = '';
    
    weddingConfig.galleryFotos.forEach((url, index) => {
        if (url) {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.setAttribute('data-aos', 'zoom-in');
            item.setAttribute('data-aos-delay', (index * 100).toString());
            item.innerHTML = `<img src="${url}" alt="Gallery ${index + 1}" onclick="openLightbox('${url}')">`;
            gallery.appendChild(item);
        }
    });
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
    // Cover open button
    const openBtn = document.getElementById('open-invitation');
    if (openBtn) {
        openBtn.addEventListener('click', openInvitation);
    }
    
    // RSVP form
    const rsvpForm = document.getElementById('rsvp-form');
    if (rsvpForm) {
        rsvpForm.addEventListener('submit', handleRSVPSubmit);
    }
    
    // RSVP attendance toggle
    const rsvpOptions = document.querySelectorAll('input[name="kehadiran"]');
    rsvpOptions.forEach(option => {
        option.addEventListener('change', (e) => {
            const jumlahGroup = document.querySelector('.jumlah-group');
            if (jumlahGroup) {
                jumlahGroup.style.display = e.target.value === 'Hadir' ? 'block' : 'none';
            }
        });
    });
    
    // Wish form
    const wishForm = document.getElementById('wish-form');
    if (wishForm) {
        wishForm.addEventListener('submit', handleWishSubmit);
    }
    
    // Share buttons
    const shareWA = document.getElementById('share-wa');
    if (shareWA) {
        shareWA.addEventListener('click', shareToWA);
    }
    
    // Copy bank account buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = e.target.dataset.copy;
            copyToClipboard(text);
            showToast('Nomor rekening disalin!');
        });
    });
    
    // Lightbox close
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', closeLightbox);
    }
    
    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// =============================================================================
// COVER & OPENING
// =============================================================================

function openInvitation() {
    const cover = document.getElementById('cover');
    const mainContent = document.getElementById('main-content');
    
    if (cover) {
        cover.classList.add('open');
        setTimeout(() => {
            cover.style.display = 'none';
        }, 1000);
    }
    
    if (mainContent) {
        mainContent.classList.add('show');
    }
    
    // Start music
    musicPlayer.play();
    
    // Refresh AOS
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

// =============================================================================
// COUNTDOWN
// =============================================================================

function startCountdown() {
    if (!weddingConfig) return;
    
    const updateCountdown = () => {
        const countdown = calculateCountdown(
            weddingConfig.tanggalResepsi,
            weddingConfig.waktuResepsiMulai
        );
        
        setText('#countdown-days', countdown.days.toString().padStart(2, '0'));
        setText('#countdown-hours', countdown.hours.toString().padStart(2, '0'));
        setText('#countdown-minutes', countdown.minutes.toString().padStart(2, '0'));
        setText('#countdown-seconds', countdown.seconds.toString().padStart(2, '0'));
        
        if (countdown.isPast) {
            const countdownSection = document.querySelector('.countdown-section');
            if (countdownSection) {
                countdownSection.innerHTML = '<h3>Acara Telah Berlangsung</h3>';
            }
        }
    };
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// =============================================================================
// RSVP
// =============================================================================

async function handleRSVPSubmit(e) {
    e.preventDefault();
    
    if (!guestCode) {
        showToast('Kode undangan tidak valid', 'error');
        return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Get form data
    const kehadiran = form.querySelector('input[name="kehadiran"]:checked')?.value || 'Hadir';
    const jumlah = parseInt(form.querySelector('#rsvp-jumlah')?.value) || 1;
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    
    try {
        const result = await submitRSVP(guestCode, kehadiran, jumlah);
        
        if (result.success) {
            showToast('RSVP berhasil disimpan!', 'success');
            showRSVPStatus(kehadiran, jumlah);
        } else {
            showToast(result.error || 'Gagal menyimpan RSVP', 'error');
        }
    } catch (error) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function showRSVPStatus(status, jumlah) {
    const statusDiv = document.querySelector('.rsvp-status');
    const form = document.getElementById('rsvp-form');
    
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="status-card ${status === 'Hadir' ? 'attending' : 'not-attending'}">
                <i class="fas ${status === 'Hadir' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                <p>Anda telah mengkonfirmasi <strong>${status === 'Hadir' ? 'Hadir' : 'Tidak Hadir'}</strong></p>
                ${status === 'Hadir' ? `<p>Jumlah tamu: ${jumlah} orang</p>` : ''}
            </div>
        `;
        statusDiv.style.display = 'block';
    }
    
    // Hide form after successful RSVP (optional - can show for editing)
    // if (form) form.style.display = 'none';
}

// =============================================================================
// WISHES
// =============================================================================

async function loadWishes() {
    const container = document.querySelector('.wishes-list');
    if (!container) return;
    
    try {
        const result = await getWishes(20);
        
        if (result.success && result.data.length > 0) {
            container.innerHTML = result.data.map(wish => `
                <div class="wish-card" data-aos="fade-up">
                    <div class="wish-header">
                        <span class="wish-name">${escapeHtml(wish.nama)}</span>
                        <span class="wish-time">${formatRelativeTime(wish.timestamp)}</span>
                    </div>
                    <p class="wish-text">${escapeHtml(wish.ucapan)}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="no-wishes">Belum ada ucapan. Jadilah yang pertama!</p>';
        }
    } catch (error) {
        console.error('Error loading wishes:', error);
    }
}

async function handleWishSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    const nama = form.querySelector('#wish-nama').value.trim();
    const ucapan = form.querySelector('#wish-text').value.trim();
    const kehadiran = form.querySelector('select[name="wish-kehadiran"]')?.value || 'Hadir';
    
    if (!nama || !ucapan) {
        showToast('Nama dan ucapan wajib diisi', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    
    try {
        const result = await submitWish(nama, ucapan, kehadiran);
        
        if (result.success) {
            showToast('Ucapan berhasil dikirim!', 'success');
            form.reset();
            // loadWishes(); // Reload wishes (dikomentar - daftar ucapan disembunyikan)
        } else {
            showToast(result.error || 'Gagal mengirim ucapan', 'error');
        }
    } catch (error) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// =============================================================================
// GALLERY LIGHTBOX
// =============================================================================

function openLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightbox.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// =============================================================================
// SHARE
// =============================================================================

function shareToWA() {
    if (!weddingConfig) return;
    
    const text = `Bismillahirrahmanirrahim\n\nKami mengundang Anda untuk menghadiri pernikahan:\n\n*${weddingConfig.namaPria} & ${weddingConfig.namaWanita}*\n\n📅 ${formatTanggalIndonesia(weddingConfig.tanggalResepsi)}\n⏰ ${weddingConfig.waktuResepsiMulai} WIB\n📍 ${weddingConfig.namaVenue}\n\nUntuk informasi lengkap, kunjungi:\n${window.location.href}`;
    
    shareToWhatsApp(text);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function setText(selector, text) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        el.textContent = text || '';
    });
}

function setImage(selector, src) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        if (src) {
            el.src = src;
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    
    return date.toLocaleDateString('id-ID');
}

function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
