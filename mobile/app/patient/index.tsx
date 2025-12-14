import { View } from "react-native";
import { useUser } from "@/contexts/userContext";
import { useTokenListener } from "@/hooks/useTokenListener";
import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function PatientIndex() {
    const { setPatientStatus } = useUser();
    const tokenId = useLocalSearchParams().tokenId;
    const tokenData = useTokenListener(tokenId as string);
    const router = useRouter();

    useEffect(() => {
        if (!tokenId || !tokenData) {
            router.replace("/patient/form");
            return;
        }
        if (tokenData?.status === "pending") {
            setPatientStatus && setPatientStatus("pending");
            router.replace({ pathname: "/patient/status/pending", params: { tokenId } });
        }
        else if (tokenData?.status === "accepted") {
            setPatientStatus && setPatientStatus("accepted");
            router.replace({ pathname: "/patient/status/accepted", params: { tokenId } });
        } else if (tokenData?.status === "rejected") {
            setPatientStatus && setPatientStatus("rejected");
            router.replace({ pathname: "/patient/status/rejected", params: { tokenId } });
        }
        else {
            setPatientStatus && setPatientStatus("form");
            router.replace("/patient/form");
        }
    }, [tokenId, tokenData]);

    return null;
}