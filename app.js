/* ZARRLEARN PREMIUM - APP LOGIC */

var ZL = {
  state: {
    poin: parseInt(localStorage.getItem('zl_poin') || '0'),
    soal: parseInt(localStorage.getItem('zl_soal') || '0'),
    benar: parseInt(localStorage.getItem('zl_benar') || '0'),
    streak: parseInt(localStorage.getItem('zl_streak') || '0'),
    riwayat: JSON.parse(localStorage.getItem('zl_riwayat') || '[]'),
    jenjang: '', kelas: '', mapel: '',
    soalAktif: [], nomorSoal: 0,
    benarKuis: 0, salahKuis: 0, poinKuis: 0,
    timer: null, waktuTersisa: 0,
    modeIQ: false, waktuMulai: 0,
    kamusFilter: 'semua',
    materiAktif: 'matematika',
    fcDeck: null, fcIndex: 0, fcCards: []
  }
};

ZL.init = function() {
  ZL.updateStats();
  ZL.cekStreak();
  ZL.renderMapel();
  ZL.startParticles();
  ZL.buildPlaylist();
  ZL.renderKamus();
  ZL.renderMateriTabs();
  ZL.renderMateri();
  ZL.renderFlashcardDecks();
  ZL.renderTips();
  ZL.renderRiwayat();
  ZL.loadMusic();
  setTimeout(function() {
    var ls = document.getElementById('loadingScreen');
    if (ls) ls.classList.add('hidden');
  }, 1500);
  setTimeout(function() { ZL.toast('ZarrLearn Premium siap!'); }, 1800);
};

ZL.loadMusic = function() {
  var s = document.createElement('script');
  s.src = 'music.js';
  document.head.appendChild(s);
};

ZL.updateStats = function() {
  var s = ZL.state;
  function setT(id, val) { var e = document.getElementById(id); if (e) e.textContent = val; }
  setT('hPoin', s.poin);
  setT('hStreak', s.streak);
  setT('sPoin', s.poin);
  setT('sSoal', s.soal);
  setT('sStreak', s.streak);
  var akurasi = s.soal > 0 ? Math.round((s.benar / s.soal) * 100) : 0;
  setT('sAkurasi', akurasi + '%');
  var level = Math.floor(s.poin / 100) + 1;
  setT('hLevel', level);
  setT('xpLevel', level);
  var xpNow = s.poin % 100;
  setT('xpNow', xpNow);
  setT('xpMax', '100');
  var xf = document.getElementById('xpFill');
  if (xf) xf.style.width = xpNow + '%';
  ZL.renderRiwayat();
};

ZL.cekStreak = function() {
  var last = localStorage.getItem('zl_lastDate');
  var today = new Date().toDateString();
  if (last !== today) {
    localStorage.setItem('zl_lastDate', today);
    if (last) {
      var y = new Date(Date.now() - 86400000).toDateString();
      ZL.state.streak = (last === y) ? ZL.state.streak + 1 : 1;
    } else ZL.state.streak = 1;
    localStorage.setItem('zl_streak', ZL.state.streak);
  }
};

ZL.saveState = function() {
  var s = ZL.state;
  localStorage.setItem('zl_poin', s.poin);
  localStorage.setItem('zl_soal', s.soal);
  localStorage.setItem('zl_benar', s.benar);
  localStorage.setItem('zl_streak', s.streak);
  localStorage.setItem('zl_riwayat', JSON.stringify(s.riwayat));
};

