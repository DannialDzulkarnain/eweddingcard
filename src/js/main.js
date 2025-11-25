"use strict";

const scriptURL = "https://script.google.com/macros/s/AKfycbzb4DwWHbkal5RirIswPmzqFyaIjou40DRPh9AkyzQ0ILnfv9bzHjil2b_XjkkP3_dTTw/exec";
let slideIndex = 1;
let songInitialized = false;

const jumlahField = document.getElementById("jumlahKehadiranField");
const jumlahSelect = document.getElementById("jumlahKehadiran");

function showSlides(n) {
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    if (!slides.length) return;

    if (n > slides.length) { slideIndex = 1; }
    if (n < 1) { slideIndex = slides.length; }

    for (let i = 0; i < slides.length; i++) { slides[i].style.display = "none"; }
    for (let i = 0; i < dots.length; i++) { dots[i].className = dots[i].className.replace(" active", ""); }

    slides[slideIndex - 1].style.display = "block";
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

function toggleSection(id) {
    const allSections = ["songSection", "mapSection", "calendarSection", "contactSection", "rsvpSection"];
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
    } else {
        target.classList.remove("hidden");
        if (id === "songSection") {
            playSong(false);
        }
        target.scrollIntoView({ behavior: "smooth" });
    }
}

function selectRSVP(type) {
    document.getElementById("rsvpOptions")?.classList.add("hidden");
    document.getElementById("rsvpForm")?.classList.remove("hidden");
    const typeInput = document.getElementById("rsvpType");
    if (typeInput) typeInput.value = type;
    toggleJumlahField(type === "yes");
}

function cancelRSVP() {
    document.getElementById("rsvpOptions")?.classList.remove("hidden");
    document.getElementById("rsvpForm")?.classList.add("hidden");
    document.getElementById("rsvpMessage")?.classList.add("hidden");
    toggleJumlahField(false);
}

function embedSong(autoplay = false) {
    const youtubeContainer = document.getElementById("youtubePlayerContainer");
    if (!youtubeContainer) return;
    const iframe = document.createElement("iframe");
    iframe.width = "100%";
    iframe.height = "315";
    iframe.src = `https://www.youtube.com/embed/JpAy-RGecMw?controls=1${autoplay ? "&autoplay=1" : ""}`;
    iframe.title = "Lagu Perkahwinan";
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    youtubeContainer.appendChild(iframe);
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

        const formData = new FormData(form);

        fetch(scriptURL, {
            method: "POST",
            body: formData
        })
            .then(response => {
                if (response.ok) {
                    alert("Terima kasih! Maklumat anda telah dihantar.");
                    form.reset();
                    form.classList.add("hidden");
                    document.getElementById("rsvpOptions")?.classList.remove("hidden");
                } else {
                    throw new Error("Ralat semasa menghantar. Sila cuba lagi.");
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
        .filter(item => item.nama && item.ucapan);

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
        renderUcapan(ucapanTrack, Array.isArray(data) ? data : []);
    } catch (error) {
        ucapanTrack.innerHTML = '<div class="ucapan-item">Gagal memuatkan ucapan. Sila cuba lagi.</div>';
        console.error("Error fetching ucapan:", error);
    }
}

function init() {
    startSlideshow();
    startCountdown();
    handleRSVPSubmit();
    loadUcapan();
}

window.currentSlide = (n) => { showSlides(slideIndex = n); };
window.toggleSection = toggleSection;
window.selectRSVP = selectRSVP;
window.cancelRSVP = cancelRSVP;
window.playSong = playSong;

document.addEventListener("DOMContentLoaded", init);
