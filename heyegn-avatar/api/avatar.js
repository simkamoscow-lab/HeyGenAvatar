const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'API key missing' });

  const { avatarId = 'Wayne20240711', voiceId = 'en_US-neural', initialText = '' } = req.query;

  try {
    // Создание сессии
    const session = await axios.post('https://api.heygen.com/v1/streaming.new', {
      version: 'v2',
      avatar_name: avatarId,
      voice: { voice_id: voiceId },
      quality: 'high',
      video_encoding: 'H264'
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    const sessionId = session.data.data.session_id;

    // Старт сессии
    await axios.post('https://api.heygen.com/v1/streaming.start', 
      { session_id: sessionId },
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );

    // Начальный текст (опционально)
    if (initialText) {
      axios.post('https://api.heygen.com/v1/streaming.task', {
        session_id: sessionId,
        text: initialText,
        task_type: 'talk'
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      }).catch(() => {});
    }

    const baseUrl = req.headers.host.includes('localhost') ? 'http://' : 'https://';
    const htmlUrl = `${baseUrl}${req.headers.host}/api/avatar-page?...`
    res.json({
      sessionId,
      htmlUrl,
      accessToken: session.data.data.access_token,
      liveKitUrl: session.data.data.url
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
