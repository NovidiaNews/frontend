"use client";

import ImageSide from "./components/pexels/ImageSide";
import { NovLink } from "@/app/components/ui";

export default function NotFound() {
  return (
    <div className="w-full h-screen absolute inset-0 pointer-events-none">
      <main className="relative w-full h-screen flex flex-col md:flex-row gap-6 p-4 pt-25 ">

        {/* LEFT SIDE */}
        <ImageSide />

        {/* RIGHT SIDE */}
        <div className="w-full h-full rounded-2xl bg-surface-raised flex items-center justify-center pointer-events-auto p-2">
          <div className="w-full flex flex-col gap-8 p-24">
            <div className="flex flex-col gap-2">
              <h1 className="text-7xl font-bold tracking-tight text-main text-center font-fraunces">
                404
              </h1>

              <p className="text-base leading-7 text-ink-muted text-center">
                Ta strona nie istnieje :(
              </p>
            </div>

              <NovLink
                unstyled
                href="/"
                className="w-full h-fit px-12 py-4 bg-main text-center text-white rounded-xl font-fraunces brightness-100 hover:brightness-125 transition-all"
              >
                ← Powrót na stronę główną
              </NovLink>
          </div>
        </div>

      </main>
    </div>
  );
}