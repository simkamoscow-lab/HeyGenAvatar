const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.HEYGEN_API_KEY;
  
  if (!apiKey || apiKey === '@heygen_api_key') {
    return res.status(400).json({ 
      error: 'HEYGEN_API_KEY не установлен на Vercel!',
      hint: 'Settings → Environment Variables → добавь HEYGEN_API_KEY'
    });
  }

  const { avatarId = 'Wayne20240711', voiceId = 'en_US-neutral', initialText = '' } = req.query;

  try {
    // Создание сессии
    const session = await axios.post(
      'https://api.heygen.com/v1/streaming.new',
      {
        version: 'v2',
        avatar_name: avatarId,
        voice: { voice_id: voiceId },
        quality: 'high',
        video_encoding: 'H264'
      },
      {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    const sessionId = session.data.data.session_id;
    const accessToken = session.data.data.access_token;
    const liveKitUrl = session.data.data.url;

    // Старт сессии
    await axios.post(
      'https://api.heygen.com/v1/streaming.start',
      { session_id: sessionId },
      { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    // Отправка начального текста (если есть)
    if (initialText && initialText.trim()) {
      axios.post(
        'https://api.heygen.com/v1/streaming.task',
        { session_id: sessionId, text: initialText, task_type: 'talk' },
        { headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 10000 }
      ).catch(() => {});
    }

    // Генерируем URL на avatar-page (это будет обслуживать HTML)
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const htmlUrl = `${protocol}://${host}/api/avatar-page?sessionId=${encodeURIComponent(sessionId)}&accessToken=${encodeURIComponent(accessToken)}&liveKitUrl=${encodeURIComponent(liveKitUrl)}`;

    res.status(200).json({
      success: true,
      sessionId,
      htmlUrl,
      accessToken,
      liveKitUrl
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error || error.message
    });
  }
};
