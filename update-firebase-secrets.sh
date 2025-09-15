#!/bin/bash
# based on https://medium.com/evenbit/configuring-firebase-app-hosting-with-google-secrets-manager-2b83c09f3ad9
source ./.env.production

#!/bin/bash
command -v firebase >/dev/null 2>&1 || {
  echo "Firebase CLI not found!" >&2
  exit 1
}

# UK RTW API
echo $UK_RTW_API_SECRET | firebase apphosting:secrets:set --force --data-file - uk-rtw-api-secret && firebase apphosting:secrets:grantaccess --backend able uk-rtw-api-secret
echo $UK_RTW_COMPANY_NAME | firebase apphosting:secrets:set --force --data-file - uk-rtw-company-name && firebase apphosting:secrets:grantaccess --backend able uk-rtw-company-name

# STRIPE
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | firebase apphosting:secrets:set --force --data-file - stripe-publishable-key && firebase apphosting:secrets:grantaccess --backend able stripe-publishable-key
echo $STRIPE_SECRET_KEY | firebase apphosting:secrets:set --force --data-file - stripe-secret-key && firebase apphosting:secrets:grantaccess --backend able stripe-secret-key
echo $STRIPE_WEBHOOK_SIGNING_SECRET | firebase apphosting:secrets:set --force --data-file - stripe-webhook-signing-secret && firebase apphosting:secrets:grantaccess --backend able stripe-webhook-signing-secret

# NILEDB
echo $NILEDB_URL | firebase apphosting:secrets:set --force --data-file - niledb-url && firebase apphosting:secrets:grantaccess --backend able niledb-url

echo "setup secrets done"
echo "you can now deploy your app with firebase deploy"
echo "or deploy your app with firebase deploy --only hosting"