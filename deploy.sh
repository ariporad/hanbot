#!/bin/bash

# -------- Build Settings -------- #
# directory on target server
DEPLOY_DIR="./latest"
# use to install dependencies without disruption
TEMP_DIR="./staged"
# server to connect to
TARGET="hanbot@hanbot.elviswolcott.com"
# name to give job (mostly for debugging on server)
JOB_NAME="hanbot"

# -------- Append to .env -------- #
echo "
TRAVIS_BUILD_NUMBER=${TRAVIS_BUILD_NUMBER}
TRAVIS_COMMIT=${TRAVIS_COMMIT}
" >> ".env"

# --------- Deploy Steps --------- #
# transfer the build to the target
rsync -r --delete-after --quiet --exclude-from=".deployignore" "${TRAVIS_BUILD_DIR}/" "${TARGET}:${TEMP_DIR}"
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
pm2 start . --name "${JOB_NAME}"
pm2 save
RESTART
