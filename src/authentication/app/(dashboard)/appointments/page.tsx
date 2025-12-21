"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppointmentsPageComponent from "@/components/page/Appointments-Page-Component";
import PatientAppointments from "@/components/page/Patient-Appointments.tsx";

export default function AppointmentsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem("user_role");
    const storedId = localStorage.getItem("user_id");

    if (!storedRole || !storedId) {
      router.push("/auth/login");
      return;
    }

    setRole(storedRole);
    setUserId(storedId);
  }, [router]);

  if (!role || !userId) return null; // safer than showing "Loading..."

  return role === "patient" ? (
    <PatientAppointments userId={userId} />
  ) : (
    <AppointmentsPageComponent />
  );
}
