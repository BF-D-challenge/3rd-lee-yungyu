import { matpinPublicProfileSchema, type MatpinPublicProfile } from "@/lib/matpin/contract";

export function matpinPublicProfileResponse(profile: MatpinPublicProfile) {
  return matpinPublicProfileSchema.parse(profile);
}
