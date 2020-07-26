#!/bin/bash

# -------- Build Settings -------- #
# directory to deploy
BUILD_DIR="./dist"
# directory on target server
DEPLOY_DIR="./latest"
# use to install dependencies without disruption
TEMP_DIR="./staged"
# server to connect to
TARGET="hanbot@hanbot.elviswolcott.com"
# file to run
ENTRY="index.js"
# name to give job (mostly for debugging on server)
JOB_NAME="hanbot"

# --------- Create .env ---------- #
echo "\
DISCORD_WELCOME_CHANNEL=${DISCORD_WELCOME_CHANNEL}
DISCORD_ADMITTED_ROLE=${DISCORD_ADMITTED_ROLE}
DISCORD_ACTIVE_ROLE=${DISCORD_ACTIVE_ROLE}
DISCORD_TOKEN=${DISCORD_TOKEN}
ZOOM_API_KEY=${ZOOM_API_KEY}
ZOOM_API_SECRET=${ZOOM_API_SECRET}
ZOOM_WEBHOOK_SCRET=${ZOOM_WEBHOOK_SECRET}
ZOOM_MEETING_ID=${ZOOM_MEETING_ID}
ZOOM_TIME_THRESHOLD=${ZOOM_TIME_THRESHOLD}
ZOOM_TIME_ANNOUNCEMENT_CHANNEL=${ZOOM_TIME_ANNOUNCEMENT_CHANNEL}
TRAVIS_BUILD_NUMBER=${TRAVIS_BUILD_NUMBER}
TRAVIS_COMMIT=${TRAVIS_COMMIT}
" >> ".env"


# --------- Deploy Steps --------- #
# remove extra files
rm "${BUILD_DIR}/.tsBuildInfo"
# transfer the build to the target
rsync -r --delete-after --quiet "${TRAVIS_BUILD_DIR}/${BUILD_DIR}" "${TARGET}:${TEMP_DIR}"
# bring over package.json & .env
rsync -r --delete-after --quiet "${TRAVIS_BUILD_DIR}/package.json" "${TARGET}:${TEMP_DIR}/package.json"
rsync -r --delete-after --quiet "${TRAVIS_BUILD_DIR}/.env" "${TARGET}:${TEMP_DIR}/.env"
# restart pm2 on the target
ssh "${TARGET}" 'bash -s' <<RESTART
cd "${TEMP_DIR}"
npm install --only=production
cd ~
pm2 stop "${JOB_NAME}"
pm2 delete "${JOB_NAME}"
rm -rf "${DEPLOY_DIR}"
mv "${TEMP_DIR}" "${DEPLOY_DIR}"
rm -rf "${TEMP_DIR}"
cd "${DEPLOY_DIR}"
pm2 start "${BUILD_DIR}/${ENTRY}" --name "${JOB_NAME}"
pm2 save
RESTART
