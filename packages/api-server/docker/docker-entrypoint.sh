#!/bin/bash

npx prisma migrate deploy
if [ $DEV ]; then
 node dist/prisma/seed.js
fi 
pnpm run start:prod