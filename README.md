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


## Deploy on Vercel

This project is ready for Vercel hosting. To deploy:

1. Push your code to a GitHub/GitLab/Bitbucket repository.
2. Connect your repo to [Vercel](https://vercel.com/import).
3. Set the following environment variables in the Vercel dashboard:
	- `ENTRA_CLIENT_ID` (from your Microsoft Entra External ID app registration)
	- `ENTRA_CLIENT_SECRET` (from your Microsoft Entra External ID app registration)
	- `ENTRA_ISSUER` (e.g. `https://login.microsoftonline.com/<tenant-id>/v2.0`)
4. Deploy!

See `vercel.json` for build and output configuration. No further changes are needed for Vercel.

For more, see [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
