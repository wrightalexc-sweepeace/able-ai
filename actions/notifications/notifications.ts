"use server";
import admin from "@/lib/firebase/firebase-server";

type PriorityType = "high" | "normal" | undefined

export const sendPushNotificationAction = async (
  token: string,
  title: string,
  body: string
) => {
  const message = {
    token: token,
    notification: {
        title,
        body,
        imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/2048px-User_icon_2.svg.png"
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
        icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/User_icon_2.svg/2048px-User_icon_2.svg.png",
        click_action: "http://localhost:3000",
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    return {seccess: true, data:response};
  } catch (error: unknown) {
    return {seccess: false, data: null};
  }
};

export const saveNotificationFcmTokenAction = async (
) => {
  return null
};