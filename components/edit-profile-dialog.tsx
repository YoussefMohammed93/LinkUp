"use client";

import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  jobTitle: z.string().min(3, "Job title must be at least 3 characters"),
  bio: z.string().max(500, "Bio must not exceed 500 characters").optional(),
});

type FormData = z.infer<typeof formSchema>;

type EditProfileDialogProps = {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Partial<FormData>;
  onSave: (data: FormData) => Promise<void>;
  children?: React.ReactNode;
};

export function EditProfileDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSave,
  children,
}: EditProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      jobTitle: "",
      bio: "",
    },
  });

  const controlledOpen = isOpen !== undefined;
  const actualOpen = controlledOpen ? isOpen : internalOpen;
  const handleOpenChange =
    controlledOpen && onOpenChange ? onOpenChange : setInternalOpen;

  useEffect(() => {
    if (actualOpen && initialData) {
      reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        jobTitle: initialData.jobTitle || "",
        bio: initialData.bio || "",
      });
    }
  }, [actualOpen, initialData, reset]);

  const handleFormSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await onSave(data);
      handleOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={actualOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input {...register("firstName")} placeholder="First Name" />
                {errors.firstName && (
                  <p className="text-destructive text-xs">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input {...register("lastName")} placeholder="Last Name" />
                {errors.lastName && (
                  <p className="text-destructive text-xs">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input {...register("jobTitle")} placeholder="Job Title" />
                {errors.jobTitle && (
                  <p className="text-destructive text-xs">
                    {errors.jobTitle.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Bio</Label>
            <Textarea
              {...register("bio")}
              placeholder="Tell us about yourself..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div
              className={`text-xs text-right ${
                (watch("bio")?.length ?? 0) >= 480
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {watch("bio")?.length || 0}/500
              {(watch("bio")?.length ?? 0) >= 450 && (
                <span className="block text-xs mt-1">
                  {500 - (watch("bio")?.length || 0)} characters remaining
                </span>
              )}
            </div>
            {errors.bio && (
              <p className="text-destructive text-xs">{errors.bio.message}</p>
            )}
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
