import type { Metadata } from "next";
import { ForgotPasswordCard } from "@/components/auth/ForgotPasswordCard";

export const metadata: Metadata = {
  title: "パスワードをお忘れですか？ | ENGINEER MATCH",
  description: "ENGINEER MATCHのパスワード再設定はこちらから。",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordCard />;
}
