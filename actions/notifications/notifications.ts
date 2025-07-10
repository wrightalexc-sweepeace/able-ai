"use server";
import admin from "@/lib/firebase/firebase-server";
import { getMessaging } from "firebase-admin/messaging";

type PriorityType = "high" | "normal" | undefined;

export const sendPushNotificationAction = async (
  token: string,
  title: string,
  body: string
) => {
  const message = {
    topic: "general",
    notification: {
      title,
      body,
    },
    data: {
      customKey: "customValue",
    },
    android: {
      priority: "high" as PriorityType,
    },
    webpush: {
      headers: {
        Urgency: "high",
      },
      notification: {
        click_action: "http://localhost:3000",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);

    return { success: true, data: response };
  } catch (error: unknown) {
    return { success: false, data: null, error };
  }
};

export const subscribeFcmTopicAction = async (token: string) => {
  try {
    const messaging = getMessaging();
    if (!token) throw "Token required";
    const result = await (messaging as any).subscribeToTopic(token, "general");

    return { success: true, data: result };
  } catch (error) {
    console.log("Error subscribing to topic", error);
    return { success: false, error: error };
  }
};
