export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { entry } = req.body;

    if (!entry || !entry.content) {
      return res.status(400).json({ error: 'Entry content is required' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Generate all 4 versions
    const versions = await generateAllVersions(entry, apiKey);

    return res.status(200).json({ versions });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function generateAllVersions(entry, apiKey) {
  const styles = [
    {
      name: 'poetic',
      title: 'Fragmented/Poetic',
      prompt: createPoeticPrompt(entry)
    },
    {
      name: 'news',
      title: 'News Feature',
      prompt: createNewsPrompt(entry)
    },
    {
      name: 'humorous',
      title: 'Observational/Humorous',
      prompt: createHumorousPrompt(entry)
    },
    {
      name: 'literary',
      title: 'Literary/Personal Essay',
      prompt: createLiteraryPrompt(entry)
    }
  ];

  const results = await Promise.all(
    styles.map(async (style) => {
      const content = await callClaudeAPI(style.prompt, apiKey);
      return {
        name: style.name,
        title: style.title,
        content: content
      };
    })
  );

  return results;
}

async function callClaudeAPI(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',  // ← Sonnet 4 (latest), // ← Auto-updates to latest 3.5,  // ← Latest Sonnet 4 (recommended)',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    // Try to include response body for better error messages (some APIs return JSON/text explaining the error)
    let bodyText;
    try {
      bodyText = await response.text();
    } catch (e) {
      bodyText = '<unable to read response body>';
    }
    throw new Error(`API request failed: ${response.status} - ${bodyText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function createPoeticPrompt(entry) {
  return `Transform this journal entry into a fragmented, poetic style. Use short lines, white space, and evocative imagery. Make it feel contemplative and artistic.

Entry:
Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}

Content:
${entry.content}

Write ONLY the transformed version in a fragmented, poetic style. No preamble or explanation.`;
}

function createNewsPrompt(entry) {
  return `Rewrite this journal entry as a compelling news feature article in the style of the New York Times. Use journalistic structure, vivid details, and make it feel significant.

Entry:
Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}

Content:
${entry.content}

Write ONLY the news article version. No preamble or explanation.`;
}

function createHumorousPrompt(entry) {
  return `Rewrite this journal entry in an observational, humorous style. Keep it conversational and witty, finding the absurd or ironic elements while staying true to the original meaning.

Entry:
Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}

Content:
${entry.content}

Write ONLY the humorous version. No preamble or explanation.`;
}

function createLiteraryPrompt(entry) {
  return `Rewrite this journal entry as a literary personal essay. Make it thoughtful, introspective, and beautifully written. Explore the deeper meanings and universal themes.

Entry:
Category: ${entry.category}
Headline: ${entry.headline}
${entry.subheading ? `Subheading: ${entry.subheading}` : ''}
Mood: ${entry.mood || 'not specified'}

Content:
${entry.content}

Write ONLY the literary essay version. No preamble or explanation.`;
}