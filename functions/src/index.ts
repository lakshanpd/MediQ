import {setGlobalOptions} from "firebase-functions";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import {sendPush} from "./push";

setGlobalOptions({maxInstances: 1});

admin.initializeApp();

export const notifyOnTokenStatusChange = onDocumentUpdated(
  {
    document: "tokens/{tokenId}",
    region: "asia-south1",
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;

    if (before.status === after.status) return;

    if (before.status === "pending" && after.status === "accepted") {
      const pushToken = after.device_token;
      if (!pushToken) return;

      await sendPush(
        pushToken,
        "Token Accepted",
        "Your appointment has been accepted.",
        {
          tokenId: event.params.tokenId,
          status: after.status,
        }
      );
    }
  }
);

