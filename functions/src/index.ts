import {setGlobalOptions} from "firebase-functions";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import {sendPush} from "./push";

setGlobalOptions({maxInstances: 1});

admin.initializeApp();

// notify user when token is accepted,rejected and started to serve
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
    
    const pushToken = after.device_token;
    if (!pushToken) return;

    if (before.status === "pending" && after.status === "accepted") {
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
    else if (before.status === "pending" && after.status === "rejected") {
      await sendPush(
        pushToken,
        "Token Rejected",
        "Your appointment has been rejected. Please contact the clinic for further assistance.",
        {
          tokenId: event.params.tokenId,
          status: after.status,
        }
      );
    }
    else if (after.status === "in_progress") {
      await sendPush(
        pushToken,
        "It’s Your Turn",
        "You can now meet the doctor. Please proceed.",
        {
          tokenId: event.params.tokenId,
          status: after.status,
        }
      );
    }
  }
);
