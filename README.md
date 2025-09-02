This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare

This application is configured to deploy on Cloudflare Workers using OpenNext.

### Prerequisites

1. **Cloudflare Account** - [Sign up here](https://dash.cloudflare.com/sign-up)
2. **API Token** from Cloudflare Dashboard
3. **GitHub Repository** with secrets configured

### Setup GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Environment Variables

The application supports the following environment variables (add them to Cloudflare Workers dashboard):

#### Required Variables:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

#### Application Variables:
- `NEXTJS_ENV=production`
- `NILEDB_USER=your_db_user`
- `NILEDB_PASSWORD=your_db_password`
- `NILEDB_POSTGRES_URL=your_connection_string`

### Deploy Commands

#### Local Development & Testing
```bash
# Install dependencies (includes wrangler and opennext)
npm install

# Build for Cloudflare Workers
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

#### Automatic GitHub Actions Deployment

Pushes to the `main` branch automatically deploy to production.
Pull requests create preview deployments.

### Cloudflare Dashboard Configuration

1. **Access Workers & Pages** - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Variables** - Configure environment variables in Workers dashboard
3. **Monitoring** - View logs, metrics, and performance data
4. **Custom Domain** - Add custom domain if desired

Your application will be available at: `https://able-ai-client.your-subdomain.workers.dev`

### Troubleshooting

#### Build Issues
- Ensure all environment variables are correctly set
- Check that `wrangler.toml` configuration is valid
- Verify OpenNext build output in `.open-next` directory

#### Runtime Issues
- Check Cloudflare Workers logs for errors
- Verify environment variables in dashboard
- Confirm database connections and credentials

Check out [OpenNext documentation](https://opennext.js.org/) and [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/) for more details.
