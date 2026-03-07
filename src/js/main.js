"use strict";

const scriptURL = "https://script.google.com/macros/s/AKfycbzb4DwWHbkal5RirIswPmzqFyaIjou40DRPh9AkyzQ0ILnfv9bzHjil2b_XjkkP3_dTTw/exec";
const LOCAL_SONG_FILE = "src/song/Cakra Khan feat Siti Nurhaliza - Seluruh Cinta- Lirik.mp4";
const RSVP_LOCK_KEY = "eweddingcard.rsvp.locked";
const GIFT_MARKER_PREFIX = "[HADIAH]::";
let slideIndex = 1;
let songInitialized = false;
let introOpened = false;
let detailsUnlocked = false;
let selectedGiftId = "";
let reservedGiftIds = new Set();
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const jumlahField = document.getElementById("jumlahKehadiranField");
const jumlahSelect = document.getElementById("jumlahKehadiran");
const giftItems = [
    { id: "rice-cooker", name: "Rice Cooker", note: "1 unit" },
    { id: "blender", name: "Blender", note: "1 unit" },
    { id: "microwave", name: "Microwave", note: "1 unit" },
    { id: "vacuum", name: "Vacuum Cleaner", note: "1 unit" },
    { id: "iron", name: "Seterika", note: "1 unit" },
    { id: "air-fryer", name: "Air Fryer", note: "1 unit" },
    { id: "bedsheet", name: "Set Cadar", note: "Queen size" },
    { id: "kettle", name: "Electric Kettle", note: "1 unit" }
];

function lockScroll() {
    document.body.classList.add("intro-locked");
}

function unlockScroll() {
    document.body.classList.remove("intro-locked");
}

function openInvitation() {
    const intro = document.getElementById("introGate");
    if (!intro || introOpened) return;

    introOpened = true;
    intro.classList.add("is-opened");
}

function proceedToDetails() {
    if (!introOpened) return;
    if (!detailsUnlocked) {
        detailsUnlocked = true;
        unlockScroll();
    }
    document.getElementById("mainContent")?.scrollIntoView({ behavior: "smooth" });
    playSong();
}

function isGiftRecord(ucapanText) {
    return typeof ucapanText === "string" && ucapanText.trim().startsWith(GIFT_MARKER_PREFIX);
}

function parseGiftIdFromUcapan(ucapanText) {
    if (!isGiftRecord(ucapanText)) return "";
    const match = ucapanText.trim().match(/^\[HADIAH\]::([^:]+)::/);
    return match?.[1] ? match[1].trim() : "";
}

function getGiftById(itemId) {
    return giftItems.find(item => item.id === itemId);
}

function renderGiftList() {
    const giftList = document.getElementById("giftList");
    if (!giftList) return;

    giftList.innerHTML = "";

    giftItems.forEach(item => {
        const card = document.createElement("article");
        card.className = "gift-item";

        const reserved = reservedGiftIds.has(item.id);
        const selected = selectedGiftId === item.id;
        if (reserved) card.classList.add("is-reserved");
        if (selected) card.classList.add("is-selected");

        const title = document.createElement("h4");
        title.textContent = item.name;

        const note = document.createElement("p");
        note.className = "gift-note";
        note.textContent = item.note;

        const action = document.createElement("button");
        action.type = "button";
        action.className = "gift-action";
        action.textContent = reserved ? "Sudah Ditempah" : selected ? "Dipilih" : "Pilih Hadiah";
        action.disabled = reserved;
        action.addEventListener("click", () => selectGiftItem(item.id));

        card.appendChild(title);
        card.appendChild(note);
        card.appendChild(action);
        giftList.appendChild(card);
    });
}

