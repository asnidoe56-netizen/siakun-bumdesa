import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

type TopbarUserProps = {
  name: string;
  email?: string;
  avatarUrl?: string | null;
  align?: "left" | "right";
  className?: string;
};

const topbarUserStyles = {
  root: "flex items-center gap-3",
  text: {
    base: "",
    left: "text-left",
    right: "text-right",
  },
  name: "text-sm font-medium text-slate-950",
  email: "hidden text-xs text-slate-500 sm:block",
};

export function TopbarUser({
  name,
  email,
  avatarUrl,
  align = "right",
  className,
}: TopbarUserProps) {
  return (
    <div className={cn(topbarUserStyles.root, className)}>
      <div
        className={cn(
          topbarUserStyles.text.base,
          topbarUserStyles.text[align]
        )}
      >
        <p className={topbarUserStyles.name}>{name}</p>

        {email ? <p className={topbarUserStyles.email}>{email}</p> : null}
      </div>

      <Avatar name={name} src={avatarUrl} size="md" />
    </div>
  );
}
