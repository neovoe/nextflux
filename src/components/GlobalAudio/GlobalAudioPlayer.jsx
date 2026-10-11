import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useStore } from "@nanostores/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { Audio, AudioPlayer, usePlayer } from "@videojs/react/audio";
import { Container } from "@videojs/react";
import {
  AudioPlayButton,
  AudioSeekButton,
  AudioTimeline,
  AudioRateButton,
} from "./AudioControls.jsx";
import { I18nProvider } from "@videojs/react/i18n";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import {
  activeAudio,
  audioDock,
  audioExpanded,
  resetAudio,
  attachAudioController,
  publishAudioPlayback,
} from "@/stores/audioStore.js";
import {
  getAdapterSource,
  getMediaSelection,
} from "@/domain/articles/mediaSource.js";
import useAudioProgress from "@/components/ArticleView/hooks/useAudioProgress.js";
import { cn } from "@/lib/utils.js";
import { useReducedMotion } from "@/hooks/useReducedMotion.js";

const MotionContainer = motion.create(Container);
const panelTransition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] };

const HlsAudio = lazy(() =>
  import("@videojs/react/media/hls-audio").then((module) => ({
    default: module.HlsAudio,
  })),
);

export default function GlobalAudioPlayer() {
  const track = useStore(activeAudio);
  const { i18n } = useTranslation();
  return (
    <I18nProvider locale={i18n.resolvedLanguage || i18n.language}>
      <AnimatePresence mode="wait">
        {track && (
          <AudioPlayer key={track.key} title={track.title}>
            <AudioSurface track={track} />
          </AudioPlayer>
        )}
      </AnimatePresence>
    </I18nProvider>
  );
}

