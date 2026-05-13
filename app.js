const state = {
  manifest: { images: [], videos: [] },
  particlesStarted: false,
  finaleStarted: false,
  music: {
    playlist: [
      "cAaPHNeLTM4",
      "_gEadvnzK6c",
      "BjBXoSX5aQI"
    ],
    player: null,
    ready: false
  }
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const els = {
  body: document.body,
  startScreen: document.querySelector("#startScreen"),
  startButton: document.querySelector("#startButton"),
  introScreen: document.querySelector("#introScreen"),
  topbar: document.querySelector("#topbar"),
  heroMedia: document.querySelector("#heroMedia"),
  galleryGrid: document.querySelector("#galleryGrid"),
  videoGrid: document.querySelector("#videoGrid"),
  watchRow: document.querySelector("#watchRow"),
  mediaModal: document.querySelector("#mediaModal"),
  mediaStage: document.querySelector("#mediaStage"),
  mediaCaption: document.querySelector("#mediaCaption"),
  letterModal: document.querySelector("#letterModal"),
  surpriseButton: document.querySelector("#surpriseButton"),
  canvas: document.querySelector("#celebrationCanvas"),
  musicFrame: document.querySelector("#musicFrame"),
  musicNow: document.querySelector("#musicNow")
};

document.addEventListener("DOMContentLoaded", init);
window.onYouTubeIframeAPIReady = createYouTubePlayer;

async function init() {
  els.body.classList.add("is-locked");
  bindEvents();
  await loadManifest();
  renderHero();
  renderGallery();
  renderVideos();
  renderContinueWatching();
  setupLazyVideos();
  setupScrollAnimations();
  setupTopbar();
  setupMusicControls();
}

function bindEvents() {
  els.startButton.addEventListener("click", playIntro, { once: true });
  document.querySelectorAll("[data-open-letter]").forEach((button) => {
    button.addEventListener("click", openLetter);
  });
  document.querySelector("[data-close-letter]").addEventListener("click", closeLetter);
  document.querySelector("[data-close-media]").addEventListener("click", closeMediaModal);
  els.letterModal.addEventListener("click", (event) => {
    if (event.target === els.letterModal) closeLetter();
  });
  els.mediaModal.addEventListener("click", (event) => {
    if (event.target === els.mediaModal) closeMediaModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMediaModal();
      closeLetter();
    }
  });
  els.surpriseButton.addEventListener("click", launchFinale);
  document.querySelector("[data-music-play]").addEventListener("click", toggleMusic);
  document.querySelector("[data-music-prev]").addEventListener("click", playPreviousSong);
  document.querySelector("[data-music-next]").addEventListener("click", playNextSong);
}

