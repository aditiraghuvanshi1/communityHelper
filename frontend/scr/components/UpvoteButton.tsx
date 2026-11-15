// One-click civic support button. The backend enforces one vote per user per complaint;
// the UI mirrors that with the viewer_has_voted flag and friendly 401/409 handling.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowBigUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiPost, ApiError } from "@/lib/api";
import { useMe } from "@/lib/useAuth";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";

interface UpvoteButtonProps {
  complaintId: string;
  upvoteCount: number;
  hasVoted: boolean;
  size?: "sm" | "md";
  testId?: string;
}

export default function UpvoteButton({
  complaintId,
  upvoteCount,
  hasVoted,
  size = "md",
  testId = "upvote-button",
}: UpvoteButtonProps) {
  const { data: user } = useMe();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<{ upvote_count: number; viewer_has_voted: boolean }>(`/complaints/${complaintId}/upvote`),
    onSuccess: () => {
      toast.success(t("Thanks for adding your support — the ward office weighs supported complaints first."));
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      void queryClient.invalidateQueries({ queryKey: ["complaint", complaintId] });
      void queryClient.invalidateQueries({ queryKey: ["myComplaints"] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        toast.error(t("Sign in to support complaints"), {
          action: { label: t("Sign in"), onClick: () => navigate("/login") },
        });
      } else if (error instanceof ApiError && error.status === 409) {
        toast.error(t("You have already supported this complaint"));
      } else {
        toast.error(t("Could not register your support — please try again"));
      }
    },
  });

  function handleClick() {
    if (!user) {
      toast.error(t("Sign in to support complaints"), {
        action: { label: t("Sign in"), onClick: () => navigate("/login") },
      });
      return;
    }
    if (!hasVoted) mutation.mutate();
  }

  const voted = hasVoted || mutation.isSuccess;
  return (
    <Button
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      data-testid={testId}
      onClick={handleClick}
      disabled={mutation.isPending || voted}
      className={cn(
        "gap-1.5",
        voted && "border-[#237A62] bg-[#EAEFEA] text-[#237A62] hover:bg-[#EAEFEA]",
        size === "sm" && "h-7 px-2.5 text-xs",
      )}
      title={t(voted ? "You supported this complaint" : "Support this complaint")}
    >
      <ArrowBigUp className={cn("size-4", size === "sm" && "size-3.5")} />
      <span data-testid={`${testId}-count`}>{upvoteCount}</span>
      <span className="sr-only">{t("supports")}</span>
    </Button>
  );
}
