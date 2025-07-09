import { useEffect, useState } from "react";
import useFCMToken from "./useFCMToken";
import { MessagePayload, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase/clientApp";
import { toast } from "sonner";

const useFCM = () => {
  const fcmToken = useFCMToken();
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const fcmmessaging = messaging();
      const unsubscribe = onMessage(fcmmessaging, (payload) => {
        toast.info(payload.notification?.title, {icon: payload.notification?.icon, description: payload.notification?.body});
        setMessages((messages) => [...messages, payload]);
      });
      return () => unsubscribe();
    }
  }, [fcmToken]);
  return { fcmToken, messages };
};

export default useFCM;
