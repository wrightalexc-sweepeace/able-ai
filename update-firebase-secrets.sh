#!/bin/bash
# based on https://medium.com/evenbit/configuring-firebase-app-hosting-with-google-secrets-manager-2b83c09f3ad9
source ./env.production

# UK RTW API
echo $UK_RTW_API_SECRET | firebase apphosting:secrets:set --force --data-file - uk-rtw-api-secret
echo $UK_RTW_COMPANY_NAME | firebase apphosting:secrets:set --force --data-file - uk-rtw-company-name

# STRIPE
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | firebase apphosting:secrets:set --force --data-file - stripe-publishable-key
echo $STRIPE_SECRET_KEY | firebase apphosting:secrets:set --force --data-file - stripe-secret-key
echo $STRIPE_WEBHOOK_SIGNING_SECRET | firebase apphosting:secrets:set --force --data-file - stripe-webhook-signing-secret

# NILEDB
echo $NILEDB_URL | firebase apphosting:secrets:set --force --data-file - niledb-url

echo "setup secrets done"
echo "you can now deploy your app with firebase deploy"
echo "or deploy your app with firebase deploy --only hosting"