function selectGiftItem(itemId) {
    if (reservedGiftIds.has(itemId)) return;
    const selectedGift = getGiftById(itemId);
    if (!selectedGift) return;

    selectedGiftId = itemId;
    document.getElementById("giftItemId").value = selectedGift.id;
    document.getElementById("giftItemName").value = selectedGift.name;
    document.getElementById("giftForm")?.classList.remove("hidden");
    document.getElementById("giftMessage")?.classList.add("hidden");

    renderGiftList();
    document.getElementById("giftForm")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function cancelGiftReservation() {
    selectedGiftId = "";
    const giftForm = document.getElementById("giftForm");
    if (giftForm) {
        giftForm.classList.add("hidden");
        giftForm.reset();
    }
    renderGiftList();
}

function syncGiftReservations(data) {
    const reservations = new Set();
    data.forEach(row => {
        const giftIdFromMarker = parseGiftIdFromUcapan((row.ucapan || "").toString());
        const giftIdFromField = (row.gift_item_id || row.item_id || "").toString().trim();
        const giftId = giftIdFromMarker || giftIdFromField;
        if (giftId) reservations.add(giftId);
    });

    reservedGiftIds = reservations;
    if (selectedGiftId && reservedGiftIds.has(selectedGiftId)) {
        cancelGiftReservation();
    }
    renderGiftList();
}

function isRSVPLocked() {
    try {
        return window.localStorage.getItem(RSVP_LOCK_KEY) === "1";
    } catch {
        return false;
    }
}

function setRSVPLocked() {
    try {
        window.localStorage.setItem(RSVP_LOCK_KEY, "1");
    } catch {
        // Ignore storage errors and keep UI-only lock for this session
    }
}

function applyRSVPLockState() {
    const locked = isRSVPLocked();
    const rsvpSection = document.getElementById("rsvpSection");
    const options = document.getElementById("rsvpOptions");
    const form = document.getElementById("rsvpForm");
    const message = document.getElementById("rsvpMessage");
    const rsvpButton = document.querySelector(".nav button[onclick*='rsvpSection']");

    if (rsvpButton) {
        rsvpButton.classList.toggle("is-locked", locked);
        rsvpButton.textContent = locked ? "RSVP ✓" : "RSVP";
    }

    if (!rsvpSection || !options || !form || !message) return;

    rsvpSection.classList.toggle("rsvp-locked", locked);

    form.querySelectorAll("input, select, textarea, button").forEach(field => {
        field.disabled = locked;
    });

    const msgText = message.querySelector("p");
    if (locked) {
        options.classList.add("hidden");
        form.classList.add("hidden");
        message.classList.remove("hidden");
        if (msgText) msgText.textContent = "RSVP anda telah direkodkan. Borang RSVP kini ditutup.";
    } else {
        options.classList.remove("hidden");
        message.classList.add("hidden");
        if (msgText) msgText.textContent = "Terima kasih atas maklum balas anda!";
    }
}

function showSlides(n) {
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    if (!slides.length) return;

    if (n > slides.length) { slideIndex = 1; }
    if (n < 1) { slideIndex = slides.length; }

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
        slides[i].classList.remove("is-active");
    }
    for (let i = 0; i < dots.length; i++) { dots[i].className = dots[i].className.replace(" active", ""); }

    slides[slideIndex - 1].style.display = "block";
    slides[slideIndex - 1].classList.add("is-active");
    if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].className += " active";
    }
}

function startSlideshow() {
    showSlides(slideIndex);
    setInterval(() => { slideIndex++; showSlides(slideIndex); }, 4000);
}

function startCountdown() {
    const eventDate = new Date("2025-08-03T11:00:00").getTime();
    const countdown = document.getElementById("countdown");
    if (!countdown) return;

    const countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = eventDate - now;

        if (distance <= 0) {
            countdown.innerHTML = "Majlis sedang berlangsung";
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        countdown.innerHTML = `${days}h ${hours}j ${minutes}m ${seconds}s`;
    }, 1000);
}

function toggleJumlahField(show) {
    if (!jumlahField || !jumlahSelect) return;
    if (show) {
        jumlahField.classList.remove("hidden");
        jumlahSelect.setAttribute("required", "required");
    } else {
        jumlahField.classList.add("hidden");
        jumlahSelect.removeAttribute("required");
        jumlahSelect.value = "";
    }
}

