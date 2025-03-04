/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  Smile,
  Mic,
  ImageIcon,
  Pause,
  Play,
  SendHorizonal,
  Trash,
} from "lucide-react";
import Image from "next/image";
import EmojiPicker from "emoji-picker-react";
import { Input } from "@/components/ui/input";
import { useEdgeStore } from "@/lib/edgestore";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import React, { FC, useRef, useState } from "react";

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
  const [sendAfterRecording, setSendAfterRecording] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunks = useRef<Blob[]>([]);

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
        setIsRecording(false);
        setIsPaused(false);

        if (sendAfterRecording) {
          handleSend();
          setSendAfterRecording(false);
        }
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
    setIsRecording(false);
    setIsPaused(false);
  };

  const handleSend = async () => {
    if (isRecording) {
      setSendAfterRecording(true);
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
      await onSend(message, "text", []);
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
    <div className="flex flex-col relative">
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-2 z-10">
          <EmojiPicker
            onEmojiClick={(e) => insertEmoji(e.emoji)}
            skinTonesDisabled
            searchDisabled
            className="max-w-[320px] max-h-60 sm:max-w-[400px] overflow-y-auto dark:border-none dark:bg-card"
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
      {previewUrl && (
        <div className="relative mb-2 ml-2">
          {previewFile && previewFile.type.startsWith("image") ? (
            <Image
              width={200}
              height={200}
              src={previewUrl}
              alt="Preview"
              className="max-w-xs rounded-lg"
            />
          ) : (
            <video controls className="max-w-xs rounded-lg">
              <source src={previewUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {isUploading && (
            <div className="absolute inset-0 max-w-xs rounded-lg flex items-center justify-center bg-black bg-opacity-50">
              <span className="text-white">Uploading... {uploadProgress}%</span>
            </div>
          )}
        </div>
      )}
      {(isRecording || recordedAudio) && (
        <div className="relative mb-2 ml-2 p-2 border rounded-md flex flex-col items-center">
          {isRecording ? (
            <div className="flex items-center space-x-2">
              <span>Recording: {recordingTime}s</span>
              {isPaused ? (
                <Button onClick={resumeRecording} variant="outline">
                  <Play size={16} />
                </Button>
              ) : (
                <Button onClick={pauseRecording} variant="outline">
                  <Pause size={16} />
                </Button>
              )}
              <Button onClick={handleSend}>Preview</Button>
            </div>
          ) : recordedAudio ? (
            <div className="flex flex-col items-center">
              <audio controls src={URL.createObjectURL(recordedAudio)} />
              <div className="flex items-center space-x-2 mt-2">
                <Button onClick={cancelRecording} variant="destructive">
                  <Trash className="size-5" />
                  Delete
                </Button>
                <Button onClick={handleSend}>
                  <SendHorizonal className="size-5" />
                  Send
                </Button>
              </div>
            </div>
          ) : null}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <span className="text-white">Uploading... {uploadProgress}%</span>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center space-x-2 p-4 border-t">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          <Smile size={20} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleFileButtonClick}>
          <ImageIcon size={20} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (!isRecording && !recordedAudio) {
              startRecording();
            }
          }}
        >
          <Mic size={20} color={isRecording ? "red" : undefined} />
        </Button>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button onClick={handleSend}>Send</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ChatInput;
