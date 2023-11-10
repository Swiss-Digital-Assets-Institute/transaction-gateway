#!/bin/bash

npx prisma migrate deploy
if [ $DEV ]; then
 pnpm seed
fi 
pnpm run start:dev