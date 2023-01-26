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

aws --profile "${AWS_PROFILE:-default}" ssm put-parameter \
  --name "/TESTAPP/AUDIENCE" \
  --type "SecureString" \
  --value "${COGNITO_CLIENT_ID}" \
  --overwrite

aws --profile "${AWS_PROFILE:-default}" ssm put-parameter \
  --name "/TESTAPP/ISSUER" \
  --type "SecureString" \
  --value "https://cognito-idp.${REGION:-ap-northeast-1}.amazonaws.com/${USER_POOL_ID}" \
  --overwrite

aws --profile "${AWS_PROFILE:-default}" ssm put-parameter \
  --name "/TESTAPP/JWKS_URI" \
  --type "SecureString" \
  --value "https://cognito-idp.${REGION:-ap-northeast-1}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json" \
  --overwrite