async function loadManifest() {
  try {
    const response = await fetch(`media-manifest.json?stamp=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) throw new Error("Manifest not found");
    const manifest = await response.json();
    state.manifest.images = Array.isArray(manifest.images) ? manifest.images : [];
    state.manifest.videos = Array.isArray(manifest.videos) ? manifest.videos : [];
  } catch (error) {
    state.manifest = { images: [], videos: [] };
    console.warn("Could not load media-manifest.json. Run npm run scan.", error);
  }
}

function playIntro() {
  els.startScreen.classList.add("is-hidden");
  els.introScreen.classList.add("is-playing");

  const finishIntro = () => {
    els.introScreen.classList.remove("is-playing");
    els.topbar.classList.add("is-visible");
    els.body.classList.remove("is-locked");
    startFloatingEffects();
  };

  if (window.gsap && !prefersReducedMotion) {
    const introTimeline = gsap.timeline({ onComplete: finishIntro });
    introTimeline
      .fromTo(".intro-logo span", { opacity: 0, y: 28, scale: 0.92 }, {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.035,
        duration: 0.42,
        ease: "power3.out"
      })
      .to(".intro-beam", { x: "240vw", duration: 0.8, ease: "power2.inOut" }, "-=0.15")
      .to(".intro-logo", { scale: 1.16, opacity: 0, duration: 0.55, ease: "power2.in" }, "+=0.3")
      .to(els.introScreen, { opacity: 0, duration: 0.35 }, "-=0.2");
  } else {
    window.setTimeout(finishIntro, 1800);
  }
}

function renderHero() {
  const heroImage = state.manifest.images[0];
  if (!heroImage) return;

  els.heroMedia.style.backgroundImage = `
    linear-gradient(135deg, rgba(15, 23, 42, 0.76), rgba(30, 41, 59, 0.24)),
    url("${heroImage.src}")
  `;
}

function renderGallery() {
  els.galleryGrid.innerHTML = "";

  if (!state.manifest.images.length) {
    els.galleryGrid.innerHTML = emptyState("ยังไม่พบรูปใน /img ลองเพิ่มไฟล์ .jpg, .png หรือ .webp แล้ว run npm run scan");
    return;
  }

  const fragment = document.createDocumentFragment();

  state.manifest.images.forEach((image, index) => {
    const button = document.createElement("button");
    button.className = "polaroid reveal";
    button.type = "button";
    button.setAttribute("aria-label", `Open ${cleanName(image.name)}`);

    const img = document.createElement("img");
    img.src = image.src;
    img.alt = cleanName(image.name);
    img.loading = "lazy";
    img.decoding = "async";

    button.append(img);
    button.addEventListener("click", () => openMediaModal("image", image));
    fragment.append(button);
  });

  els.galleryGrid.append(fragment);
}

function renderVideos() {
  els.videoGrid.innerHTML = "";

  if (!state.manifest.videos.length) {
    els.videoGrid.innerHTML = emptyState("ยังไม่พบวิดีโอใน /video ลองเพิ่มไฟล์ .mp4 หรือ .webm แล้ว run npm run scan");
    return;
  }

  const fragment = document.createDocumentFragment();

  state.manifest.videos.forEach((video, index) => {
    const card = document.createElement("button");
    card.className = "video-card reveal";
    card.type = "button";
    card.setAttribute("aria-label", `Play ${cleanName(video.name)}`);

    const thumb = document.createElement("div");
    thumb.className = "video-thumb";

    const videoEl = document.createElement("video");
    videoEl.dataset.src = video.src;
    videoEl.preload = "metadata";
    videoEl.muted = true;
    videoEl.defaultMuted = true;
    videoEl.volume = 0;
    videoEl.playsInline = true;

    const play = document.createElement("span");
    play.className = "play-icon";
    play.textContent = "▶";

    const meta = document.createElement("div");
    meta.className = "video-meta";
    meta.innerHTML = `
      <h3>คลิปความทรงจำ ${String(index + 1).padStart(2, "0")}</h3>
      <p>${cleanName(video.name)}</p>
    `;

    thumb.append(videoEl, play);
    card.append(thumb, meta);
    card.addEventListener("click", () => openMediaModal("video", video));
    fragment.append(card);
  });

  els.videoGrid.append(fragment);
}

function setupLazyVideos() {
  const videos = document.querySelectorAll(".video-thumb video[data-src]");

  if (!videos.length) return;

  const loadVideo = (video) => {
    if (video.src) return;
    video.src = video.dataset.src;
    video.load();
  };

  if (!("IntersectionObserver" in window)) {
    videos.forEach(loadVideo);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadVideo(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "360px 0px" });

  videos.forEach((video) => observer.observe(video));
}

function renderContinueWatching() {
  const episodes = [
    ["The First Spark", "ตอนที่โลกเริ่มมีเธอ", "78%"],
    ["Cozy Night", "ตอนที่ผ้าห่มและรอยยิ้มพอดีกัน", "64%"],
    ["Food Date", "ตอนที่เมนูเดิมอร่อยกว่าเดิม", "86%"],
    ["Birthday Special", "ตอนที่อยากกอดเธอนาน ๆ", "99%"]
  ];

  const fragment = document.createDocumentFragment();

  episodes.forEach(([title, description, progress]) => {
    const article = document.createElement("article");
    article.className = "watch-card reveal";
    article.innerHTML = `
      <h3>${title}</h3>
      <span class="watch-progress" style="--progress: ${progress}"></span>
      <p>${description}</p>
    `;
    fragment.append(article);
  });

  els.watchRow.append(fragment);
}

function setupScrollAnimations() {
  if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".reveal").forEach((element) => {
      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 86%",
          once: true
        }
      });
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14 });

  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

function setupTopbar() {
  const update = () => {
    els.topbar.classList.toggle("is-scrolled", window.scrollY > 16);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

function openMediaModal(type, media) {
  els.mediaStage.innerHTML = "";
  const element = document.createElement(type === "image" ? "img" : "video");

  element.src = media.src;

  if (type === "image") {
    element.alt = cleanName(media.name);
    element.decoding = "async";
  } else {
    element.controls = true;
    element.autoplay = true;
    element.playsInline = true;
    element.muted = true;
    element.defaultMuted = true;
    element.volume = 0;
    element.setAttribute("controlsList", "nodownload noplaybackrate");
  }

  els.mediaCaption.textContent = cleanName(media.name);
  els.mediaStage.append(element);
  els.mediaModal.classList.add("is-open");
  els.body.classList.add("is-locked");
}

function setupMusicControls() {
  if (!els.musicFrame) return;
  els.musicFrame.innerHTML = "<div class=\"music-placeholder\">เพิ่มเพลงจาก YouTube ได้ที่ app.js</div>";
}

function createYouTubePlayer() {
  if (!window.YT || !window.YT.Player || state.music.player) return;
  if (!state.music.playlist.length || state.music.playlist[0].includes("VIDEO_ID")) return;

  state.music.player = new YT.Player("musicFrame", {
    height: "0",
    width: "0",
    playerVars: {
      autoplay: 0,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1
    },
    events: {
      onReady: () => {
        state.music.ready = true;
        state.music.player.cuePlaylist(state.music.playlist);
        updateNowPlaying();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) {
          state.music.player.nextVideo();
          updateNowPlaying();
        }
      }
    }
  });
}

function toggleMusic() {
  if (!state.music.ready || !state.music.player) {
    createYouTubePlayer();
    return;
  }

  const status = state.music.player.getPlayerState();
  if (status === YT.PlayerState.PLAYING) {
    state.music.player.pauseVideo();
  } else {
    state.music.player.playVideo();
  }
}

function playNextSong() {
  if (!state.music.ready || !state.music.player) return;
  state.music.player.nextVideo();
  updateNowPlaying();
}

function playPreviousSong() {
  if (!state.music.ready || !state.music.player) return;
  state.music.player.previousVideo();
  updateNowPlaying();
}

function updateNowPlaying() {
  if (!els.musicNow || !state.music.player) return;
  const data = state.music.player.getVideoData();
  if (!data || !data.title) return;
  els.musicNow.textContent = `กำลังเล่น: ${data.title}`;
}

function closeMediaModal() {
  els.mediaModal.classList.remove("is-open");
  els.mediaStage.querySelectorAll("video").forEach((video) => video.pause());
  els.mediaStage.innerHTML = "";
  if (!els.letterModal.classList.contains("is-open") && els.startScreen.classList.contains("is-hidden")) {
    els.body.classList.remove("is-locked");
  }
}

function openLetter() {
  els.letterModal.classList.add("is-open");
  els.body.classList.add("is-locked");
}

function closeLetter() {
  els.letterModal.classList.remove("is-open");
  if (!els.mediaModal.classList.contains("is-open") && els.startScreen.classList.contains("is-hidden")) {
    els.body.classList.remove("is-locked");
  }
}

function startFloatingEffects() {
  if (state.particlesStarted || prefersReducedMotion) return;
  state.particlesStarted = true;

  window.setInterval(createHeartParticle, 900);
  window.setInterval(createSparkleParticle, 420);
}

function createHeartParticle() {
  const heart = document.createElement("span");
  heart.className = "heart-particle";
  heart.textContent = Math.random() > 0.5 ? "♥" : "♡";
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.bottom = "-2rem";
  heart.style.fontSize = `${0.8 + Math.random() * 1.3}rem`;
  document.body.append(heart);

  if (window.gsap) {
    gsap.to(heart, {
      y: -(window.innerHeight + 90),
      x: (Math.random() - 0.5) * 90,
      opacity: 0,
      rotation: (Math.random() - 0.5) * 46,
      duration: 4.8 + Math.random() * 2,
      ease: "sine.out",
      onComplete: () => heart.remove()
    });
  } else {
    heart.animate([
      { transform: "translateY(0)", opacity: 1 },
      { transform: `translateY(-${window.innerHeight + 90}px)`, opacity: 0 }
    ], { duration: 5600, easing: "ease-out" }).onfinish = () => heart.remove();
  }
}

function createSparkleParticle() {
  const sparkle = document.createElement("span");
  sparkle.className = "sparkle-particle";
  sparkle.style.left = `${Math.random() * 100}vw`;
  sparkle.style.top = `${Math.random() * 100}vh`;
  document.body.append(sparkle);

  sparkle.animate([
    { transform: "scale(0.2)", opacity: 0 },
    { transform: "scale(1)", opacity: 1 },
    { transform: "scale(0.2)", opacity: 0 }
  ], { duration: 1500 + Math.random() * 900, easing: "ease-in-out" }).onfinish = () => sparkle.remove();
}

function launchFinale() {
  if (state.finaleStarted && !prefersReducedMotion) return;
  state.finaleStarted = true;
  runConfetti(5200);
}

function runConfetti(duration) {
  const canvas = els.canvas;
  const context = canvas.getContext("2d");
  const colors = ["#f472b6", "#fff0f5", "#ffffff", "#e50914", "#67e8f9", "#fbbf24"];
  const pieces = [];
  const start = performance.now();

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  for (let index = 0; index < 170; index += 1) {
    pieces.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      size: 4 + Math.random() * 8,
      speed: 1.6 + Math.random() * 4.6,
      drift: -2 + Math.random() * 4,
      rotation: Math.random() * Math.PI,
      spin: -0.12 + Math.random() * 0.24,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function drawFirework(x, y, time) {
    const radius = 20 + Math.sin(time / 160) * 9;
    for (let index = 0; index < 24; index += 1) {
      const angle = (Math.PI * 2 * index) / 24;
      context.beginPath();
      context.arc(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
        2.2,
        0,
        Math.PI * 2
      );
      context.fillStyle = colors[index % colors.length];
      context.fill();
    }
  }

  function frame(now) {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    pieces.forEach((piece) => {
      piece.x += piece.drift;
      piece.y += piece.speed;
      piece.rotation += piece.spin;

      if (piece.y > window.innerHeight + 30) {
        piece.y = -20;
        piece.x = Math.random() * window.innerWidth;
      }

      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.64);
      context.restore();
    });

    drawFirework(window.innerWidth * 0.24, window.innerHeight * 0.28, now);
    drawFirework(window.innerWidth * 0.76, window.innerHeight * 0.32, now + 300);

    if (now - start < duration) {
      requestAnimationFrame(frame);
    } else {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      window.removeEventListener("resize", resize);
      state.finaleStarted = false;
    }
  }

  requestAnimationFrame(frame);
}

function emptyState(message) {
  return `<p class="empty-state">${message}</p>`;
}

function cleanName(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function memoryCaption(index) {
  const captions = [
    "เฟรมโปรดของเรา",
    "คืนที่อบอุ่น",
    "บันทึกวันเกิด",
    "ช่วงเวลาที่ดี",
    "เก็บไว้ในใจ",
    "อยากเก็บไว้ตลอดไป"
  ];

  return captions[index % captions.length];
}

