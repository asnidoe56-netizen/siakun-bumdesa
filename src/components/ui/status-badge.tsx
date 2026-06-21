import { Badge } from "@/components/ui/badge";

type StatusBadgeProps = {
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "PENDING") {
    return <Badge variant="warning">Menunggu Review</Badge>;
  }

  if (status === "APPROVED") {
    return <Badge variant="success">Disetujui</Badge>;
  }

  if (status === "REJECTED") {
    return <Badge variant="danger">Ditolak</Badge>;
  }

  return <Badge variant="muted">{status}</Badge>;
}
