"use client";

import { useState } from "react";
import SettingsModal from "./SettingsModal";

export default function UserSettingsButton({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        {image ? (
          <img
            src={image}
            alt=""
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500">
            {name.charAt(0)}
          </div>
        )}
        <span className="hidden sm:inline">{name}</span>
      </button>

      {open && (
        <SettingsModal
          name={name}
          email={email}
          image={image}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
