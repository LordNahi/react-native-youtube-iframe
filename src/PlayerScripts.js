import {MUTE_MODE, PAUSE_MODE, PLAY_MODE, UNMUTE_MODE} from './constants';

export const PLAYER_FUNCTIONS = {
  muteVideo: 'player.mute(); true;',
  unMuteVideo: 'player.unMute(); true;',
  playVideo: 'player.playVideo(); true;',
  pauseVideo: 'player.pauseVideo(); true;',
  getVideoUrlScript: `
window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'getVideoUrl', data: player.getVideoUrl()}));
true;
  `,
  durationScript: `
window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'getDuration', data: player.getDuration()}));
true;
`,
  currentTimeScript: `
window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'getCurrentTime', data: player.getCurrentTime()}));
true;
`,
  isMutedScript: `
window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'isMuted', data: player.isMuted()}));
true;
`,
  getVolumeScript: `
window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'getVolume', data: player.getVolume()}));
true;
`,
  getPlaybackRateScript: `
window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'getPlaybackRate', data: player.getPlaybackRate()}));
true;
`,
  getAvailablePlaybackRatesScript: `
window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'getAvailablePlaybackRates', data: player.getAvailablePlaybackRates()}));
true;
`,

  setVolume: volume => {
    return `player.setVolume(${volume}); true;`;
  },

  seekToScript: (seconds, allowSeekAhead) => {
    return `player.seekTo(${seconds}, ${allowSeekAhead}); true;`;
  },

  setPlaybackRate: playbackRate => {
    return `player.setPlaybackRate(${playbackRate}); true;`;
  },

  loadPlaylist: (playList, startIndex, play) => {
    const index = startIndex || 0;
    const func = play ? 'loadPlaylist' : 'cuePlaylist';

    const list = typeof playList === 'string' ? `"${playList}"` : 'undefined';
    const listType =
      typeof playList === 'string' ? `"${playlist}"` : 'undefined';
    const playlist = Array.isArray(playList)
      ? `"${playList.join(',')}"`
      : 'undefined';

    return `player.${func}({listType: ${listType}, list: ${list}, playlist: ${playlist}, index: ${index}}); true;`;
  },

  loadVideoById: (videoId, play) => {
    const func = play ? 'loadVideoById' : 'cueVideoById';

    return `player.${func}({videoId: ${JSON.stringify(videoId)}}); true;`;
  },

  setup: () => {
    return `
    player.addEventListener('onReady', onPlayerReady);
    player.addEventListener('onStateChange', onPlayerStateChange);
    player.addEventListener('onError', onPlayerError);
    player.addEventListener('onPlaybackQualityChange', onPlaybackQualityChange);
    player.addEventListener('onPlaybackRateChange', onPlaybackRateChange);
    console.log("Setup");
    true;
    `;
  },

  shutdown: () => {
    return `
    player.removeEventListener('onReady', onPlayerReady);
    player.removeEventListener('onStateChange', onPlayerStateChange);
    player.removeEventListener('onError', onPlayerError);
    player.removeEventListener(
      'onPlaybackQualityChange',
      onPlaybackQualityChange,
    );
    player.removeEventListener('onPlaybackRateChange', onPlaybackRateChange);
    console.log("Shutdown");
    true;
    `;
  },
};

export const playMode = {
  [PLAY_MODE]: PLAYER_FUNCTIONS.playVideo,
  [PAUSE_MODE]: PLAYER_FUNCTIONS.pauseVideo,
};

export const soundMode = {
  [MUTE_MODE]: PLAYER_FUNCTIONS.muteVideo,
  [UNMUTE_MODE]: PLAYER_FUNCTIONS.unMuteVideo,
};

