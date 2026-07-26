import { useEffect, useMemo, useRef, useState } from "react";
import { HiChevronLeft, HiChevronRight, HiEye, HiXMark } from "react-icons/hi2";
import type { StatusItem } from "../../types/api";
import { getUserDisplayName } from "../../utils/getUserDisplayName";
import { useAuth } from "../../hooks/useAuth";
import {
  useDeleteStatusMutation,
  useLazyGetStatusViewersQuery,
  useViewStatusMutation,
} from "../../features/status/statusApi";
import UserAvatar from "./UserAvatar";

interface StatusViewerProps {
  statuses: StatusItem[];
  startIndex?: number;
  onClose: () => void;
  canDelete?: boolean;
}

const STORY_MS = 5000;

export default function StatusViewer({
  statuses,
  startIndex = 0,
  onClose,
  canDelete = false,
}: StatusViewerProps) {
  const { user } = useAuth();
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [viewStatus] = useViewStatusMutation();
  const [deleteStatus] = useDeleteStatusMutation();
  const [loadViewers, { data: viewers = [] }] = useLazyGetStatusViewersQuery();
  const [showViewers, setShowViewers] = useState(false);
  const viewedRef = useRef(new Set<string>());
  const pausedRef = useRef(false);

  const current = statuses[index];
  const isOwn = current?.author.id === user?.id;

  useEffect(() => {
    if (!current) {
      onClose();
    }
  }, [current, onClose]);

  useEffect(() => {
    if (!current) {
      return;
    }

    if (!viewedRef.current.has(current.id) && !isOwn) {
      viewedRef.current.add(current.id);
      void viewStatus(current.id);
    }

    if (isOwn) {
      void loadViewers(current.id);
    }
  }, [current, isOwn, loadViewers, viewStatus]);

  useEffect(() => {
    setProgress(0);
    pausedRef.current = false;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (pausedRef.current) {
        return;
      }

      const next = Math.min(100, ((Date.now() - startedAt) / STORY_MS) * 100);
      setProgress(next);

      if (next >= 100) {
        window.clearInterval(timer);
        setIndex((value) => {
          if (value >= statuses.length - 1) {
            onClose();
            return value;
          }

          return value + 1;
        });
      }
    }, 40);

    return () => window.clearInterval(timer);
  }, [current?.id, onClose, statuses.length]);

  const authorName = useMemo(
    () => (current ? getUserDisplayName(current.author) : ""),
    [current]
  );

  if (!current) {
    return null;
  }

  const goPrev = () => {
    if (index === 0) {
      onClose();
      return;
    }

    setIndex((value) => value - 1);
  };

  const goNext = () => {
    if (index >= statuses.length - 1) {
      onClose();
      return;
    }

    setIndex((value) => value + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 md:p-6">
      <div
        className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-black md:h-[90vh] md:rounded-2xl"
        onMouseDown={() => {
          pausedRef.current = true;
        }}
        onMouseUp={() => {
          pausedRef.current = false;
        }}
        onTouchStart={() => {
          pausedRef.current = true;
        }}
        onTouchEnd={() => {
          pausedRef.current = false;
        }}
      >
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3">
          {statuses.map((status, statusIndex) => (
            <div key={status.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className="h-full bg-white transition-[width] duration-75"
                style={{
                  width:
                    statusIndex < index
                      ? "100%"
                      : statusIndex === index
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 top-4 z-20 flex items-center justify-between px-3 pt-3">
          <div className="flex items-center gap-2">
            <UserAvatar
              name={authorName}
              avatarUrl={current.author.avatarUrl}
              size="sm"
            />
            <div>
              <p className="text-sm font-semibold text-white">{authorName}</p>
              <p className="text-xs text-white/70">
                {new Date(current.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {canDelete && isOwn && (
              <button
                type="button"
                onClick={() => void deleteStatus(current.id).then(onClose)}
                className="rounded-full px-2 py-1 text-xs text-white/80 hover:bg-white/10"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white hover:bg-white/10"
              aria-label="Close status"
            >
              <HiXMark className="h-5 w-5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-0 top-0 z-10 h-full w-1/3"
          aria-label="Previous status"
        />
        <button
          type="button"
          onClick={goNext}
          className="absolute right-0 top-0 z-10 h-full w-1/3"
          aria-label="Next status"
        />

        <div className="relative flex flex-1 items-center justify-center">
          {current.type === "image" && current.mediaUrl ? (
            <img
              src={current.mediaUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center px-8 text-center"
              style={{ backgroundColor: current.backgroundColor }}
            >
              <p className="text-2xl font-medium leading-relaxed text-white md:text-3xl">
                {current.text}
              </p>
            </div>
          )}

          {current.type === "image" && current.text && (
            <p className="absolute bottom-20 left-4 right-4 rounded-xl bg-black/50 px-3 py-2 text-center text-sm text-white">
              {current.text}
            </p>
          )}
        </div>

        {isOwn && (
          <button
            type="button"
            onClick={() => setShowViewers((value) => !value)}
            className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur"
          >
            <HiEye className="h-4 w-4" />
            {current.viewCount} views
            {showViewers ? <HiChevronLeft className="h-3 w-3" /> : <HiChevronRight className="h-3 w-3" />}
          </button>
        )}

        {showViewers && isOwn && (
          <div className="absolute inset-x-0 bottom-0 z-30 max-h-48 overflow-y-auto rounded-t-2xl bg-black/80 p-4 text-white">
            <p className="mb-2 text-sm font-semibold">Viewed by</p>
            {viewers.length === 0 ? (
              <p className="text-sm text-white/60">No views yet</p>
            ) : (
              <ul className="space-y-2">
                {viewers.map((entry) => (
                  <li key={entry.user.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        name={getUserDisplayName(entry.user)}
                        avatarUrl={entry.user.avatarUrl}
                        size="sm"
                      />
                      <span className="text-sm">{getUserDisplayName(entry.user)}</span>
                    </div>
                    <span className="text-xs text-white/60">
                      {new Date(entry.viewedAt).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
