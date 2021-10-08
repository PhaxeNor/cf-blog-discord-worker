import { parseFeed } from 'htmlparser2';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request)
      .catch((err) => new Response(err.stack, { status: 500 }))
  );
})

addEventListener('scheduled', event => {
  event.waitUntil(handleRequest(event));
})

/**
 * Handler
 * @param event
 * @returns {Promise<Response>}
 */
async function handleRequest(event) {
  // User-Agent, or we'll be hit with the are you human check
  const response = await fetch('https://blog.cloudflare.com/rss', {
      headers: { 'User-Agent': `CF-Blog-Discord-Worker (https://github.com/phaxenor/cf-blog-discord-worker)` }
  });

  const xml = await response.text();
  // Reverse so old ones are posted first (catch up)
  const posts = parseFeed(xml).items.reverse();

  await Promise.all(posts.map(async post => {
    post.image = post.media[0].url;
    delete post.media;

    const kv = await KV.get(post.id)
    if(kv === null) await createNew(post)
    else await createUpdate(kv, post)
  }));

  return new Response('OK');
}


/**
 * New Blog Post
 * @param post
 * @returns {Promise<void>}
 */
async function createNew(post) {
  // Date properties
  const prevDate = new Date();
  prevDate.setDate(prevDate.getDate() - 1);
  const postDate = new Date(post.pubDate);

  // Only post if the post date is no older than 1 day. (To catch up, and avoid API spam)
  if(postDate > prevDate) {
    post.messageId = await sendMessage(post);
    await KV.put(post.id, JSON.stringify(post))
  }
}

/**
 * Updated Blog Post
 * @param kv
 * @param post
 * @returns {Promise<void>}
 */
async function createUpdate(kv, post) {
  const cachedData = JSON.parse(kv)
  const date = new Date(post.pubDate)
  const cachedDate = new Date(cachedData.pubDate)

  post.messageId = cachedData.messageId

  if(date.getTime() !== cachedDate.getTime()) {
    await KV.put(cachedData.id, JSON.stringify(post))

    post.updatedTitle = cachedData.title !== post.title;

    await sendMessage(post)
  }
}

async function sendMessage(post) {

  const messageId = post.messageId;
  const update = messageId !== undefined

  const res = await fetch(update ? `https://discord.com/api/v9/channels/${CHANNEL_ID}/messages/${messageId}` : `https://discord.com/api/v9/channels/${CHANNEL_ID}/messages`, {
    method: update ? 'PATCH' : 'POST',
    headers: {
      'Authorization': 'Bot ' + DISCORD_BOT_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      embeds: [{
        title: post.title,
        url: post.link,
        description: post.description,
        color: 0xf48120,
        image: {
          url: post.image,
        },
        thumbnail: {
          url: 'https://blog.cloudflare.com/favicon_package_v0.16/apple-touch-icon.png'
        },
        timestamp: post.pubDate
      }]
    })
  });

  if(!update) {
    const msg = await res.json();

    await fetch(`https://discord.com/api/v9/channels/${CHANNEL_ID}/messages/${msg.id}/threads`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bot ' + DISCORD_BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: post.title,
        auto_archive_duration: 1440
      })
    })

    return msg.id
  } else if (post.updatedTitle) {
    await fetch(`https://discord.com/api/v9/channels/${messageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bot ' + DISCORD_BOT_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: post.title
      })
    })
  }

  return true
}