import { useRef, useState } from "react";
import { Image } from "@heroui/react";
import { cn } from "@/lib/utils.js";
import { settingsState } from "@/stores/settingsStore";
import { useStore } from "@nanostores/react";
import { ImageOff } from "lucide-react";
import { memo } from "react";

function ArticleCardCover({ imageUrl }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef(null);
  const { cardImageSize } = useStore(settingsState);

  if (!imageUrl) {
    return null;
  }

  if (error) {
    return (
      <div
        className={cn(
          "card-image bg-content3 rounded-lg shadow-custom overflow-hidden",
          cardImageSize === "large"
            ? "aspect-video w-full"
            : "w-20 h-20 shrink-0",
        )}
      >
        <div className="flex flex-col items-center justify-center h-full gap-2 text-content3-foreground">
          <ImageOff className="size-5 text-default-500" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        "card-image bg-content3 rounded-lg shadow-custom overflow-hidden",
        loading && "animate-pulse!",
        cardImageSize === "large"
          ? "aspect-video w-full"
          : "w-20 h-20 shrink-0",
      )}
    >
      <Image
        alt=""
        src={imageUrl}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
        radius="none"
        loading="eager"
        removeWrapper
        classNames={{
          img: cn(
            "object-cover",
            cardImageSize === "large"
              ? "aspect-video w-full"
              : "aspect-square w-20",
          ),
        }}
      />
    </div>
  );
}

const arePropsEqual = (prevProps, nextProps) => {
  return prevProps.imageUrl === nextProps.imageUrl;
};

export default memo(ArticleCardCover, arePropsEqual);
