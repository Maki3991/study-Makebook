import { FAUCET_URL } from "@/app/lib/chain/config";
import { copy } from "@/app/lib/copy";

export function TestnetBanner() {
  return (
    <div className="bg-accent-soft text-accent">
      <div className="page flex min-h-9 items-center justify-center gap-2 px-5 py-2 text-center text-xs font-medium sm:text-sm">
        <span>{copy.global.banner.testnet.split(" · ")[0]}</span>
        <span className="hidden sm:inline">·</span>
        <a
          href={FAUCET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center underline underline-offset-2 hover:text-accent-hover"
        >
          {copy.global.banner.testnet.split(" · ")[1]}
        </a>
      </div>
    </div>
  );
}
