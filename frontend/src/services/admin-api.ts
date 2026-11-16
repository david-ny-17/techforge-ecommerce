import { api } from "@/services/api"
import type { AdminDashboardData } from "@/types"

export async function getAdminDashboard(days = 30): Promise<AdminDashboardData> {
  const { data } = await api.get<AdminDashboardData>("admin/dashboard/", { params: { days } })
  return data
}