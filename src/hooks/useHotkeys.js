import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStore } from "@nanostores/react";
import {
  activeArticle,
  filteredArticles,
  imageGalleryActive,
} from "@/stores/articlesStore";
import {
  handleMarkStatus,
  handleToggleStar,
  handleToggleContent,
} from "@/handlers/articleHandlers";
import { forceSync } from "@/stores/syncStore";
import { shortcutsModalOpen } from "@/stores/modalStore";
import { addFeedModalOpen } from "@/stores/modalStore";
import { searchDialogOpen } from "@/stores/modalStore";
export function useHotkeys() {
  const navigate = useNavigate();
  const $articles = useStore(filteredArticles);
  const $activeArticle = useStore(activeArticle);
  const $imageGalleryActive = useStore(imageGalleryActive);
  const { articleId } = useParams();

  // 获取当前文章在列表中的索引
  const currentIndex = $articles.findIndex((a) => a.id === $activeArticle?.id);

  // 获取当前路径并去掉 article 部分
  const basePath = window.location.pathname.split("/article/")[0];

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // 如果焦点在输入框中,不触发快捷键
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "?": // 快捷键帮助
          e.preventDefault();
          shortcutsModalOpen.set(!shortcutsModalOpen.get());
          break;

          case "f": // 搜索
          e.preventDefault();
          searchDialogOpen.set(true);
          break;

        case "N": // 新建订阅源
          addFeedModalOpen.set(true);
          break;

        case "n": // 下一个订阅源
          break;

        case "p": // 上一个订阅源
          break;

        case "j": // 下一篇
          if (articleId && currentIndex < $articles.length - 1) {
            const nextArticle = $articles[currentIndex + 1];
            navigate(`${basePath}/article/${nextArticle.id}`);
            if (nextArticle.status !== "read") {
              await handleMarkStatus(nextArticle);
            }
          }
          break;

        case "k": // 上一篇
          if (currentIndex > 0) {
            const prevArticle = $articles[currentIndex - 1];
            navigate(`${basePath}/article/${prevArticle.id}`);
            if (prevArticle.status !== "read") {
              await handleMarkStatus(prevArticle);
            }
          }
          break;

        case "m": // 标记已读/未读
          if (articleId) {
            await handleMarkStatus($activeArticle);
          }
          break;

        case "s": // 收藏/取消收藏
          if (articleId) {
            await handleToggleStar($activeArticle);
          }
          break;

        case "g": // 原文/摘要切换
          if (articleId) {
            await handleToggleContent($activeArticle);
          }
          break;

        case "r": // 刷新
          if (!e.ctrlKey && !e.metaKey) {
            await forceSync();
          }
          break;

        case "escape": // 关闭文章
          if ($imageGalleryActive) {
            return;
          } else {
            navigate(basePath || "/");
          }
          break;

        case "b": // 在新标签页打开原文
          if (articleId) {
            window.open($activeArticle.url, "_blank");
          }
          break;

        default:
          break;
      }
    };

    const target = window;
    target.addEventListener("keydown", handleKeyDown);

    return () => {
      target.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    $activeArticle,
    currentIndex,
    $articles,
    basePath,
    navigate,
    articleId,
    $imageGalleryActive,
  ]);
}
