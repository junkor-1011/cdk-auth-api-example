#!/usr/bin/env bash
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" || exit; pwd)"
cd "${SCRIPT_DIR}" || exit

if [ -f ./params ]; then
    source ./params
else
    echo "There is no params file. exit."
    exit 1
fi

aws --profile "${AWS_PROFILE:-default}" cognito-idp admin-create-user \
        --user-pool-id "${USER_POOL_ID}" \
        --username "${COGNITO_USER_NAME}" \
        --message-action SUPPRESS
