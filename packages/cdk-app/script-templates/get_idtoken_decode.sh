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

aws --profile "${AWS_PROFILE:-default}" cognito-idp admin-set-user-password \
        --user-pool-id "${USER_POOL_ID}" \
        --username "${COGNITO_USER_NAME}" \
        --password "${COGNITO_USER_PASSWORD}" \
        --permanent


idToken=$(aws --profile "${AWS_PROFILE:-default}" cognito-idp admin-initiate-auth \
  --user-pool-id "${USER_POOL_ID}" \
  --client-id "${COGNITO_CLIENT_ID}" \
  --auth-flow "ADMIN_USER_PASSWORD_AUTH" \
  --auth-parameters USERNAME="${COGNITO_USER_NAME}",PASSWORD="${COGNITO_USER_PASSWORD}" \
  --query "AuthenticationResult.IdToken" \
  --output text)

# echo "${idToken}"
ARR=(${idToken//./ })

idTokenBody="${ARR[1]}"
# echo ${idTokenBody}

idTokenBodyDecoded="$(echo -n "${idTokenBody}" | tr -d '\n' | base64 -d - | jq)"

echo "${idTokenBodyDecoded}"
