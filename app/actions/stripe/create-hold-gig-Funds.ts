'use server';

import { eq } from 'drizzle-orm';
import { stripeApi } from '@/lib/stripe-server';
import { db } from "@/lib/drizzle/db";
import { GigsTable, PaymentsTable, UsersTable } from "@/lib/drizzle/schema";

interface HoldGigFundsParams {
  firebaseUid: string;
  gigId: string;
  serviceAmountInCents: number; // The amount to be withheld in cents (e.g. 15000 for $150.00)
  currency?: string;
}

interface HoldGigAmountParams {
  buyerStripeCustomerId: string;
  destinationAccountId: string;
  gigPaymentInfo: {
    gigId: string;
    payerUserId: string;
    receiverUserId: string;
  };
  serviceAmountInCents: number;
  currency?: string;
}

async function holdGigAmount(params: HoldGigAmountParams) {
  const { buyerStripeCustomerId, destinationAccountId, gigPaymentInfo, currency, serviceAmountInCents } = params;
  const { gigId, payerUserId, receiverUserId } = gigPaymentInfo;

  const setupIntents = (await stripeApi.setupIntents.list()).data;
  const userSetupIntent = setupIntents.find(intent => intent.customer === buyerStripeCustomerId && intent.payment_method && intent.status === 'succeeded');
  const customerPaymentMethodId = userSetupIntent?.payment_method as string;

  const paymentIntent = await stripeApi.paymentIntents.create({
    amount: serviceAmountInCents,
    currency: currency || 'usd',
    customer: buyerStripeCustomerId,
    payment_method: customerPaymentMethodId,
    payment_method_options: {
      card: {
        capture_method: 'manual',
      },
    },
    capture_method: 'manual',
    confirm: true,
    off_session: true,
    metadata: {
      gigId: gigId,
      type: 'initial_gig_hold',
    },
    description: `Initial hold for Gig: ${gigId}`,
    application_fee_amount: 20,
    transfer_data: {
      destination: destinationAccountId,
      amount: serviceAmountInCents - 20,
    }
  });

  console.log(`Payment Intent created (HOLD) for Gig ${gigId}: ${paymentIntent.id}, status: ${paymentIntent.status}`);

  const stripeFee = paymentIntent.application_fee_amount?.toString(10) || '';
  await db
    .insert(PaymentsTable)
    .values({
      gigId: '6a1da7e1-9bd0-493c-9d7b-ce6fc8849244',
      stripePaymentIntentId: paymentIntent.id,
      payerUserId,
      receiverUserId,
      internalNotes: `Initial hold for Gig: ${gigId}`,
      amountGross: serviceAmountInCents.toString(),
      ableFeeAmount: '5',
      amountNetToWorker: '70',
      stripeFeeAmount: stripeFee,
    });
  return paymentIntent;
}

async function getPaymentAccountDetailsForGig(gigId: string) {
  const gigRecord = await db.query.GigsTable.findFirst({
    where: eq(GigsTable.id, gigId),
    columns: {
      buyerUserId: true,
      workerUserId: true,
      id: true,
    }
  });

  if (!gigRecord) {
    throw new Error('Gig not found');
  }

  const receiverUserRecord = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.id, gigRecord.workerUserId as string),
    columns: {
      id: true,
      stripeConnectAccountId: true,
    }
  });

  if (!receiverUserRecord?.stripeConnectAccountId) {
    throw new Error('Receiver is not connected with stripe');
  }

  return { receiverAccountId: receiverUserRecord.stripeConnectAccountId, gig: gigRecord };
}

export async function holdGigFunds(params: HoldGigFundsParams) {
  const { firebaseUid, gigId, currency, serviceAmountInCents } = params;

  try {
    if (!firebaseUid) {
      return { error: 'User ID is required.', status: 400 }
    }

    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
    });

    if (!userRecord) throw new Error('User not found');

    const buyerStripeCustomerId = userRecord?.stripeCustomerId;

    if (!buyerStripeCustomerId) {
      throw new Error('User is not connected with stripe');
    }

    const {receiverAccountId: destinationAccountId, gig } = await getPaymentAccountDetailsForGig(gigId);

    const paymentIntent = await holdGigAmount({
      buyerStripeCustomerId,
      destinationAccountId,
      currency,
      serviceAmountInCents,
      gigPaymentInfo: {
        gigId: gigId,
        payerUserId: userRecord.id,
        receiverUserId: 'gigRecord.workerUserId as string',
      },
    });

    return { data: { paymentIntent, message: 'Payment approved' }, status: 200 }

  } catch (error: any) {
    console.error(`Error retaining amount for Gig ${gigId}:`, error);
    return { error: error.message, status: 500 }
  }
}
