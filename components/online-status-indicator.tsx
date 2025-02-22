import React from "react";

interface OnlineStatusIndicatorProps {
  lastActiveAt?: number;
}

function OnlineStatusIndicator({ lastActiveAt }: OnlineStatusIndicatorProps) {
  if (lastActiveAt === undefined) {
    return (
      <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-gray-300 dark:bg-slate-300 animate-pulse" />
    );
  }

  if (!lastActiveAt) return null;

  const now = Date.now();
  const diff = now - lastActiveAt;

  if (diff < 60 * 1000) {
    return (
      <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
    );
  }

  const minutes = Math.floor(diff / 60000);

  if (minutes < 60) {
    return (
      <span className="absolute -bottom-2 -right-2 inline-flex items-center px-1 rounded-full text-[11px] font-medium bg-[#F2FCF0] text-green-800">
        {minutes}m
      </span>
    );
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 23) {
    return (
      <span className="absolute -bottom-2 -right-2 inline-flex items-center px-1 rounded-full text-[11px] font-medium bg-[#F2FCF0] text-gray-800">
        {hours}h
      </span>
    );
  }

  return null;
}

export default OnlineStatusIndicator;
