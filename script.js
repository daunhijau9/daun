// =========== SUARA AI DENGAN CHUNKING (UNTUK TEKS PANJANG) ===========

// Fungsi untuk memotong teks panjang kepada bahagian kecil
function splitTextIntoChunks(text, maxLength = 200) {
    const chunks = [];
    let remaining = text;
    
    while (remaining.length > 0) {
        let chunk = remaining.substring(0, maxLength);
        
        // Cuba potong pada noktah, koma atau ruang terakhir
        if (remaining.length > maxLength) {
            const lastPeriod = chunk.lastIndexOf('.');
            const lastComma = chunk.lastIndexOf(',');
            const lastSpace = chunk.lastIndexOf(' ');
            let cutPoint = maxLength;
            
            if (lastPeriod > maxLength / 2) cutPoint = lastPeriod + 1;
            else if (lastComma > maxLength / 2) cutPoint = lastComma + 1;
            else if (lastSpace > maxLength / 2) cutPoint = lastSpace;
            
            chunk = remaining.substring(0, cutPoint);
            remaining = remaining.substring(cutPoint);
        } else {
            remaining = '';
        }
        
        if (chunk.trim().length > 0) {
            chunks.push(chunk.trim());
        }
    }
    
    return chunks;
}

// Fungsi untuk membaca teks panjang (auto chunk)
async function speakLongText(text, statusElementId) {
    if (!window.speechSynthesis) {
        if (statusElementId) {
            document.getElementById(statusElementId).innerHTML = "❌ Browser tidak menyokong speech";
        }
        return;
    }
    
    // Hentikan bacaan sebelumnya
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    // Tunggu sebentar untuk cancel selesai
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const chunks = splitTextIntoChunks(text, 250);
    
    if (statusElementId) {
        const statusEl = document.getElementById(statusElementId);
        if (chunks.length > 1) {
            statusEl.innerHTML = `🔊 Membaca (1/${chunks.length})...`;
        } else {
            statusEl.innerHTML = "🔊 Membaca...";
        }
    }
    
    let currentChunkIndex = 0;
    
    function speakNextChunk() {
        if (currentChunkIndex >= chunks.length) {
            if (statusElementId) {
                document.getElementById(statusElementId).innerHTML = "✅ Selesai membaca";
                setTimeout(() => {
                    const el = document.getElementById(statusElementId);
                    if (el && el.innerHTML === "✅ Selesai membaca") {
                        el.innerHTML = "✨ AI siap";
                    }
                }, 2000);
            }
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex]);
        utterance.lang = 'id-ID';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        // Pilih suara lelaki
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        } else if (!voicesLoaded) {
            window.speechSynthesis.onvoiceschanged = () => {
                initVoice();
                if (preferredVoice) utterance.voice = preferredVoice;
                window.speechSynthesis.speak(utterance);
            };
            return;
        }
        
        utterance.onstart = () => {
            if (statusElementId && chunks.length > 1) {
                document.getElementById(statusElementId).innerHTML = `🔊 Membaca (${currentChunkIndex + 1}/${chunks.length})...`;
            }
        };
        
        utterance.onend = () => {
            currentChunkIndex++;
            speakNextChunk();
        };
        
        utterance.onerror = (e) => {
            console.error("Speech error:", e);
            if (statusElementId) {
                document.getElementById(statusElementId).innerHTML = "⚠️ Gagal membaca, cuba lagi";
            }
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    speakNextChunk();
}

// Gantikan fungsi speakText yang asal dengan yang baru
function speakText(text, statusElementId) {
    speakLongText(text, statusElementId);
}
