"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Link2 } from "lucide-react";
import type { ReactNode } from "react";
import type { ShareChannel } from "@/lib/share-channel";

export interface ShareSheetProps {
  open: boolean;
  onSelect: (channel: ShareChannel) => void;
  onDismiss: () => void;
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 7.25c-8.28 0-15 5.26-15 11.75 0 4.19 2.8 7.86 7.01 9.94l-1.79 6.58a.85.85 0 0 0 1.29.94l7.45-4.93c.34.02.69.03 1.04.03 8.28 0 15-5.26 15-11.75S28.28 7.25 20 7.25Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 32 32" width="31" height="31" aria-hidden="true">
      <rect
        x="4.5"
        y="4.5"
        width="23"
        height="23"
        rx="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <circle cx="16" cy="16" r="5.3" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="23.3" cy="8.9" r="1.55" fill="currentColor" />
    </svg>
  );
}

const CHANNELS = [
  {
    id: "instagram",
    label: "인스타그램",
    icon: <InstagramIcon />,
    iconClass: "share-sheet__icon--instagram",
  },
  {
    id: "kakao",
    label: "카카오톡",
    icon: <KakaoIcon />,
    iconClass: "share-sheet__icon--kakao",
  },
  {
    id: "copy",
    label: "링크 복사",
    icon: <Link2 size={29} strokeWidth={2.3} aria-hidden="true" />,
    iconClass: "share-sheet__icon--copy",
  },
] satisfies Array<{
  id: ShareChannel;
  label: string;
  icon: ReactNode;
  iconClass: string;
}>;

export function ShareSheet({ open, onSelect, onDismiss }: ShareSheetProps) {
  return (
    <Dialog.Root
      open={open}
      modal
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDismiss();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="share-sheet__overlay" />
        <Dialog.Content className="share-sheet__content">
          <div className="share-sheet__handle" aria-hidden="true" />
          <Dialog.Title className="share-sheet__title">공유</Dialog.Title>
          <Dialog.Description className="share-sheet__description">
            원하는 방법을 선택해 주세요.
          </Dialog.Description>

          <div className="share-sheet__channels">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                type="button"
                className="share-sheet__channel"
                onClick={() => onSelect(channel.id)}
              >
                <span className={`share-sheet__icon ${channel.iconClass}`}>
                  {channel.icon}
                </span>
                <span>{channel.label}</span>
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
