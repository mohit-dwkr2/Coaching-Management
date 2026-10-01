import DashboardStats from "./DashboardStats";
import AttendanceSection from "./AttendanceSection";
import FeeSection from "./FeeSection";
import {
    DashboardData,
    getStudentDashboardData,
} from "@/services/dashboardService";
import { useState, useEffect } from "react";
import { useTenant } from "@/contexts/TenantContext";

interface DashboardTabProps {
    profile: any;
    status: string | null;
}

export default function DashboardTab({
    profile,
    status,
}: DashboardTabProps) {

    const { tenant, loading: tenantLoading } = useTenant();

    const [dashboardData, setDashboardData] =
        useState<DashboardData | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        if (!profile?.id || !tenant?.id) return;

        async function loadDashboard() {
            setLoading(true);

            const data =
                await getStudentDashboardData(
                    profile.id,
                    tenant.id
                );

            setDashboardData(data);

            setLoading(false);
        }

        loadDashboard();

    }, [profile, tenant?.id]);

    if (loading || tenantLoading) {
        return <div>Loading...</div>;
    }

    if (!dashboardData) {
        return null;
    }


    return (

        <div className="space-y-6">

            <DashboardStats
                data={dashboardData}
            />

            <AttendanceSection
                data={dashboardData.attendance}
                history={dashboardData.attendanceHistory}
            />

            <FeeSection
                data={dashboardData.fees}
            />

        </div>

    );

}