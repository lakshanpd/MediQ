import {Expo} from "expo-server-sdk";

const expo = new Expo();

/**
 * Sends a push notification using Expo push service.
 *
 * @param {string} pushToken Expo push token of the device
 * @param {string} title Notification title
 * @param {string} body Notification body
 * @param {Record<string, unknown>} [data] Optional payload data
 * @return {Promise<void>} Resolves when notification is sent
 */
export async function sendPush(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.log("Invalid Expo push token:", pushToken);
    return;
  }

  await expo.sendPushNotificationsAsync([
    {
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    },
  ]);
}
