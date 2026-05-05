#!/bin/bash

if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "Skipping Vercel build for branch: $VERCEL_GIT_COMMIT_REF"
  exit 0
fi

echo "Main branch detected. Continuing Vercel build."
exit 1
