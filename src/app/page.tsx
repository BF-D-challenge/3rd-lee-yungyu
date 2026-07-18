import { CreatorAuthGate } from "@/components/organisms/oneul/creator-auth-gate";
import { TodayApp } from "@/components/organisms/oneul/today-app";

export default function HomePage() {
  return (
    <CreatorAuthGate>
      <TodayApp />
    </CreatorAuthGate>
  );
}
