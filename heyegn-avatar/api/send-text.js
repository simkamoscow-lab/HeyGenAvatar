const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { sessionId, text } = req.body;
  const apiKey = process.env.HEYGEN_API_KEY;

  try {
    await axios.post('https://api.heygen.com/v1/streaming.task', {
      session_id: sessionId,
      text,
      task_type: 'talk'
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
