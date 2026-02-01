/**
 * =============================================================================
 * API.JS - Komunikasi dengan Google Apps Script Backend
 * =============================================================================
 */

// GANTI dengan URL Web App Anda setelah deploy
const API_URL = 'https://script.google.com/macros/s/AKfycbwDTfIkvWGVxpgKJY7DvaeJakKT2Stmiy3ekRSjRkwLUjpK-vBOfIBgrVf0b13I_ND2/exec';

/**
 * Base fetch function dengan error handling
 */
async function apiCall(action, method = 'GET', data = null) {
    try {
        let url = `${API_URL}?action=${action}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        };

        if (method === 'POST' && data) {
            options.body = JSON.stringify({ action, ...data });
        } else if (method === 'GET' && data) {
            // Add parameters to URL
            Object.keys(data).forEach(key => {
                url += `&${key}=${encodeURIComponent(data[key])}`;
            });
        }

        const response = await fetch(url, options);
        const result = await response.json();
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

/**
 * Get data tamu berdasarkan code
 * @param {string} code - Unique code tamu
 */
async function getGuest(code) {
    return await apiCall('getGuest', 'GET', { code });
}

/**
 * Get konfigurasi wedding
 */
async function getConfig() {
    return await apiCall('getConfig', 'GET');
}

/**
 * Get semua ucapan
 * @param {number} limit - Jumlah maksimal ucapan
 */
async function getWishes(limit = 50) {
    return await apiCall('getWishes', 'GET', { limit });
}

/**
 * Submit RSVP
 * @param {string} code - Unique code tamu
 * @param {string} status - 'Hadir' atau 'Tidak Hadir'
 * @param {number} jumlahHadir - Jumlah orang yang akan hadir
 */
async function submitRSVP(code, status, jumlahHadir) {
    return await apiCall('submitRSVP', 'POST', {
        code,
        status,
        jumlahHadir
    });
}

/**
 * Submit ucapan/wish
 * @param {string} nama - Nama pengirim
 * @param {string} ucapan - Isi ucapan
 * @param {string} kehadiran - Status kehadiran
 */
async function submitWish(nama, ucapan, kehadiran = 'Hadir') {
    return await apiCall('submitWish', 'POST', {
        nama,
        ucapan,
        kehadiran
    });
}

// =============================================================================
// PROTECTED API FUNCTIONS (untuk scanner/dashboard)
// =============================================================================

/**
 * Verify admin password
 * @param {string} password 
 */
async function verifyAdmin(password) {
    return await apiCall('verifyAdmin', 'POST', { password });
}

/**
 * Get dashboard statistics
 * @param {string} password - Admin password
 */
async function getDashboard(password) {
    return await apiCall('getDashboard', 'GET', { password });
}

/**
 * Get all guests (for scanner)
 * @param {string} password - Admin password
 */
async function getAllGuests(password) {
    return await apiCall('getAllGuests', 'GET', { password });
}

/**
 * Check-in tamu
 * @param {string} code - Unique code tamu
 * @param {string} password - Admin password
 */
async function checkInGuest(code, password) {
    return await apiCall('checkIn', 'POST', { code, password });
}

/**
 * Berikan suvenir ke tamu
 * @param {string} code - Unique code tamu
 * @param {string} password - Admin password
 */
async function giveSouvenir(code, password) {
    return await apiCall('giveSouvenir', 'POST', { code, password });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get guest code from URL parameter
 */
function getGuestCodeFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || params.get('c');
}

/**
 * Format tanggal ke bahasa Indonesia
 * @param {string} dateString - Format YYYY-MM-DD
 */
function formatTanggalIndonesia(dateString) {
    const bulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    const date = new Date(dateString);
    const dayName = hari[date.getDay()];
    const day = date.getDate();
    const month = bulan[date.getMonth()];
    const year = date.getFullYear();
    
    return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Calculate countdown to wedding date
 * @param {string} dateString - Target date (YYYY-MM-DD)
 * @param {string} timeString - Target time (HH:MM)
 */
function calculateCountdown(dateString, timeString = '00:00') {
    const target = new Date(`${dateString}T${timeString}:00`);
    const now = new Date();
    const diff = target - now;
    
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, isPast: false };
}

/**
 * Share to WhatsApp
 * @param {string} text - Text to share
 */
function shareToWhatsApp(text) {
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
}

/**
 * Copy text to clipboard
 * @param {string} text 
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

