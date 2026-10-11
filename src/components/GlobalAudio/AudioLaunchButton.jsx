import { useState } from "react";
import { useStore } from "@nanostores/react";
import { useTranslation } from "react-i18next";
import { Slider } from "@base-ui/react/slider";
import { ArrowUpRight, LoaderCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  activeAudio,
  audioExpanded,
  audioPlayback,
  controlAudio,
  playAudio,
} from "@/stores/audioStore.js";
import { getMediaSelection } from "@/domain/articles/mediaSource.js";
import { useReducedMotion } from "@/hooks/useReducedMotion.js";
import { cn } from "@/lib/utils.js";

function formatTime(value) {
  const seconds = Math.floor(Math.max(0, Number.isFinite(value) ? value : 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  return `${hours ? `${hours}:${String(minutes).padStart(2, "0")}` : minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function AudioLaunchButton({ article, ...media }) {
  const current = useStore(activeAudio);
  const playback = useStore(audioPlayback);
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const selection = getMediaSelection(media);
  const key = JSON.stringify([article.id, media.enclosure?.id, selection.src]);
  const selected = current?.key === key;
  const state = selected && playback.key === key ? playback : null;
  const paused = state?.paused ?? true;
  const loading = state?.loading ?? false;
  const track = {
    ...media,
    key,
    title: media.title || article.title,
    artist: article.feed?.title || "",
    articleId: article.id,
  };

  return (
    <div
      role="group"
      aria-label={t("audioPlayer.inline")}
      className="article-media-player not-prose group/inline mx-auto my-4 w-full max-w-sm rounded-full border border-primary/20 bg-primary/10 px-2.5 py-2 shadow-custom"
    >
      <div className="flex items-center gap-2.5">
        <Button
          variant="default"
          size="icon-sm"
          className="rounded-full bg-foreground text-background hover:bg-foreground/85 hover:text-background"
          aria-label={t(paused ? "audioPlayer.play" : "audioPlayer.pause")}
          aria-busy={loading}
          title={loading ? t("common.loading") : undefined}
          disabled={!selection.src || (selected && !state?.ready)}
          onClick={() =>
            selected ? controlAudio(key, "toggle") : playAudio(track)
          }
        >
          {loading ? (
            <LoaderCircle
              className={cn("size-5", !reduceMotion && "animate-spin")}
            />
          ) : paused ? (
            <Play className="size-4 fill-current" />
          ) : (
            <Pause className="size-4 fill-current" />
          )}
        </Button>
        <span className="sr-only">
          {t(
            loading
              ? "common.loading"
              : !selected
                ? "audioPlayer.listen"
                : paused
                  ? "audioPlayer.paused"
                  : "audioPlayer.playing",
          )}
        </span>
        <InlineTimeline
          key={`${key}:${selected}`}
          trackKey={key}
          state={state}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full text-muted-foreground"
          aria-label={t("audioPlayer.open")}
          title={t("audioPlayer.open")}
          disabled={!selected}
          onClick={() => audioExpanded.set(true)}
        >
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
      {state?.error && (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
      )}
    </div>
  );
}

function InlineTimeline({ trackKey, state }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(null);
  const currentTime = state?.currentTime || 0;
  const duration = Number.isFinite(state?.duration) ? state.duration : 0;
  const position = Math.min(draft ?? currentTime, duration || 0);
  return (
    <div className="min-w-0 flex-1">
      <Slider.Root
        min={0}
        max={duration || 1}
        step={1}
        value={position}
        disabled={!state?.ready || duration <= 0}
        onValueChange={(value) => setDraft(value)}
        onValueCommitted={(value) => {
          controlAudio(trackKey, "seek", value);
          setDraft(null);
        }}
      >
        <Slider.Control className="group/seek relative flex h-3 w-full touch-none items-center select-none data-disabled:opacity-40">
          <Slider.Track className="h-1 w-full overflow-hidden rounded-full bg-foreground/10">
            <Slider.Indicator className="h-full rounded-full bg-foreground/65" />
          </Slider.Track>
          <Slider.Thumb
            aria-label={t("audioPlayer.seek")}
            aria-valuetext={`${formatTime(position)} / ${formatTime(duration)}`}
            className="block size-2.5 rounded-full bg-foreground opacity-0 outline-none transition-opacity group-hover/inline:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </Slider.Control>
      </Slider.Root>
      <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
        <span>{formatTime(position)}</span>
        <span>
          {duration > 0 ? `-${formatTime(duration - position)}` : "--:--"}
        </span>
      </div>
    </div>
  );
}
