import { useRef } from "react";
import logo from "@/assets/logo.png";
import { Image } from "@heroui/react";

export const FancyLogo = ({ since }) => {
  const boundingRef = useRef(null);

  return (
    <div className="flex flex-col perspective-midrange p-5 bg-content2 dark:bg-transparent dark:border-b">
      <div
        onMouseLeave={() => {
          boundingRef.current = null;
        }}
        onMouseEnter={(ev) => {
          boundingRef.current = ev.currentTarget.getBoundingClientRect();
        }}
        onMouseMove={(ev) => {
          if (!boundingRef.current) return;
          const x = ev.clientX - boundingRef.current.left;
          const y = ev.clientY - boundingRef.current.top;
          const xPercentage = x / boundingRef.current.width;
          const yPercentage = y / boundingRef.current.height;
          const xRotation = (xPercentage - 0.5) * 20;
          const yRotation = (0.5 - yPercentage) * 20;
          const XBackground = 40 + 20 * xPercentage;
          const YBackground = 40 + 20 * yPercentage;

          ev.currentTarget.style.setProperty("--r-x", `${yRotation}deg`);
          ev.currentTarget.style.setProperty("--r-y", `${xRotation}deg`);
          ev.currentTarget.style.setProperty("--x", `${xPercentage * 100}%`);
          ev.currentTarget.style.setProperty("--y", `${yPercentage * 100}%`);
          ev.currentTarget.style.setProperty("--bg-x", `${XBackground}%`);
          ev.currentTarget.style.setProperty("--bg-y", `${YBackground}%`);
        }}
        className="group relative w-full flex flex-col gap-6 py-6 items-center overflow-hidden rounded-lg bg-linear-to-b from-green-100 to-green-200 dark:from-green-900 dark:to-green-950 p-2 text-[#01A977] transition-transform ease-out hover:[transform:rotateX(var(--r-x,0deg))_rotateY(var(--r-y,0deg))_scale(1.05)] shadow-custom [--x:50%] [--y:50%] [--bg-x:50%] [--bg-y:50%]"
      >
        <Image
          src={logo}
          alt="logo"
          classNames={{ wrapper: "size-24", image: "aspect-square" }}
        />
        <footer className="flex items-end">
          <span className="flex rounded-xs border border-current px-1 py-px text-xs uppercase">
            NEXTFLUX{" "}
            <span className="-my-px mx-1 inline-block w-4 border-l border-r border-current bg-[repeating-linear-gradient(-45deg,currentColor,currentColor_1px,transparent_1px,transparent_2px)]" />{" "}
            {since}
          </span>
        </footer>
        <div
          className="absolute inset-0 z-20 mix-blend-soft-light"
          style={{
            background: `radial-gradient(
              farthest-corner circle at var(--x) var(--y),
              rgba(255, 255, 255, 0.8) 10%,
              rgba(255, 255, 255, 0.65) 20%,
              rgba(255, 255, 255, 0) 90%
            )`,
          }}
        />
        <div
          className="absolute inset-0 z-10 mix-blend-color-dodge transition-opacity opacity-30"
          style={{
            backgroundBlendMode: "hue, hue, hard-light",
            background: ` 
              repeating-linear-gradient( 
                0deg,
                rgb(255, 119, 115) 5%,
                rgba(255, 237, 95, 1) 10%,
                rgba(168, 255, 95, 1) 15%,
                rgba(131, 255, 247, 1) 20%,
                rgba(120, 148, 255, 1) 25%, 
                rgb(216, 117, 255) 30%,
                rgb(255, 119, 115) 35%
              ) 0% var(--bg-y) / 200% 700%,
              repeating-linear-gradient(
                128deg,
                #0e152e 0%,
                hsl(180, 10%, 60%) 3.8%,
                hsl(180, 10%, 60%) 4.5%,
                hsl(180, 10%, 60%) 5.2%,
                #0e152e 10%,
                #0e152e 12%
              ) var(--bg-x) var(--bg-y) / 300%
            `,
          }}
        />
      </div>
    </div>
  );
};
