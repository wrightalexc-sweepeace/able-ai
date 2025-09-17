#!/bin/bash
# based on https://medium.com/evenbit/configuring-firebase-app-hosting-with-google-secrets-manager-2b83c09f3ad9
source ./.env.production # Can be configured in other env

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

# FIREBASE

echo $FIREBASE_SERVICE_ACCOUNT | firebase apphosting:secrets:set --force --data-file - firebase-service-account && firebase apphosting:secrets:grantaccess --backend able firebase-service-account
echo $FIREBASE_PROJECT_ID | firebase apphosting:secrets:set --force --data-file - firebase-project-id && firebase apphosting:secrets:grantaccess --backend able firebase-project-id
echo $FIREBASE_PRIVATE_KEY_ID | firebase apphosting:secrets:set --force --data-file - firebase-private-key-id && firebase apphosting:secrets:grantaccess --backend able firebase-private-key-id
echo $FIREBASE_PRIVATE_KEY | firebase apphosting:secrets:set --force --data-file - firebase-private-key && firebase apphosting:secrets:grantaccess --backend able firebase-private-key
echo $FIREBASE_CLIENT_EMAIL | firebase apphosting:secrets:set --force --data-file - firebase-client-email && firebase apphosting:secrets:grantaccess --backend able firebase-client-email
echo $FIREBASE_CLIENT_ID | firebase apphosting:secrets:set --force --data-file - firebase-client-id && firebase apphosting:secrets:grantaccess --backend able firebase-client-id
echo $FIREBASE_AUTH_URI | firebase apphosting:secrets:set --force --data-file - firebase-auth-uri && firebase apphosting:secrets:grantaccess --backend able firebase-auth-uri
echo $FIREBASE_TOKEN_URI | firebase apphosting:secrets:set --force --data-file - firebase-token-uri && firebase apphosting:secrets:grantaccess --backend able firebase-token-uri
echo $FIREBASE_AUTH_PROVIDER_X509_CERT_URL | firebase apphosting:secrets:set --force --data-file - firebase-auth-provider-x509-cert-url && firebase apphosting:secrets:grantaccess --backend able firebase-auth-provider-x509-cert-url
echo $FIREBASE_CLIENT_X509_CERT_URL | firebase apphosting:secrets:set --force --data-file - firebase-client-x509-cert-url && firebase apphosting:secrets:grantaccess --backend able firebase-client-x509-cert-url
echo $FIREBASE_UNIVERSE_DOMAIN | firebase apphosting:secrets:set --force --data-file - firebase-universe-domain && firebase apphosting:secrets:grantaccess --backend able firebase-universe-domain

echo "setup secrets done"
echo "you can now deploy your app with firebase deploy"
echo "or deploy your app with firebase deploy --only hosting"