import { useState } from "react";
import { usePlayer } from "@videojs/react/audio";
import { useTranslation } from "react-i18next";
import {
  usePlaybackRateOptions,
  PlayButton,
  SeekButton,
  Time,
  TimeSlider,
} from "@videojs/react";
import { CircleGauge, LoaderCircle, Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu.jsx";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";
import { useReducedMotion } from "@/hooks/useReducedMotion.js";

const sliderRoot =
  "group relative flex h-7 w-full touch-none select-none items-center outline-none data-[disabled]:opacity-40";
const sliderTrack =
  "relative h-1 w-full overflow-hidden rounded-full bg-foreground/10 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-background";
const sliderFill =
  "absolute inset-y-0 left-0 w-[var(--media-slider-fill)] rounded-full bg-foreground/65";
const sliderThumb =
  "absolute left-[var(--media-slider-fill)] size-3 -translate-x-1/2 rounded-full bg-foreground opacity-0 shadow-sm group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[dragging]:opacity-100";

export function AudioPlayButton({ large, loading = false, onInteract }) {
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();
  return (
    <PlayButton
      onClick={onInteract}
      render={(props, state) => (
        <Button
          {...props}
          aria-busy={loading}
          title={loading ? t("common.loading") : undefined}
          variant="ghost"
          size="icon-lg"
          className={cn(
            "rounded-full",
            !large && "[&_svg:not([class*='size-'])]:size-6",
            large && "size-11 [&_svg:not([class*='size-'])]:size-7",
          )}
        >
          <span
            aria-hidden="true"
            className={cn("relative block", large ? "size-7" : "size-6")}
          >
            <AnimatePresence initial={false}>
              <motion.span
                key={loading ? "loading" : state.paused ? "play" : "pause"}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: reduceMotion || large ? 0 : 0.14 }}
              >
                {loading ? (
                  <LoaderCircle
                    className={cn(
                      "text-muted-foreground",
                      !reduceMotion && "animate-spin",
                    )}
                  />
                ) : state.paused ? (
                  <Play className="fill-current" />
                ) : (
                  <Pause className="fill-current" />
                )}
              </motion.span>
            </AnimatePresence>
          </span>
        </Button>
      )}
    />
  );
}

export function AudioSeekButton({ seconds, compact, onInteract }) {
  const { t } = useTranslation();
  return (
    <SeekButton
      seconds={seconds}
      label={t(seconds < 0 ? "audioPlayer.backward" : "audioPlayer.forward")}
      onClick={onInteract}
      render={(props) => (
        <Button
          {...props}
          variant="ghost"
          size="icon-lg"
          className="relative rounded-full"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={cn(compact ? "size-6" : "size-7")}
            fill="none"
          >
            <g
              transform={
                seconds > 0 ? "translate(24 0) scale(-1 1)" : undefined
              }
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 4.5h3A8.5 8.5 0 1 1 3.5 13" />
              <path d="m12 1.5-3 3 3 3" />
            </g>
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fill="currentColor"
              fontSize="8"
              fontWeight="600"
              letterSpacing="-0.3"
              className="tabular-nums"
            >
              {Math.abs(seconds)}
            </text>
          </svg>
        </Button>
      )}
    />
  );
}

export function AudioTimeline({ onInteract }) {
  return (
    <div className="w-full">
      <TimeSlider.Root
        className={cn(sliderRoot, "audio-player-slider")}
        onPointerDown={onInteract}
        onKeyDown={onInteract}
      >
        <TimeSlider.Track className={sliderTrack}>
          <TimeSlider.Buffer className="absolute inset-y-0 left-0 w-[var(--media-slider-buffer)] rounded-full bg-foreground/10" />
          <TimeSlider.Fill className={sliderFill} />
        </TimeSlider.Track>
        <TimeSlider.Thumb className={sliderThumb} />
      </TimeSlider.Root>
      <Time.Group className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <Time.Value type="current" />
        <Time.Value type="remaining" />
      </Time.Group>
    </div>
  );
}

const audioPlaybackRates = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function AudioRateButton() {
  const player = usePlayer();
  const rate = usePlaybackRateOptions();
  const [open, setOpen] = useState(false);
  if (!rate) return null;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            className="rounded-full text-xs tabular-nums"
          />
        }
        aria-label={rate.label}
        disabled={rate.disabled}
      >
        {rate.rate === 1 ? <CircleGauge /> : `${rate.rate}×`}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="min-w-28"
        data-audio-player-menu
      >
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={rate.value}
            onValueChange={(value) => {
              player.setPlaybackRate(Number(value));
              setOpen(false);
            }}
            aria-label={rate.label}
          >
            {audioPlaybackRates.map((speed) => (
              <DropdownMenuRadioItem
                key={speed}
                value={String(speed)}
                onClick={() => setOpen(false)}
              >
                {speed}×
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