ZL.showPanel = function(id) {
  document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
  var t = document.getElementById('panel-' + id);
  if (t) t.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

ZL.pilihJenjang = function(j) {
  ZL.state.jenjang = j;
  var kelasMap = { SD: [1,2,3,4,5,6], SMP: [7,8,9], SMA: [10,11,12] };
  var grid = document.getElementById('kelasGrid');
  if (!grid) return;
  grid.innerHTML = '';
  kelasMap[j].forEach(function(k) {
    var el = document.createElement('div');
    el.className = 'kelas-card';
    el.innerHTML = '📖 Kelas ' + k;
    el.onclick = function() { ZL.pilihKelas(k); };
    grid.appendChild(el);
  });
  var list = document.getElementById('kelasList');
  if (list) list.style.display = 'block';
};

ZL.pilihKelas = function(k) {
  ZL.state.kelas = k;
  ZL.showPanel('pilihMapel');
  var t = document.getElementById('mapelTitle');
  if (t) t.textContent = '📖 Kelas ' + k + ' - Pilih Mapel';
  ZL.renderMapel();
};

ZL.renderMapel = function() {
  var grid = document.getElementById('mapelGrid');
  if (!grid) return;
  grid.innerHTML = '';
  var data = mapelPerJenjang[ZL.state.jenjang] || mapelPerJenjang.SD;
  Object.keys(data).forEach(function(key) {
    var m = data[key];
    var el = document.createElement('div');
    el.className = 'mapel-card';
    el.innerHTML = '<div class="mapel-icon">' + m.ic + '</div><h4>' + m.nama + '</h4><p>' + m.desc + '</p>';
    el.onclick = function() { ZL.mulaiKuis(key); };
    grid.appendChild(el);
  });
};

ZL.mulaiKuis = function(mapelKey) {
  ZL.state.mapel = mapelKey;
  ZL.state.modeIQ = false;
  var kd = bankSoal[ZL.state.jenjang] && bankSoal[ZL.state.jenjang][ZL.state.kelas];
  var soal = (kd && kd[mapelKey]) || [];
  if (soal.length === 0) { ZL.toast('Soal belum tersedia'); return; }
  ZL.state.soalAktif = soal.slice().sort(function() { return Math.random() - 0.5; });
  ZL.state.nomorSoal = 0;
  ZL.state.benarKuis = 0;
  ZL.state.salahKuis = 0;
  ZL.state.poinKuis = 0;
  var qm = document.getElementById('qMapel');
  if (qm) qm.textContent = mapelKey.toUpperCase();
  var qt = document.getElementById('qTotal');
  if (qt) qt.textContent = ZL.state.soalAktif.length;
  var qtb = document.getElementById('qTimerBox');
  if (qtb) qtb.style.display = 'none';
  ZL.showPanel('quiz');
  ZL.tampilSoal();
};

ZL.mulaiIQ = function() {
  ZL.state.modeIQ = true;
  ZL.state.soalAktif = soalIQ.slice().sort(function() { return Math.random() - 0.5; });
  ZL.state.nomorSoal = 0;
  ZL.state.benarKuis = 0;
  ZL.state.salahKuis = 0;
  ZL.state.poinKuis = 0;
  ZL.state.waktuMulai = Date.now();
  ZL.state.waktuTersisa = 20 * 60;
  var qm = document.getElementById('qMapel');
  if (qm) qm.textContent = 'TES IQ';
  var qt = document.getElementById('qTotal');
  if (qt) qt.textContent = ZL.state.soalAktif.length;
  var qtb = document.getElementById('qTimerBox');
  if (qtb) qtb.style.display = 'flex';
  ZL.showPanel('quiz');
  ZL.startTimer();
  ZL.tampilSoal();
};

ZL.startTimer = function() {
  clearInterval(ZL.state.timer);
  ZL.updateTimerDisplay();
  ZL.state.timer = setInterval(function() {
    ZL.state.waktuTersisa--;
    ZL.updateTimerDisplay();
    if (ZL.state.waktuTersisa <= 0) {
      clearInterval(ZL.state.timer);
      ZL.selesaiIQ();
    }
  }, 1000);
};

ZL.updateTimerDisplay = function() {
  var m = Math.floor(ZL.state.waktuTersisa / 60);
  var s = ZL.state.waktuTersisa % 60;
  var el = document.getElementById('qTimer');
  if (!el) return;
  el.textContent = m + ':' + String(s).padStart(2, '0');
  if (ZL.state.waktuTersisa <= 60) el.classList.add('timer-warn');
  else el.classList.remove('timer-warn');
};

ZL.tampilSoal = function() {
  if (ZL.state.nomorSoal >= ZL.state.soalAktif.length) {
    if (ZL.state.modeIQ) ZL.selesaiIQ(); else ZL.selesaiKuis();
    return;
  }
  var soal = ZL.state.soalAktif[ZL.state.nomorSoal];
  function setT(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  setT('qNomor', ZL.state.nomorSoal + 1);
  setT('qPoin', ZL.state.poinKuis);
  var prog = document.getElementById('qProgress');
  if (prog) prog.style.width = ((ZL.state.nomorSoal) / ZL.state.soalAktif.length * 100) + '%';
  var qt = document.getElementById('qText');
  if (qt) qt.textContent = soal.q;
  var opts = document.getElementById('qOptions');
  if (opts) {
    var html = '';
    soal.o.forEach(function(o, i) {
      html += '<div class="option" onclick="ZL.jawab(' + i + ')" data-i="' + i + '">';
      html += '<div class="option-num">' + String.fromCharCode(65 + i) + '</div>';
      html += '<div>' + o + '</div></div>';
    });
    opts.innerHTML = html;
  }
  var next = document.getElementById('qNext');
  if (next) next.style.display = 'none';
};

ZL.jawab = function(pilih) {
  var soal = ZL.state.soalAktif[ZL.state.nomorSoal];
  var opts = document.querySelectorAll('.option');
  opts.forEach(function(el) { el.onclick = null; });
  if (opts[soal.a]) opts[soal.a].classList.add('correct');
  if (pilih !== soal.a) {
    if (opts[pilih]) opts[pilih].classList.add('wrong');
    ZL.state.salahKuis++;
  } else {
    ZL.state.benarKuis++;
    ZL.state.poinKuis += 10;
    ZL.state.poin += 10;
    ZL.state.benar++;
  }
  ZL.state.soal++;
  ZL.saveState();
  ZL.updateStats();
  var qp = document.getElementById('qPoin');
  if (qp) qp.textContent = ZL.state.poinKuis;
  var next = document.getElementById('qNext');
  if (next) {
    next.style.display = 'block';
    next.textContent = ZL.state.nomorSoal >= ZL.state.soalAktif.length - 1 ? 'Selesai' : 'Soal Berikutnya';
  }
};

ZL.nextQuestion = function() {
  ZL.state.nomorSoal++;
  if (ZL.state.nomorSoal >= ZL.state.soalAktif.length) {
    if (ZL.state.modeIQ) ZL.selesaiIQ(); else ZL.selesaiKuis();
  } else ZL.tampilSoal();
};

ZL.selesaiKuis = function() {
  clearInterval(ZL.state.timer);
  var total = ZL.state.soalAktif.length;
  var akurasi = Math.round((ZL.state.benarKuis / total) * 100);
  ZL.state.riwayat.push({
    tgl: new Date().toLocaleString('id-ID'),
    jenis: 'Kuis ' + ZL.state.jenjang + ' K' + ZL.state.kelas + ' - ' + ZL.state.mapel,
    benar: ZL.state.benarKuis, salah: ZL.state.salahKuis,
    akurasi: akurasi, poin: ZL.state.poinKuis
  });
  ZL.saveState();
  ZL.updateStats();
  var icon = '🎉', title = 'Selamat!';
  if (akurasi >= 90) { icon = '🏆'; title = 'Luar Biasa!'; ZL.showAchieve('Perfect Score!'); }
  else if (akurasi >= 70) { icon = '🎯'; title = 'Bagus!'; }
  else if (akurasi < 50) { icon = '📚'; title = 'Belajar Lagi Ya!'; }
  ZL.toast(icon + ' ' + title + ' Akurasi: ' + akurasi + '% +' + ZL.state.poinKuis + ' poin');
  ZL.showPanel('home');
};

ZL.selesaiIQ = function() {
  clearInterval(ZL.state.timer);
  var total = ZL.state.soalAktif.length;
  var benar = ZL.state.benarKuis;
  var salah = ZL.state.salahKuis;
  var durasi = Math.round((Date.now() - ZL.state.waktuMulai) / 1000);
  var iq = Math.round(70 + (benar / total) * 80 + (Math.random() * 6 - 3));
  if (iq < 70) iq = 70;
  if (iq > 150) iq = 150;
  function setT(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  setT('iqSkor', iq);
  setT('iqBenar', benar);
  setT('iqSalah', salah);
  setT('iqWaktu', durasi + 's');
  var kat, desc;
  if (iq >= 130) { kat = 'Sangat Superior'; desc = 'Kecerdasan luar biasa! Top 2% populasi.'; }
  else if (iq >= 120) { kat = 'Superior'; desc = 'Kecerdasan di atas rata-rata. Top 10%'; }
  else if (iq >= 110) { kat = 'Di Atas Rata-rata'; desc = 'Lebih tinggi dari kebanyakan orang.'; }
  else if (iq >= 90) { kat = 'Rata-rata'; desc = 'Kecerdasan normal, sesuai mayoritas.'; }
  else if (iq >= 80) { kat = 'Di Bawah Rata-rata'; desc = 'Terus berlatih tingkatkan kemampuan.'; }
  else { kat = 'Perlu Latihan'; desc = 'Jangan menyerah, latihan rutin bikin jenius.'; }
  setT('iqKategori', kat);
  setT('iqDesc', desc);
  ZL.state.riwayat.push({
    tgl: new Date().toLocaleString('id-ID'),
    jenis: 'Tes IQ',
    benar: benar, salah: salah,
    akurasi: Math.round((benar / total) * 100),
    poin: benar * 20, iq: iq
  });
  ZL.state.poin += benar * 20;
  ZL.saveState();
  ZL.updateStats();
  if (iq >= 120) ZL.showAchieve('IQ ' + iq + '!');
  ZL.showPanel('iqHasil');
};

ZL.quitQuiz = function() {
  clearInterval(ZL.state.timer);
  ZL.showPanel('home');
};

ZL.renderKamus = function() {
  var filter = document.getElementById('kamusFilter');
  if (filter) {
    var cats = ['semua', 'matematika', 'ipa', 'fisika', 'kimia', 'bio', 'ips', 'bindo', 'bing'];
    var labels = { semua: 'Semua', matematika: 'MTK', ipa: 'IPA', fisika: 'Fisika', kimia: 'Kimia', bio: 'Bio', ips: 'IPS', bindo: 'B.Indo', bing: 'B.Ing' };
    var html = '';
    cats.forEach(function(c) {
      html += '<div class="kf-chip ' + (ZL.state.kamusFilter === c ? 'active' : '') + '" onclick="ZL.setKamusFilter(\'' + c + '\')">' + labels[c] + '</div>';
    });
    filter.innerHTML = html;
  }
  ZL.filterKamus();
};

ZL.setKamusFilter = function(cat) {
  ZL.state.kamusFilter = cat;
  ZL.renderKamus();
};

ZL.filterKamus = function() {
  var sb = document.getElementById('kamusSearch');
  var search = sb ? sb.value.toLowerCase() : '';
  var list = document.getElementById('kamusList');
  if (!list) return;
  var filtered = kamusData;
  if (ZL.state.kamusFilter !== 'semua') {
    filtered = filtered.filter(function(k) { return k.cat === ZL.state.kamusFilter; });
  }
  if (search) {
    filtered = filtered.filter(function(k) {
      return k.term.toLowerCase().indexOf(search) !== -1 || k.def.toLowerCase().indexOf(search) !== -1;
    });
  }
  if (filtered.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:#6b6b85;font-size:12px">Tidak ditemukan</div>';
    return;
  }
  var html = '';
  filtered.forEach(function(k) {
    html += '<div class="kamus-item"><div class="kamus-term">' + k.term + '</div>';
    html += '<div class="kamus-def">' + k.def + '</div>';
    html += '<div class="kamus-cat">' + k.cat.toUpperCase() + '</div></div>';
  });
  list.innerHTML = html;
};

ZL.renderMateriTabs = function() {
  var tabs = document.getElementById('materiTabs');
  if (!tabs) return;
  var keys = Object.keys(materiData);
  var labels = { matematika: 'MTK', ipa: 'IPA', ips: 'IPS', bindo: 'B.Indo', bing: 'B.Ing', fisika: 'Fisika', kimia: 'Kimia', bio: 'Bio' };
  var html = '';
  keys.forEach(function(k) {
    html += '<div class="materi-tab ' + (ZL.state.materiAktif === k ? 'active' : '') + '" onclick="ZL.setMateri(\'' + k + '\')">' + labels[k] + '</div>';
  });
  tabs.innerHTML = html;
};

ZL.setMateri = function(k) {
  ZL.state.materiAktif = k;
  ZL.renderMateriTabs();
  ZL.renderMateri();
};

ZL.renderMateri = function() {
  var content = document.getElementById('materiContent');
  if (!content) return;
  var data = materiData[ZL.state.materiAktif] || [];
  if (data.length === 0) {
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#6b6b85;font-size:12px">Materi belum tersedia</div>';
    return;
  }
  var html = '';
  data.forEach(function(m) {
    html += '<div class="materi-card"><h4>' + m.title + '</h4><p>' + m.content + '</p></div>';
  });
  content.innerHTML = html;
};

ZL.renderFlashcardDecks = function() {
  var sel = document.getElementById('flashcardSelector');
  if (!sel) return;
  var keys = Object.keys(flashcardDecks);
  var labels = { matematika: 'MTK', ipa: 'IPA', ips: 'IPS', bindo: 'B.Indo', bing: 'B.Ing', fisika: 'Fisika', kimia: 'Kimia', bio: 'Bio' };
  var html = '';
  keys.forEach(function(k) {
    html += '<div class="fc-deck-btn ' + (ZL.state.fcDeck === k ? 'active' : '') + '" onclick="ZL.setDeck(\'' + k + '\')">' + labels[k] + '</div>';
  });
  sel.innerHTML = html;
};

ZL.setDeck = function(k) {
  ZL.state.fcDeck = k;
  ZL.state.fcCards = flashcardDecks[k] || [];
  ZL.state.fcIndex = 0;
  ZL.renderFlashcardDecks();
  ZL.showCard();
};

ZL.showCard = function() {
  var front = document.getElementById('fcFront');
  var back = document.getElementById('fcBack');
  var counter = document.getElementById('fcCounter');
  var card = document.getElementById('flashcard');
  if (card) card.classList.remove('flipped');
  if (ZL.state.fcCards.length === 0) {
    if (front) front.textContent = 'Pilih deck dulu';
    if (back) back.textContent = '-';
    if (counter) counter.textContent = '0 / 0';
    return;
  }
  var c = ZL.state.fcCards[ZL.state.fcIndex];
  if (front) front.textContent = c.q;
  if (back) back.textContent = c.a;
  if (counter) counter.textContent = (ZL.state.fcIndex + 1) + ' / ' + ZL.state.fcCards.length;
};

ZL.flipCard = function() {
  var card = document.getElementById('flashcard');
  if (card) card.classList.toggle('flipped');
};

ZL.nextCard = function() {
  if (ZL.state.fcCards.length === 0) return;
  ZL.state.fcIndex = (ZL.state.fcIndex + 1) % ZL.state.fcCards.length;
  ZL.showCard();
};

ZL.prevCard = function() {
  if (ZL.state.fcCards.length === 0) return;
  ZL.state.fcIndex = (ZL.state.fcIndex - 1 + ZL.state.fcCards.length) % ZL.state.fcCards.length;
  ZL.showCard();
};

ZL.renderRiwayat = function() {
  var el = document.getElementById('riwayatList');
  if (!el) return;
  if (ZL.state.riwayat.length === 0) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:#6b6b85;font-size:12px">Belum ada riwayat belajar</div>';
    return;
  }
  var html = '';
  ZL.state.riwayat.slice().reverse().slice(0, 20).forEach(function(r) {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:12px;margin-bottom:8px;font-size:11px">';
    html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px;gap:8px"><b style="color:#f9d976">' + r.jenis + '</b>';
    html += '<span style="color:#6b6b85;font-size:9px;white-space:nowrap">' + r.tgl + '</span></div>';
    html += '<div style="color:#a0a0b8">Benar ' + r.benar + ' - Salah ' + r.salah + ' - Akurasi ' + r.akurasi + '%';
    if (r.iq) html += ' - IQ ' + r.iq;
    html += '</div></div>';
  });
  el.innerHTML = html;
};

ZL.renderTips = function() {
  var el = document.getElementById('tipsList');
  if (!el) return;
  var html = '';
  tipsData.forEach(function(t) {
    html += '<div class="tip-item"><b>' + t.t + '</b><br>' + t.d + '</div>';
  });
  el.innerHTML = html;
};

ZL.toast = function(msg) {
  var t = document.getElementById('toast');
  var txt = document.getElementById('toastText');
  if (!t) return;
  if (txt) txt.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3000);
};

ZL.showAchieve = function(text) {
  var a = document.getElementById('achieve');
  var txt = document.getElementById('achieveText');
  if (!a) return;
  if (txt) txt.textContent = text;
  a.classList.add('show');
  setTimeout(function() { a.classList.remove('show'); }, 4000);
};

ZL.startParticles = function() {
  var canvas = document.getElementById('particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var particles = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  for (var i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5
    });
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function(p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.fill();
    });
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(139, 92, 246, ' + (0.15 * (1 - d / 130)) + ')';
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
};

ZL.buildPlaylist = function() {
  var list = document.getElementById('mdPlaylist');
  if (!list) return;
  var playlist = window.zlPlaylist || [];
  var html = '';
  playlist.forEach(function(song, i) {
    html += '<div class="md-track ' + (i === 0 ? 'active' : '') + '" data-i="' + i + '" onclick="ZLM.playTrack(' + i + ')">';
    html += '<div class="md-track-num">' + (i === 0 ? '>' : (i + 1)) + '</div>';
    html += '<div class="md-track-name">' + song.name + '<div class="md-track-artist">' + song.artist + '</div></div>';
    html += '<div class="md-track-time">' + song.dur + '</div>';
    html += '</div>';
  });
  list.innerHTML = html;
  var cnt = document.getElementById('mdCount');
  if (cnt) cnt.textContent = playlist.length + ' lagu';
};

document.addEventListener('DOMContentLoaded', function() { ZL.init(); });
window.ZL = ZL;