export const MAIN_SCRIPT = (
  videoId,
  playList,
  initialPlayerParams,
  allowWebViewZoom,
  contentScale,
  playerWidth,
  playerHeight,
) => {
  const {
    end,
    rel,
    color,
    start,
    playerLang,
    loop = false,
    cc_lang_pref,
    iv_load_policy,
    modestbranding,
    controls = true,
    showClosedCaptions,
    preventFullScreen = false,
  } = initialPlayerParams;

  // _s postfix to refer to "safe"
  const rel_s = rel ? 1 : 0;
  const loop_s = loop ? 1 : 0;
  const videoId_s = videoId || '';
  const controls_s = controls ? 1 : 0;
  const cc_lang_pref_s = cc_lang_pref || '';
  const modestbranding_s = modestbranding ? 1 : 0;
  const preventFullScreen_s = preventFullScreen ? 0 : 1;
  const showClosedCaptions_s = showClosedCaptions ? 1 : 0;
  const contentScale_s = typeof contentScale === 'number' ? contentScale : 1.0;

  const list = typeof playList === 'string' ? playList : undefined;
  const listType = typeof playList === 'string' ? 'playlist' : undefined;
  const playlist = Array.isArray(playList) ? playList.join(',') : undefined;

  // scale will either be "initial-scale=1.0"
  let scale = `initial-scale=${contentScale_s}`;
  if (!allowWebViewZoom) {
    // or "initial-scale=0.8, maximum-scale=1.0"
    scale += `, maximum-scale=${contentScale_s}`;
  }

  const safeData = {
    end,
    list,
    start,
    color,
    rel_s,
    loop_s,
    listType,
    playlist,
    videoId_s,
    controls_s,
    playerLang,
    iv_load_policy,
    contentScale_s,
    cc_lang_pref_s,
    allowWebViewZoom,
    modestbranding_s,
    preventFullScreen_s,
    showClosedCaptions_s,
  };

  const urlEncodedJSON = encodeURI(JSON.stringify(safeData));

  const listParam = list ? `list: '${list}',` : '';
  const listTypeParam = listType ? `listType: '${list}',` : '';
  const playlistParam = playList ? `playlist: '${playList}',` : '';

  const htmlString = `
<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, height=device-height, ${scale}"
    >
    <style>
      body {
        margin: 0;
      }
      .video {
          left: -${Math.floor(playerWidth * 0.08)}px;
          top: -${Math.floor(playerHeight * 0.08)}px;
          position: absolute;
          width: 116%;
          height: 116%;
      }
    </style>
  </head>
  <body>
    <div class="video" id="player" />

    <script>
      var tag = document.createElement('script');

      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      var player;
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          width: '${playerWidth}',
          height: '${playerHeight}',
          videoId: '${videoId_s}',
          playerVars: {
            ${listParam}
            ${listTypeParam}
            ${playlistParam}
            end: ${end},
            rel: ${rel_s},
            playsinline: 1,
            loop: ${loop_s},
            color: ${color},
            start: ${start},
            hl: ${playerLang},
            controls: ${controls_s},
            fs: ${preventFullScreen_s},
            cc_lang_pref: '${cc_lang_pref_s}',
            iv_load_policy: ${iv_load_policy},
            modestbranding: ${modestbranding_s},
            cc_load_policy: ${showClosedCaptions_s},
          }
        });

        ${PLAYER_FUNCTIONS.setup()}
      }

      function onPlayerError(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'playerError', data: event.data}))
      }

      function onPlaybackRateChange(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'playbackRateChange', data: event.data}))
      }

      function onPlaybackQualityChange(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'playerQualityChange', data: event.data}))
      }

      function onPlayerReady(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'playerReady'}))
      }

      function onPlayerStateChange(event) {
        window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'playerStateChange', data: event.data}))
      }

      var isFullScreen = false;
      function onFullScreenChange() {
        isFullScreen = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        window.ReactNativeWebView.postMessage(JSON.stringify({eventType: 'fullScreenChange', data: Boolean(isFullScreen)}));
      }
    </script>
  </body>
</html>
`;

  return {htmlString, urlEncodedJSON};
};
