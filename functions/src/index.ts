import {setGlobalOptions} from "firebase-functions";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import {sendPush} from "./push";
import {onSchedule} from "firebase-functions/v2/scheduler";

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

// notify doctor before session start (30 min)
// and before session end (10 min)
export const notifyDoctorBeforeSessionTimes = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "asia-south1",
  },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const nowMillis = now.toMillis();

    // get sessions that are relevant (started or upcoming)
    const sessionsSnap = await db
      .collection("sessions")
      .where("end_time", ">=", now)
      .get();

    for (const sessionDoc of sessionsSnap.docs) {
      const session = sessionDoc.data();

      const doctorId = session.doctor_id;
      if (!doctorId) continue;

      const startMillis = session.start_time.toMillis();
      const endMillis = session.end_time.toMillis();

      const minutesToStart = Math.round(
        (startMillis - nowMillis) / (60 * 1000)
      );
      const minutesToEnd = Math.round(
        (endMillis - nowMillis) / (60 * 1000)
      );

      // debugging
      if (session.doctor_id === "rxYJvto2IXWV4eGshMi158KoklD3") {
        console.log("minutesToStart", minutesToStart);
        console.log("minutesToEnd", minutesToEnd);
      }

      // fetch doctor using uid field
      const doctorQuery = await db
        .collection("doctors")
        .where("uid", "==", doctorId)
        .limit(1)
        .get();

      console.log("doctorQuery", doctorQuery);

      if (doctorQuery.empty) continue;

      const doctorData = doctorQuery.docs[0].data();
      const deviceToken = doctorData?.device_token;
      console.log("deviceToken", deviceToken);
      if (!deviceToken) continue;

      // 🔔 30 minutes BEFORE session START
      if (minutesToStart <= 30 && !session.notified_start_30min) {
        console.log("sending notification to push token", deviceToken);
        await sendPush(
          deviceToken,
          "Upcoming Session ⏰",
          "Your session will start in 30 minutes.",
          {
            sessionId: sessionDoc.id,
            type: "SESSION_START_30_MIN",
          }
        );

        console.log("updated notified_start_30min");
        await sessionDoc.ref.update({
          notified_start_30min: true,
        });
      }

      // 🔔 10 minutes BEFORE session END
      if (minutesToEnd <= 10 && !session.notified_end_10min) {
        console.log("sending notification to push token", deviceToken);
        await sendPush(
          deviceToken,
          "Session Ending Soon ⏳",
          "This session will end in 10 minutes.",
          {
            sessionId: sessionDoc.id,
            type: "SESSION_END_10_MIN",
          }
        );

        console.log("updated notified_end_10min");
        await sessionDoc.ref.update({
          notified_end_10min: true,
        });
      }
    }
  }
);