function AudioSurface({ track }) {
  const isPresent = useIsPresent();
  const expanded = useStore(audioExpanded);
  const dock = useStore(audioDock);
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const player = usePlayer();
  const paused = usePlayer((state) => state.paused);
  const canPlay = usePlayer((state) => state.canPlay);
  const waiting = usePlayer((state) => state.waiting);
  const currentTime = usePlayer((state) => state.currentTime);
  const duration = usePlayer((state) => state.duration);
  const controlTransition = {
    duration: reduceMotion ? 0 : 0.18,
    ease: [0.22, 1, 0.36, 1],
  };
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(true);
  const loading = !error && (starting || !canPlay || (!paused && waiting));
  const panelRef = useRef(null);
  const mediaRef = useRef(null);
  const attachMedia = useCallback((media) => {
    // Detached audio can keep playing; stop it immediately on source switch.
    if (!media) mediaRef.current?.pause();
    mediaRef.current = media;
  }, []);
  const started = useRef(false);
  const interacted = useRef(false);
  const mounted = useRef(true);
  const progress = useAudioProgress(track.enclosure);
  const selection = getMediaSelection(track);
  const Media = selection.adapter === "hls" ? HlsAudio : Audio;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // The exit animation keeps media mounted briefly; stop playback immediately.
    mounted.current = isPresent;
    if (!isPresent) player.pause();
  }, [isPresent, player]);

  useEffect(() => {
    if (!expanded || !isPresent) return;
    const onPointerDown = (event) => {
      if (
        event.button !== 0 ||
        event.composedPath().includes(panelRef.current) ||
        event.target.closest?.("[data-audio-player-menu]")
      )
        return;
      audioExpanded.set(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      audioExpanded.set(false);
      // Return keyboard focus to the compact surface after its controls mount.
      requestAnimationFrame(() => {
        panelRef.current
          ?.querySelector(':scope > button[aria-expanded="false"]')
          ?.focus();
      });
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded, isPresent]);

  const play = async () => {
    setError("");
    try {
      await player.play();
    } catch {
      if (mounted.current) setError(t("audioPlayer.playFailed"));
    }
  };
  const start = async (event) => {
    // Restore before starting: autoplay must not cancel the asynchronous restore.
    const restoring = progress.onLoadedMetadata(event);
    if (started.current) return;
    started.current = true;
    await restoring;
    if (mounted.current && !interacted.current) await play();
    if (mounted.current) setStarting(false);
  };
  const close = () => {
    // Flush the old position before its media/provider is unmounted.
    player.pause();
    resetAudio();
  };
  const interact = () => {
    interacted.current = true;
    progress.onSeeking();
    setError("");
  };

  // Both interfaces control this provider; the article never creates media.
  useEffect(() => {
    if (!isPresent) return;
    return attachAudioController(track.key, {
      pause: () => player.pause(),
      toggle: () => {
        interact();
        if (paused) void play();
        else player.pause();
      },
      seek: (time) => {
        if (!Number.isFinite(time) || !duration) return;
        interact();
        void player.seek(Math.max(0, Math.min(time, duration))).catch(() => {
          if (mounted.current) setError(t("audioPlayer.playFailed"));
        });
      },
    });
  });

  useEffect(() => {
    if (!isPresent) return;
    publishAudioPlayback(track.key, {
      paused,
      currentTime,
      duration,
      loading,
      ready: true,
      error,
    });
  }, [track.key, isPresent, paused, currentTime, duration, loading, error]);

  return (
    <>
      <Suspense fallback={null}>
        <Media
          mediaRef={attachMedia}
          src={selection.adapter === "native" ? track.src : selection.src}
          source={getAdapterSource(selection)}
          preload="metadata"
          crossOrigin={track.crossOrigin}
          loop={track.loop}
          aria-label={track.title}
          {...progress}
          onPlay={() => {
            interacted.current = true;
            progress.onPlay();
          }}
          onLoadedMetadata={start}
          onCanPlay={(event) => {
            progress.onCanPlay(event);
            if (!started.current) start(event);
          }}
          onPlaying={() => setError("")}
          onError={() => setError(t("audioPlayer.mediaFailed"))}
        >
          {selection.adapter === "native" &&
            track.sources?.map((source, index) => (
              <source key={index} {...source} />
            ))}
          {track.tracks?.map((item, index) => (
            <track key={index} {...item} />
          ))}
        </Media>
      </Suspense>
      {createPortal(
        <MotionContainer
          ref={panelRef}
          layout={reduceMotion ? false : true}
          layoutDependency={expanded}
          initial={{
            opacity: reduceMotion ? 1 : 0,
            y: reduceMotion ? 0 : 10,
            scale: reduceMotion ? 1 : 0.97,
          }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: reduceMotion ? 0 : 8,
            scale: reduceMotion ? 1 : 0.97,
          }}
          transition={{
            duration: reduceMotion ? 0 : 0.18,
            ease: panelTransition.ease,
            layout: panelTransition,
          }}
          style={{ transformOrigin: "bottom center" }}
          inert={!isPresent}
          aria-hidden={!isPresent}
          aria-label={t("audioPlayer.label")}
          className={cn(
            "article-media-player liquid-glass left-1/2 -translate-x-1/2 z-40 overflow-hidden text-foreground max-w-[calc(100%-1.5rem)]",
            dock
              ? "absolute bottom-0"
              : "fixed bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+4rem))]",
            expanded
              ? "max-h-[calc(100dvh-1.5rem)] w-72 rounded-2xl p-4"
              : "w-36 rounded-full p-1",
          )}
        >
          {!expanded && (
            <button
              type="button"
              className="absolute inset-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-label={t("audioPlayer.expand")}
              aria-expanded={false}
              onClick={() => audioExpanded.set(true)}
            />
          )}
          <AnimatePresence initial={false} mode="popLayout">
            {expanded ? (
              <motion.div
                key="expanded"
                layout={reduceMotion ? false : "position"}
                initial={{ opacity: reduceMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, pointerEvents: "none" }}
                transition={{
                  opacity: { duration: reduceMotion ? 0 : 0.12 },
                  layout: panelTransition,
                }}
              >
                <button
                  type="button"
                  className="mb-2 block w-full rounded-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("audioPlayer.collapse")}
                  aria-expanded
                  onClick={() => audioExpanded.set(false)}
                >
                  <span
                    className="block truncate text-sm font-semibold leading-snug"
                    title={track.title}
                  >
                    {track.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {track.artist}
                  </span>
                </button>
                <AudioTimeline onInteract={interact} />
                <div className="mt-1 flex items-center justify-between gap-1">
                  <AudioRateButton />
                  <AudioSeekButton seconds={-15} onInteract={interact} />
                  <AudioPlayButton
                    large
                    loading={loading}
                    onInteract={interact}
                  />
                  <AudioSeekButton seconds={30} onInteract={interact} />
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="rounded-full"
                    aria-label={t("audioPlayer.article")}
                    onClick={() => navigate(`/article/${track.articleId}`)}
                  >
                    <FileText />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                layout={reduceMotion ? false : "position"}
                className="pointer-events-none relative"
                initial={{ opacity: reduceMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: reduceMotion ? 0 : 0.12 },
                  layout: panelTransition,
                }}
              >
                <div className="pointer-events-none relative flex items-center [&_button]:pointer-events-auto">
                  <motion.div
                    initial={false}
                    animate={{
                      width: paused ? 0 : 40,
                      marginRight: paused ? 0 : 8,
                      opacity: paused ? 0 : 1,
                    }}
                    transition={controlTransition}
                    className="shrink-0 overflow-hidden"
                    inert={paused}
                    aria-hidden={paused}
                  >
                    <AudioSeekButton
                      compact
                      seconds={-15}
                      onInteract={interact}
                    />
                  </motion.div>
                  <AudioPlayButton loading={loading} onInteract={interact} />
                  <motion.div
                    initial={false}
                    animate={{ width: paused ? 88 : 40 }}
                    transition={controlTransition}
                    className="relative ml-2 h-10 shrink-0"
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: paused ? 1 : 0,
                        scale: paused ? 1 : 0.9,
                      }}
                      transition={controlTransition}
                      className="absolute inset-y-0 right-0 w-[88px]"
                      inert={!paused}
                      aria-hidden={!paused}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-10 w-full rounded-full"
                        aria-label={t("audioPlayer.close")}
                        onClick={close}
                      >
                        <X data-icon="inline-start" />
                        {t("common.close")}
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: paused ? 0 : 1,
                        scale: paused ? 0.9 : 1,
                      }}
                      transition={controlTransition}
                      className="absolute inset-y-0 right-0"
                      inert={paused}
                      aria-hidden={paused}
                    >
                      <AudioSeekButton
                        compact
                        seconds={30}
                        onInteract={interact}
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <span role="status" className="sr-only">
            {loading ? t("common.loading") : ""}
          </span>
          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </MotionContainer>,
        dock || document.body,
      )}
    </>
  );
}
