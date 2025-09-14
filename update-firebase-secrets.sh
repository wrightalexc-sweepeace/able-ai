#!/bin/bash
# based on https://medium.com/evenbit/configuring-firebase-app-hosting-with-google-secrets-manager-2b83c09f3ad9
source ./env.production

# UK RTW API
echo $UK_RTW_API_SECRET | firebase apphosting:secrets:set --force --data-file - uk-rtw-api-secret
echo $UK_RTW_COMPANY_NAME | firebase apphosting:secrets:set --force --data-file - uk-rtw-company-name

# FIREBASE - CLIENT KEYS
echo $NEXT_PUBLIC_FIREBASE_API_KEY | firebase apphosting:secrets:set --force --data-file - firebase-api-key
echo $NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN | firebase apphosting:secrets:set --force --data-file - firebase-auth-domain
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID | firebase apphosting:secrets:set --force --data-file - firebase-project-id
echo $NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET | firebase apphosting:secrets:set --force --data-file - firebase-storage-bucket
echo $NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID | firebase apphosting:secrets:set --force --data-file - firebase-messaging-sender-id
echo $NEXT_PUBLIC_FIREBASE_APP_ID | firebase apphosting:secrets:set --force --data-file - firebase-app-id
echo $NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID | firebase apphosting:secrets:set --force --data-file - firebase-measurement-id

# FIREBASE - SERVER KEYS
echo $FIREBASE_SERVICE_ACCOUNT | firebase apphosting:secrets:set --force --data-file - firebase-service-account
echo $FIREBASE_PROJECT_ID | firebase apphosting:secrets:set --force --data-file - firebase-project-id-server
echo $FIREBASE_PRIVATE_KEY_ID | firebase apphosting:secrets:set --force --data-file - firebase-private-key-id
echo $FIREBASE_PRIVATE_KEY | firebase apphosting:secrets:set --force --data-file - firebase-private-key
echo $FIREBASE_CLIENT_EMAIL | firebase apphosting:secrets:set --force --data-file - firebase-client-email
echo $FIREBASE_CLIENT_ID | firebase apphosting:secrets:set --force --data-file - firebase-client-id
echo $FIREBASE_AUTH_URI | firebase apphosting:secrets:set --force --data-file - firebase-auth-uri
echo $FIREBASE_TOKEN_URI | firebase apphosting:secrets:set --force --data-file - firebase-token-uri
echo $FIREBASE_AUTH_PROVIDER_X509_CERT_URL | firebase apphosting:secrets:set --force --data-file - firebase-auth-provider-x509-cert-url
echo $FIREBASE_CLIENT_X509_CERT_URL | firebase apphosting:secrets:set --force --data-file - firebase-client-x509-cert-url
echo $FIREBASE_UNIVERSE_DOMAIN | firebase apphosting:secrets:set --force --data-file - firebase-universe-domain

# STRIPE
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | firebase apphosting:secrets:set --force --data-file - stripe-publishable-key
echo $STRIPE_SECRET_KEY | firebase apphosting:secrets:set --force --data-file - stripe-secret-key
echo $STRIPE_WEBHOOK_SIGNING_SECRET | firebase apphosting:secrets:set --force --data-file - stripe-webhook-signing-secret

# NILEDB
echo $NILEDB_URL | firebase apphosting:secrets:set --force --data-file - niledb-url

echo "setup secrets done"
echo "you can now deploy your app with firebase deploy"
echo "or deploy your app with firebase deploy --only hosting"