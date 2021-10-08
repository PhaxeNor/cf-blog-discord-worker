## Cloudflare Blog to Discord Worker
This is a simple worker that checks the Cloudflare Blog RSS for new posts and sends them to the specified Discord channel.
It will then create a thread on the respective messages posted for people to talk

Initially wanted CF Blog post updates on my private discord, to help me keep various feeds in one place without the need for various apps/extensions to stay up to date.

But after reading the Cloudflare Dev Discord and them also wanted something for their server, but with threads, I decided to change it around and support that. Possibly for my own future use too.

Thank you @WalshyDev for the CF Status Worker and inspiration from that.
And thank you @Erisa for input on the readme

---
### How to set up
All you need to do is click the "Deploy with Workers" button, then follow the steps until you get to **Fork repo**\
Once you're on this step, there is a few things you need to change before you continue. First off, fork the repo, then do the following:

- Add 2 Github Repo Secrets
  - `CHANNEL_ID` - The channel you want this to be posted in
  - `DISCORD_BOT_TOKEN` - Your bot's token
- Create a new KV namespace and update the KV namespace id in `wrangler.toml` to match the one you just created.

__Github Repo Secrets location__\
`https://github.com/{username}/{repo}/settings/secrets/actions`


[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/PhaxeNor/cf-blog-discord-worker)

### Example
![Discord Cloudflare Blog Post](https://user-images.githubusercontent.com/323222/136501524-6411edf0-5eac-4ae7-b3aa-405735f6f19e.png)