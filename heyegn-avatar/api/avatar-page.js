module.exports = async (req, res) => {
  const { sessionId, accessToken, liveKitUrl } = req.query;

  if (!sessionId || !accessToken || !liveKitUrl) {
    return res.status(400).send('Missing parameters');
  }

  // HTML контент который обслуживается как API ответ
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HeyGen Avatar</title>
    <script src="https://cdn.jsdelivr.net/npm/livekit-client@0.18.0/dist/livekit-client.umd.min.js"><\/script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #000; 
            width: 100%; 
            height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-family: Arial, sans-serif; 
        }
        #video-container { 
            width: 100%; 
            height: 100%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: relative; 
        }
        video { 
            max-width: 100%; 
            max-height: 100%; 
            object-fit: contain; 
        }
        #status { 
            position: absolute; 
            top: 20px; 
            left: 20px; 
            background: rgba(0, 0, 0, 0.9); 
            color: #fff; 
            padding: 15px 20px; 
            border-radius: 8px; 
            font-size: 14px; 
            min-width: 200px; 
            text-align: center; 
            z-index: 100;
            font-weight: bold;
        }
        #status.success { color: #4ade80; }
        #status.error { color: #ff6b6b; }
        #status.loading { color: #60a5fa; }
    </style>
</head>
<body>
    <div id="video-container">
        <video id="avatarVideo" autoplay playsinline muted><\/video>
    </div>
    <div id="status" class="loading">🔄 Подключение...</div>

    <script>
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('sessionId');
        const accessToken = params.get('accessToken');
        const liveKitUrl = params.get('liveKitUrl');

        const statusEl = document.getElementById('status');
        const videoEl = document.getElementById('avatarVideo');
        let room = null;
        let mediaStream = null;

        async function connectToAvatar() {
            try {
                if (!sessionId || !accessToken || !liveKitUrl) {
                    throw new Error('Missing connection parameters');
                }

                statusEl.textContent = '⏳ Подключение к серверу...';
                statusEl.className = 'loading';

                // Создание комнаты
                room = new window.LivekitClient.Room({
                    adaptiveStream: true,
                    dynacast: true,
                });

                // События
                room.on(window.LivekitClient.RoomEvent.Connected, () => {
                    console.log('✅ Подключено к серверу');
                    statusEl.textContent = '⏳ Ожидание видео...';
                    statusEl.className = 'loading';
                });

                room.on(window.LivekitClient.RoomEvent.TrackSubscribed, (track) => {
                    console.log('📹 Видео трек получен');
                    
                    if (!mediaStream) {
                        mediaStream = new MediaStream();
                        videoEl.srcObject = mediaStream;
                    }

                    mediaStream.addTrack(track.mediaStreamTrack);
                    
                    if (track.kind === 'video') {
                        statusEl.textContent = '✅ Готово!';
                        statusEl.className = 'success';
                    }
                });

                room.on(window.LivekitClient.RoomEvent.TrackUnsubscribed, (track) => {
                    if (mediaStream && track.mediaStreamTrack) {
                        mediaStream.removeTrack(track.mediaStreamTrack);
                    }
                });

                room.on(window.LivekitClient.RoomEvent.Disconnected, () => {
                    statusEl.textContent = '❌ Соединение разорвано';
                    statusEl.className = 'error';
                });

                room.on(window.LivekitClient.RoomEvent.Error, (error) => {
                    statusEl.textContent = '❌ Ошибка: ' + error.message;
                    statusEl.className = 'error';
                });

                // Подключаемся
                await room.connect(liveKitUrl, accessToken);
                console.log('✅ Соединение установлено');

            } catch (error) {
                console.error('❌ Ошибка:', error);
                statusEl.textContent = '❌ ' + error.message;
                statusEl.className = 'error';
            }
        }

        // Стартуем подключение при загрузке
        connectToAvatar();

        // Очистка при закрытии
        window.addEventListener('beforeunload', () => {
            if (room) {
                room.disconnect();
            }
        });
    </script>
</body>
</html>`;

  // Отправляем HTML как текст
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(html);
};