function updateNavActiveState(activeId = null) {
    document.querySelectorAll(".nav button").forEach(button => {
        button.classList.remove("is-active");
    });

    if (!activeId) return;

    const activeButton = document.querySelector(`.nav button[onclick*='${activeId}']`);
    activeButton?.classList.add("is-active");
}

function animateSectionOpen(target) {
    if (!target) return;
    target.classList.add("is-visible");

    if (prefersReducedMotion) return;

    target.classList.remove("section-enter");
    // Trigger reflow so repeated toggles replay animation.
    void target.offsetWidth;
    target.classList.add("section-enter");
    target.addEventListener("animationend", () => {
        target.classList.remove("section-enter");
    }, { once: true });
}

function toggleSection(id) {
    const allSections = ["songSection", "mapSection", "calendarSection", "contactSection", "qrSection", "giftSection", "rsvpSection"];
    const target = document.getElementById(id);
    if (!target) return;
    const isVisible = !target.classList.contains("hidden");

    allSections.forEach(sec => {
        const section = document.getElementById(sec);
        if (section && section !== target) {
            section.classList.add("hidden");
        }
    });

    if (isVisible) {
        target.classList.add("hidden");
        updateNavActiveState(null);
    } else {
        target.classList.remove("hidden");
        animateSectionOpen(target);
        updateNavActiveState(id);
        if (id === "songSection") {
            playSong(false);
        }
        target.scrollIntoView({ behavior: "smooth" });
    }
}

function setupRevealAnimations() {
    const revealTargets = document.querySelectorAll("#mainContent .hero-card, #mainContent .section, #mainContent .nav");
    revealTargets.forEach((node, index) => {
        node.style.setProperty("--reveal-order", String(index));
    });

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        revealTargets.forEach(node => node.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

    revealTargets.forEach(node => observer.observe(node));
}

function selectRSVP(type) {
    if (isRSVPLocked()) return;
    document.getElementById("rsvpOptions")?.classList.add("hidden");
    document.getElementById("rsvpForm")?.classList.remove("hidden");
    const typeInput = document.getElementById("rsvpType");
    if (typeInput) typeInput.value = type;
    toggleJumlahField(type === "yes");
}

function cancelRSVP() {
    if (isRSVPLocked()) return;
    document.getElementById("rsvpOptions")?.classList.remove("hidden");
    document.getElementById("rsvpForm")?.classList.add("hidden");
    document.getElementById("rsvpMessage")?.classList.add("hidden");
    toggleJumlahField(false);
}

function embedSong(autoplay = false) {
    const playerContainer = document.getElementById("youtubePlayerContainer");
    if (!playerContainer) return;

    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.playsInline = true;
    video.src = encodeURI(LOCAL_SONG_FILE);
    video.setAttribute("aria-label", "Lagu Perkahwinan");

    if (autoplay) {
        video.muted = false;
        video.autoplay = true;
        video.play().catch(() => {
            video.muted = false;
        });
    }

    const note = document.createElement("p");
    note.className = "video-note";
    note.textContent = "Jika video tidak dimainkan, gunakan butang play pada player di atas.";

    playerContainer.appendChild(video);
    playerContainer.appendChild(note);
}

function playSong(autoplay = true) {
    if (!songInitialized) {
        embedSong(autoplay);
        songInitialized = true;
    }
}

function handleRSVPSubmit() {
    const form = document.getElementById("rsvpForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (isRSVPLocked()) {
            applyRSVPLockState();
            return;
        }

        const formData = new FormData(form);

        fetch(scriptURL, {
            method: "POST",
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    alert("Terima kasih! Maklumat anda telah dihantar.");
                    setRSVPLocked();
                    form.reset();
                    toggleJumlahField(false);
                    applyRSVPLockState();
                } else {
                    throw new Error("Ralat semasa menghantar. Sila cuba lagi.");
                }
            })
            .catch(error => {
                alert(error.message);
            });
    });
}

