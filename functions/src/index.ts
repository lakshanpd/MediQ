import {setGlobalOptions} from "firebase-functions";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import {sendPush} from "./push";

setGlobalOptions({maxInstances: 1});

admin.initializeApp();
const db = admin.firestore();

// notify patient when token is accepted,rejected and started to serve
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

    if (after.status === "accepted") {
      await sendPush(
        pushToken,
        "Token Accepted",
        "Your appointment has been accepted.",
        {
          tokenId: event.params.tokenId,
          status: after.status,
        }
      );
    } else if (after.status === "rejected") {
      await sendPush(
        pushToken,
        "Token Rejected",
        "Your appointment has been rejected. Please contact the clinic " +
        "for further assistance.",
        {
          tokenId: event.params.tokenId,
          status: after.status,
        }
      );
    } else if (after.status === "in_progress") {
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

// notify doctor when a request comes
export const notifyDoctorOnNewRequest = onDocumentCreated(
  {
    document: "tokens/{tokenId}",
    region: "asia-south1",
  },
  async (event) => {
    const tokenData = event.data?.data();
    if (!tokenData) return;

    const sessionId = tokenData.session_id;
    if (!sessionId) return;

    // get session
    const sessionSnap = await db.collection("sessions").doc(sessionId).get();
    if (!sessionSnap.exists) return;

    const sessionData = sessionSnap.data();
    const doctorId = sessionData?.doctor_id;
    if (!doctorId) return;

    // find doctor by uid (NOT document ID)
    const doctorQuery = await db
      .collection("doctors")
      .where("uid", "==", doctorId)
      .limit(1)
      .get();

    if (doctorQuery.empty) return;


    const doctorDoc = doctorQuery.docs[0];
    const doctorData = doctorDoc.data();

    const deviceToken = doctorData?.device_token;
    if (!deviceToken) return;

    // send notification
    await sendPush(
      deviceToken,
      "New Appointment Request 📩",
      "A new patient request has been received. " +
      "Please review it.",
      {
        tokenId: event.params.tokenId,
        sessionId,
        type: "NEW_REQUEST",
      }
    );
  }
);

// notify doctor when session starts in 30 minutes
// and end in 10 minutes ---> onSchedule (check every minute)
