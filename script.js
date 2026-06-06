// script.js - Fungsi bersama untuk semua halaman

// Kunci storage
const DREAMS_KEY = "buku_mimpi_data";
const USERS_KEY = "buku_mimpi_users";
const SESSION_KEY = "buku_mimpi_session";
const FAVORITES_KEY = "buku_mimpi_favorites";

// Akaun admin tetap
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "68900";

// =========== FUNGSI PENGGUNA ===========
function loadUsers() {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
        return JSON.parse(stored);
    } else {
        const defaultUsers = [{ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }];
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        return defaultUsers;
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function isLoggedIn() {
    return localStorage.getItem(SESSION_KEY) === "logged_in";
}

function getCurrentUser() {
    return localStorage.getItem("buku_mimpi_current_user");
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("buku_mimpi_current_user");
    window.location.href = "index.html";
}

// =========== FUNGSI MIMPI ===========
function loadDreams() {
    const stored = localStorage.getItem(DREAMS_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

function saveDreams(dreams) {
    localStorage.setItem(DREAMS_KEY, JSON.stringify(dreams));
}

function addDream(title, description, shortLabel) {
    const dreams = loadDreams();
    const newId = Date.now().toString() + "_" + Math.random().toString(36).substr(2, 6);
    dreams.push({
        id: newId,
        title: title.trim(),
        shortLabel: shortLabel.trim() || title.trim().substring(0, 12),
        description: description.trim(),
        createdAt: new Date().toISOString()
    });
    saveDreams(dreams);
    return newId;
}

function updateDream(id, title, shortLabel, description) {
    const dreams = loadDreams();
    const index = dreams.findIndex(d => d.id === id);
    if (index !== -1) {
        dreams[index] = { ...dreams[index], title, shortLabel, description };
        saveDreams(dreams);
    }
}

function deleteDream(id) {
    let dreams = loadDreams();
    dreams = dreams.filter(d => d.id !== id);
    saveDreams(dreams);
}

// =========== FUNGSI FAVORIT ===========
function getFavorites() {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    return [];
}

function addFavorite(dreamId) {
    let favorites = getFavorites();
    if (!favorites.includes(dreamId)) {
        favorites.push(dreamId);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    }
}

function removeFavorite(dreamId) {
    let favorites = getFavorites();
    favorites = favorites.filter(id => id !== dreamId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(dreamId) {
    return getFavorites().includes(dreamId);
}

// =========== SUARA AI ===========
let preferredVoice = null;
let voicesLoaded = false;

function initVoice() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return;
    let male = voices.find(v => v.name.toLowerCase().includes('male') || (v.lang === 'en-US' && v.name.toLowerCase().includes('male')));
    if (!male) male = voices.find(v => !v.name.toLowerCase().includes('female'));
    preferredVoice = male || voices[0];
    voicesLoaded = true;
}

function speakText(text, statusElementId) {
    if (!window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9;
    if (preferredVoice) utterance.voice = preferredVoice;
    else if (!voicesLoaded) {
        window.speechSynthesis.onvoiceschanged = () => {
            initVoice();
            if (preferredVoice) utterance.voice = preferredVoice;
            window.speechSynthesis.speak(utterance);
        };
        return;
    }
    if (statusElementId) {
        utterance.onstart = () => document.getElementById(statusElementId).innerHTML = "🔊 AI membaca...";
        utterance.onend = () => document.getElementById(statusElementId).innerHTML = "✅ Selesai membaca";
        utterance.onerror = () => document.getElementById(statusElementId).innerHTML = "⚠️ Gagal membaca";
    }
    window.speechSynthesis.speak(utterance);
}

// =========== HELPER ===========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID');
}
