/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Smile,
  Mic,
  ImageIcon,
  Play,
  Pause,
  SendHorizonal,
  Trash,
  X,
} from "lucide-react";
import Image from "next/image";
import EmojiPicker from "emoji-picker-react";
import { Input } from "@/components/ui/input";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import React, { FC, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface ChatInputProps {
  friend: { _id: string; chatId: string };
  currentUserId: Id<"users">;
  onSend: (
    message: string,
    type: "text" | "image" | "video" | "audio",
    attachments: string[]
  ) => Promise<void>;
}

const ChatInput: FC<ChatInputProps> = ({
  friend: _friend,
  currentUserId: _currentUserId,
  onSend,
}) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { edgestore } = useEdgeStore();

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image");
    const isVideo = file.type.startsWith("video");

    if (!isImage && !isVideo) {
      console.error("Selected file is not an image or video.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreviewFile(file);
    setPreviewUrl(previewUrl);
    event.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        stopTimer();
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        setRecordedAudio(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        setIsPaused(false);
      };
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    stopTimer();
    setRecordedAudio(null);
    setAudioUrl(null);
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleSend = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (recordedAudio) {
      setIsUploading(true);
      try {
        const audioFile = new File([recordedAudio], "recording.webm", {
          type: recordedAudio.type,
        });
        const res = await edgestore.publicFiles.upload({
          file: audioFile,
          options: {},
          onProgressChange: (progress: number) => {
            setUploadProgress(progress);
          },
        });
        await onSend(message, "audio", [res.url]);
        setRecordedAudio(null);
        setAudioUrl(null);
      } catch (error) {
        console.error("Failed to upload audio:", error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else if (previewFile) {
      setIsUploading(true);
      try {
        const isImage = previewFile.type.startsWith("image");
        const res = await edgestore.publicFiles.upload({
          file: previewFile,
          options: {},
          onProgressChange: (progress: number) => {
            setUploadProgress(progress);
          },
        });
        await onSend(message, isImage ? "image" : "video", [res.url]);
        setPreviewFile(null);
        setPreviewUrl(null);
      } catch (error) {
        console.error("Failed to upload file:", error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else if (message.trim()) {
      setIsUploading(true);
      try {
        await onSend(message, "text", []);
      } catch (error) {
        console.error("Failed to send text message:", error);
      } finally {
        setIsUploading(false);
      }
    }
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative bg-background border-t">
      {(previewUrl || recordedAudio) && (
        <div className="absolute bottom-full left-0 right-0 p-2 bg-muted/75 backdrop-blur-sm border-b">
          <div className="flex items-center gap-4">
            {previewUrl && (
              <div className="relative group">
                {previewFile?.type.startsWith("image") ? (
                  <Image
                    width={350}
                    height={350}
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-lg object-cover border"
                  />
                ) : (
                  <video
                    controls
                    className="w-32 h-20 rounded-lg border object-cover"
                  >
                    <source src={previewUrl} />
                  </video>
                )}
                <button
                  onClick={() => {
                    setPreviewFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute -top-2 -right-2 bg-foreground rounded-full p-0.5 hover:bg-opacity-80 transition-opacity"
                >
                  <X className="h-4 w-4 text-background" />
                </button>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <Progress
                      value={uploadProgress}
                      className="w-3/4 h-2 bg-background/20"
                    />
                  </div>
                )}
              </div>
            )}
            {recordedAudio && (
              <div className="flex items-center gap-4 p-3 rounded-lg w-full">
                <div className="flex-1 flex items-center gap-3">
                  <audio
                    ref={audioRef}
                    src={audioUrl!}
                    controls
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={cancelRecording}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSend}
                      disabled={isUploading}
                    >
                      <SendHorizonal className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-2 mb-2 z-50 shadow-xl rounded-lg overflow-hidden">
          <EmojiPicker
            onEmojiClick={(e) => insertEmoji(e.emoji)}
            skinTonesDisabled
            searchDisabled
            previewConfig={{ showPreview: false }}
            width="100%"
            height={360}
          />
        </div>
      )}
      <div className="p-2 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFileButtonClick}
            className="text-muted-foreground hover:text-foreground"
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={handleFileChange}
          />
        </div>
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="rounded-full py-5 pr-16 border-2"
          />
          {isRecording ? (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button
                size="sm"
                variant="destructive"
                className={`rounded-full gap-1.5 ${isPaused ? "" : "animate-pulse"}`}
                onClick={stopRecording}
              >
                <div className="h-2 w-2 bg-background rounded-full" />
                <span>{recordingTime}s</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="text-muted-foreground hover:text-foreground"
              >
                {isPaused ? (
                  <Play className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
              onClick={
                message.trim() || previewUrl || recordedAudio
                  ? handleSend
                  : startRecording
              }
              disabled={isUploading}
            >
              {message.trim() || previewUrl || recordedAudio ? (
                <SendHorizonal className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
