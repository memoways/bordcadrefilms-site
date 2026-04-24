"use client";

import { UserButton } from "@clerk/nextjs";

export default function UserButtonClient() {
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-8 h-8",
        },
      }}
    />
  );
}
