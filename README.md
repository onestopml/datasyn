### Video Generator Demo

### Development

1. Create `.env.local`

   > Copy from `.env.dev` to `.env.local`
   >
   > Change environment url to the renex url, for example: `http://localhost:30930`

2. Run the database inside docker:
   > `docker compose up`
3. Migrate the database:
   > `yarn prisma:migrate`
4. Generate the prisma client:
   > `yarn prisma:generate`
5. Run nextjs from your host:
   > `yarn dev`
