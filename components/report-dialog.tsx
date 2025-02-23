"use client";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Loader2, CheckCircle2, ShieldOff } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ReportDialogProps {
  postId: Id<"posts">;
  authorId: Id<"users">;
  isOpen: boolean;
  onClose: () => void;
}

const reasons = [
  "Problem involving someone under 18",
  "Bullying, harassment or abuse",
  "Suicide or self-harm",
  "Violent, hateful or disturbing content",
  "Selling or promoting restricted items",
  "Adult content",
  "Scam, fraud or false information",
  "I don't want to see this",
];

export default function ReportDialog({
  postId,
  authorId,
  isOpen,
  onClose,
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const createReportMutation = useMutation(api.reports.createReport);

  const blockUserMutation = useMutation(api.blocks.blockUser);
  const blockedUsers = useQuery(api.blocks.getBlockedUsers) || [];
  const isBlocked = blockedUsers.some(
    (b: { blockedId: Id<"users"> }) => b.blockedId === authorId
  );

  async function handleReport() {
    if (!selectedReason) {
      toast.error("Please select a reason for reporting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createReportMutation({ postId, reason: selectedReason });
      setReportSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit the report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBlock() {
    try {
      if (!isBlocked) {
        await blockUserMutation({ targetUserId: authorId });
        toast.success("User blocked successfully.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to block user. Please try again.");
    }
  }

  if (reportSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <DialogTitle>Thank you for your feedback</DialogTitle>
              <DialogDescription className="text-sm">
                We use reports like yours to help keep our community safe.
                You&apos;ve made a positive impact by speaking up.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            {!isBlocked && (
              <Button
                variant="destructive"
                onClick={handleBlock}
                className="gap-2"
              >
                <ShieldOff className="h-4 w-4" />
                Block User
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="dark:border-[#444444]"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Why are you reporting this post?</DialogTitle>
          <DialogDescription>
            If someone is in immediate danger, get help before reporting to us.
            Don&apos;t wait.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          className="mt-4 space-y-2"
          value={selectedReason}
          onValueChange={(value) => setSelectedReason(value)}
        >
          {reasons.map((reason) => (
            <div key={reason} className="flex items-center space-x-2">
              <RadioGroupItem value={reason} id={reason} />
              <Label htmlFor={reason} className="cursor-pointer">
                {reason}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleReport} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reporting...
              </>
            ) : (
              "Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
