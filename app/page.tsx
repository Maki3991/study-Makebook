import type { Metadata } from "next";
import { MakebookApp } from "@/app/components/makebook-app";

export const metadata: Metadata = {
  title: "MAKEBOOK · 造物簿",
  description:
    "把评论里的想要，变成一条有真实资金承诺的生产需求曲线。",
};

export default function Home() {
  return <MakebookApp />;
}
