"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmBlockDialogProps = {
  userId: string;
  userName: string;
  onConfirm: () => Promise<void>;
};

export function ConfirmBlockDialog({
  userName,
  onConfirm,
}: ConfirmBlockDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      toast.success(`Successfully blocked ${userName}!`);
      setOpen(false);
    } catch (error) {
      toast.error(
        `Failed to block user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Block</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Block</DialogTitle>
          <DialogDescription className="pt-5">
            Are you sure you want to block {userName}? They will no longer be
            able to interact with you.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 mt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin size-4" />
                Blocking...
              </span>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
