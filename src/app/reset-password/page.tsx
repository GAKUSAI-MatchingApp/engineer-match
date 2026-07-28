import type { Metadata } from "next";
import { ResetPasswordCard } from "@/components/auth/ResetPasswordCard";

export const metadata: Metadata = {
  title: "新しいパスワードを設定 | ENGINEER MATCH",
  description: "ENGINEER MATCHの新しいパスワードを設定します。",
};

export default function ResetPasswordPage() {
  return <ResetPasswordCard />;
}
