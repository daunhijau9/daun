// script.js - Menggunakan Supabase

// =========== KONFIGURASI SUPABASE ===========
const SUPABASE_URL = "https://zwhaimnotbtzpgyzmla.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZNq1-6DMkDQ3dyn8dO0Byg_fD3EbI4Q";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Kunci untuk session (tetap di localStorage)
const SESSION_KEY = "buku_mimpi_session";
const ADMIN_USERNAME = "admin";

// =========== FUNGSI PENGGUNA (Supabase) ===========
async function loadUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data;
}

async function saveUsers(users) {
    // Guna upsert untuk kemas kini (tapi biasanya kita gunakan fungsi register/login berasingan)
    // Untuk ringkas, kita akan gunakan fungsi register dan login khusus.
}

async function registerUser(username, password) {
    // Semak jika username sudah wujud
    const { data: existing } = await supabase.from('users').select('username').eq('username', username);
    if (existing && existing.length > 0) return { success: false, message: "Nama pengguna sudah wujud!" };
    if (username === ADMIN_USERNAME) return { success: false, message: "Nama pengguna ini tidak tersedia" };
    if (password.length < 4) return { success: false, message: "Kata laluan minimum 4 huruf" };
    
    const { error } = await supabase.from('users').insert([{ username, password, created_at: new Date().toISOString() }]);
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Pendaftaran berjaya! Sila login." };
}

async function loginUser(username, password) {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password);
    if (error || !data || data.length === 0) return false;
    return true;
}

async function getCurrentUserFromSession() {
    return localStorage.getItem("buku_mimpi_current_user");
}

function setSession(username) {
    localStorage.setItem(SESSION_KEY, "logged_in");
    localStorage.setItem("buku_mimpi_current_user", username);
}

function logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("buku_mimpi_current_user");
    window.location.href = "index.html";
}

function isLoggedIn() {
    return localStorage.getItem(SESSION_KEY) === "logged_in";
}

// =========== FUNGSI MIMPI (Supabase) ===========
async function loadDreams() {
    const { data, error } = await supabase.from('dreams').select('*').order('created_at', { ascending: true });
    if (error) return [];
    return data;
}

async function addDream(title, description, shortLabel) {
    const newId = Date.now().toString() + "_" + Math.random().toString(36).substr(2, 6);
    const { error } = await supabase.from('dreams').insert([{
        id: newId,
        title: title.trim(),
        short_label: shortLabel.trim() || title.trim().substring(0, 12),
        description: description.trim(),
        created_at: new Date().toISOString()
    }]);
    if (error) throw error;
    return newId;
}

async function updateDream(id, title, shortLabel, description) {
    const { error } = await supabase.from('dreams').update({
        title, short_label: shortLabel, description
    }).eq('id', id);
    if (error) throw error;
}

async function deleteDream(id) {
    const { error } = await supabase.from('dreams').delete().eq('id', id);
    if (error) throw error;
}

// =========== FUNGSI FAVORIT (Supabase) ===========
async function getFavorites(username) {
    const { data, error } = await supabase.from('favorites').select('dream_id').eq('username', username);
    if (error) return [];
    return data.map(f => f.dream_id);
}

async function addFavorite(username, dreamId) {
    const { error } = await supabase.from('favorites').insert([{ username, dream_id: dreamId }]);
    if (error && error.code !== '23505') throw error; // ignore duplicate
}

async function removeFavorite(username, dreamId) {
    const { error } = await supabase.from('favorites').delete().eq('username', username).eq('dream_id', dreamId);
    if (error) throw error;
}

async function isFavorite(username, dreamId) {
    const favorites = await getFavorites(username);
    return favorites.includes(dreamId);
}

// =========== SUARA AI (sama seperti sebelumnya) ===========
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
