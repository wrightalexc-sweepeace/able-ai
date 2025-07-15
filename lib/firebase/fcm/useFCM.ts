import { useEffect } from "react";
import useFCMToken from "./useFCMToken";
import { onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase/clientApp";
import { toast } from "sonner";

const useFCM = () => {
  const fcmToken = useFCMToken();
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const fcmmessaging = messaging();
      const unsubscribe = onMessage(fcmmessaging, (payload) => {
        toast.info(payload.notification?.title, {icon: payload.notification?.icon, description: payload.notification?.body});
      });
      return () => unsubscribe();
    }
  }, [fcmToken]);
  return { fcmToken };
};

export default useFCM;
