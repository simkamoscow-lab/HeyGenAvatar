const axios = require('axios');

module.exports = async (req, res) => {
  // CORS headers - разреши все запросы
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Получи API Key из environment
  const apiKey = process.env.HEYGEN_API_KEY;
  
  if (!apiKey || apiKey === '@heygen_api_key') {
    return res.status(400).json({ 
      error: 'API Key not configured',
      message: 'Add HEYGEN_API_KEY to Vercel Environment Variables',
      currentValue: apiKey || 'UNDEFINED'
    });
  }

  // Параметры из URL
  const { 
    avatarId = 'Wayne20240711', 
    voiceId = 'en_US-neural', 
    initialText = '', 
    quality = 'high' 
  } = req.query;

  console.log('Request received:', { avatarId, voiceId, initialText });

  try {
    // ШАГ 1: Создание сессии
    console.log('[1/4] Creating HeyGen session...');
    
    const sessionResponse = await axios.post(
      'https://api.heygen.com/v1/streaming.new',
      {
        version: 'v2',
        avatar_name: avatarId,
        voice: {
          voice_id: voiceId
        },
        quality: quality,
        video_encoding: 'H264'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    if (!sessionResponse.data.data) {
      throw new Error('Invalid response from HeyGen API');
    }

    const sessionData = sessionResponse.data.data;
    const sessionId = sessionData.session_id;
    console.log('[1/4] Session c