function handleGiftSubmit() {
    const giftForm = document.getElementById("giftForm");
    if (!giftForm) return;

    giftForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const itemId = (document.getElementById("giftItemId")?.value || selectedGiftId || "").trim();
        const itemName = (document.getElementById("giftItemName")?.value || "").trim();

        if (!itemId || !itemName) {
            alert("Sila pilih hadiah dahulu.");
            return;
        }

        if (reservedGiftIds.has(itemId)) {
            alert("Hadiah ini sudah ditempah oleh tetamu lain.");
            cancelGiftReservation();
            return;
        }

        const namaInput = giftForm.querySelector("input[name='nama']");
        const nama = (namaInput?.value || "").trim();
        if (!nama) {
            alert("Sila isi nama anda.");
            return;
        }

        const note = (giftForm.querySelector("textarea[name='gift_note']")?.value || "").trim();
        const formData = new FormData();
        formData.append("nama", nama);
        formData.append("ucapan", `${GIFT_MARKER_PREFIX}${itemId}::${itemName}${note ? ` | ${note}` : ""}`);
        formData.append("jumlah", "-");
        // Optional fields if you later add matching headers in Apps Script sheet
        formData.append("form_type", "gift");
        formData.append("gift_item_id", itemId);
        formData.append("gift_item_name", itemName);

        fetch(scriptURL, {
            method: "POST",
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    giftForm.reset();
                    giftForm.classList.add("hidden");
                    document.getElementById("giftMessage")?.classList.remove("hidden");
                    selectedGiftId = "";
                    loadUcapan();
                } else {
                    throw new Error("Ralat semasa menempah hadiah. Sila cuba lagi.");
                }
            })
            .catch(error => {
                alert(error.message);
            });
    });
}

function renderUcapan(track, data) {
    track.innerHTML = "";
    const sanitized = data
        .map(item => ({
            nama: (item.nama || "").toString().trim(),
            ucapan: (item.ucapan || "").toString().trim()
        }))
        .filter(item => item.nama && item.ucapan && !isGiftRecord(item.ucapan));

    if (!sanitized.length) {
        track.innerHTML = '<div class="ucapan-item">Tiada ucapan.</div>';
        return;
    }

    const createNodes = () => sanitized.map(({ nama, ucapan }) => {
        const message = document.createElement("div");
        message.className = "ucapan-item";
        const name = document.createElement("strong");
        name.textContent = nama;
        const text = document.createElement("p");
        text.textContent = ucapan;
        message.appendChild(name);
        message.appendChild(text);
        return message;
    });

    const originals = createNodes();
    originals.forEach(node => track.appendChild(node));

    if (sanitized.length > 1) {
        const baseHeight = track.scrollHeight;
        const clones = createNodes();
        clones.forEach(node => track.appendChild(node));
        const duration = Math.max(18, Math.min(70, baseHeight / 18));
        track.style.setProperty("--scroll-duration", `${duration}s`);
        track.classList.add("is-looping");
    } else {
        track.classList.remove("is-looping");
        track.style.removeProperty("--scroll-duration");
    }
}

async function loadUcapan() {
    const ucapanTrack = document.getElementById("ucapanTrack");
    if (!ucapanTrack) return;

    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        const normalized = Array.isArray(data) ? data : [];
        syncGiftReservations(normalized);
        renderUcapan(ucapanTrack, normalized);
    } catch (error) {
        ucapanTrack.innerHTML = '<div class="ucapan-item">Gagal memuatkan ucapan. Sila cuba lagi.</div>';
        console.error("Error fetching ucapan:", error);
    }
}

function init() {
    document.body.classList.add("animations-enabled");
    lockScroll();
    renderGiftList();
    startSlideshow();
    startCountdown();
    handleRSVPSubmit();
    handleGiftSubmit();
    applyRSVPLockState();
    setupRevealAnimations();
    loadUcapan();
}

window.currentSlide = (n) => { showSlides(slideIndex = n); };
window.toggleSection = toggleSection;
window.selectRSVP = selectRSVP;
window.cancelRSVP = cancelRSVP;
window.cancelGiftReservation = cancelGiftReservation;
window.playSong = playSong;
window.openInvitation = openInvitation;
window.proceedToDetails = proceedToDetails;

document.addEventListener("DOMContentLoaded", init);
