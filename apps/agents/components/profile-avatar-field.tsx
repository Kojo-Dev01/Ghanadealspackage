"use client";

import { AvatarUploader } from "./avatar-uploader";
import { useRef } from "react";

type Props = {
  currentUrl?: string | null;
  agentName: string;
  agentColor: string;
};

export function ProfileAvatarField({ currentUrl, agentName, agentColor }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSaved(url: string | null) {
    if (inputRef.current) {
      inputRef.current.value = url ?? "";
    }
  }

  return (
    <>
      <AvatarUploader
        currentUrl={currentUrl}
        agentName={agentName}
        agentColor={agentColor}
        onSaved={handleSaved}
      />
      <input type="hidden" name="avatar_url" ref={inputRef} defaultValue={currentUrl ?? ""} />
    </>
  );
}
