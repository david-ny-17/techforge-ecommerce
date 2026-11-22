import { api } from "@/services/api"
import type {
  ChangePasswordPayload,
  ChangePasswordResponse,
  ProfileUpdate,
  User,
} from "@/types"

export async function updateProfile(payload: ProfileUpdate): Promise<User> {
  const { data } = await api.patch<User>("auth/profile/", payload)
  return data
}

export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> {
  const { data } = await api.post<ChangePasswordResponse>("auth/change-password/", payload)
  return data
}