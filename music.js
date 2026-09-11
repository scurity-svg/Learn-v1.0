/* ZARRLEARN PREMIUM - MUSIC PLAYER */

window.zlPlaylist = [
  { name: 'Lofi Study Beats', artist: 'Chill Music', id: 'jfKfPfyJRdk', dur: 'LIVE' },
  { name: 'Deep Focus', artist: 'Focus Music', id: 'n61ULEU7CO0', dur: '1:00:00' },
  { name: 'Study Piano', artist: 'Relaxing Piano', id: '4oStw0r33so', dur: '2:00:00' },
  { name: 'Brain Power', artist: 'Mozart', id: 'jgpJVI3tDbY', dur: '1:30:00' },
  { name: 'Lo-Fi Hip Hop', artist: 'Lofi Girl', id: 'lTRiuFIWV54', dur: 'LIVE' },
  { name: 'Classical Study', artist: 'Beethoven', id: '_mVW8tgGY_w', dur: '1:00:00' },
  { name: 'Ambient Focus', artist: 'Deep Space', id: '1KaOrSuWZeM', dur: '45:00' },
  { name: 'Rain Sounds', artist: 'Nature', id: 'mPZkdNFkNps', dur: '3:00:00' }
];

var ZLM = {
  current: 0,
  player: null,
  playing: false,
  muted: false,
  ready: false,
  volume: 60
};

ZLM.loadAPI = function() {
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
};

window.onYouTubeIframeAPIReady = function() {
  ZLM.player = new YT.Player('ytPlayer', {
    height: '1',
    width: '1',
    videoId: window.zlPlaylist[0].id,
    playerVars: {
      autoplay: 0,
      controls: 0,
      loop: 0,
      playlist: window.zlPlaylist[0].id,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0,
      playsinline: 1
    },
    events: {
      onReady: function(e) {
        ZLM.ready = true;
        e.target.setVolume(ZLM.volume);
        ZL.toast('Music player siap!');
      },
      onStateChange: function(e) {
        if (e.data === YT.PlayerState.PLAYING) {
          ZLM.playing = true;
          var pb = document.getElementById('mdPlay');
          if (pb) pb.textContent = 'II';
          var wave = document.getElementById('mdWave');
          if (wave) wave.classList.remove('paused');
        } else if (e.data === YT.PlayerState.PAUSED) {
          ZLM.playing = false;
          var pb2 = document.getElementById('mdPlay');
          if (pb2) pb2.textContent = '>';
          var wave2 = document.getElementById('mdWave');
          if (wave2) wave2.classList.add('paused');
        } else if (e.data === YT.PlayerState.ENDED) {
          ZLM.next();
        }
      },
      onError: function(e) {
        console.log('YT Error:', e.data);
        setTimeout(function() { ZLM.next(); }, 1000);
      }
    }
  });
};

ZLM.playTrack = function(i) {
  if (!ZLM.ready) { ZL.toast('Memuat player...'); return; }
  ZLM.current = i;
  var song = window.zlPlaylist[i];
  try {
    ZLM.player.loadVideoById(song.id);
    ZLM.player.setVolume(ZLM.volume);
    ZLM.player.playVideo();
    ZLM.playing = true;
    var pb = document.getElementById('mdPlay');
    if (pb) pb.textContent = 'II';
    var title = document.getElementById('mdTitle');
    if (title) title.textContent = song.name;
    var artist = document.getElementById('mdArtist');
    if (artist) artist.textContent = song.artist;
    var wave = document.getElementById('mdWave');
    if (wave) wave.classList.remove('paused');
    var tracks = document.querySelectorAll('.md-track');
    for (var k = 0; k < tracks.length; k++) {
      tracks[k].classList.toggle('active', k === i);
      var num = tracks[k].querySelector('.md-track-num');
      if (num) num.textContent = (k === i) ? '>' : (k + 1);
    }
  } catch (e) { console.log(e); }
};

ZLM.toggle = function() {
  if (!ZLM.ready) { ZL.toast('Memuat player...'); return; }
  if (!ZLM.playing) {
    if (ZLM.player.getPlayerState() === YT.PlayerState.PAUSED) {
      ZLM.player.playVideo();
    } else {
      ZLM.playTrack(ZLM.current);
    }
  } else {
    ZLM.player.pauseVideo();
  }
};

ZLM.next = function() {
  ZLM.playTrack((ZLM.current + 1) % window.zlPlaylist.length);
};

ZLM.prev = function() {
  ZLM.playTrack((ZLM.current - 1 + window.zlPlaylist.length) % window.zlPlaylist.length);
};

ZLM.toggleExpand = function() {
  var dock = document.getElementById('musicDock');
  if (dock) dock.classList.toggle('expanded');
};

ZLM.setVolume = function(v) {
  ZLM.volume = parseInt(v);
  if (ZLM.player && ZLM.ready) ZLM.player.setVolume(ZLM.volume);
};

ZLM.initEvents = function() {
  var top = document.getElementById('mdTop');
  if (top) top.addEventListener('click', ZLM.toggleExpand);

  var play = document.getElementById('mdPlay');
  if (play) play.addEventListener('click', function(e) {
    e.stopPropagation();
    ZLM.toggle();
  });

  var next = document.getElementById('mdNext');
  if (next) next.addEventListener('click', function(e) {
    e.stopPropagation();
    ZLM.next();
  });

  var prev = document.getElementById('mdPrev');
  if (prev) prev.addEventListener('click', function(e) {
    e.stopPropagation();
    ZLM.prev();
  });

  var vol = document.getElementById('mdVolume');
  if (vol) {
    vol.addEventListener('input', function() {
      ZLM.setVolume(this.value);
    });
  }
};

setTimeout(function() {
  ZLM.loadAPI();
  ZLM.initEvents();
}, 500);

window.ZLM = ZLM;
