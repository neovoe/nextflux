import { atom } from "nanostores";
import {
  getFeeds,
  getArticlesCount,
  getArticlesByPage,
  addArticles,
  getUnreadCount,
  getStarredCount,
} from "../db/storage";
import minifluxAPI from "../api/miniflux";
import { starredCounts, unreadCounts } from "./feedsStore.js";
import { settingsState } from "./settingsStore";

export const filteredArticles = atom([]);
export const activeArticle = atom(null);
export const loading = atom(false); // 加载文章列表
export const loadingMore = atom(false); // 加载更多文章
export const loadingOriginContent = atom(false);
export const error = atom(null);
export const filter = atom("all");
export const imageGalleryActive = atom(false);
export const hasMore = atom(true);
export const currentPage = atom(1);
export const pageSize = atom(30);
export const visibleRange = atom({
  startIndex: 0,
  endIndex: 0,
});

// 加载文章列表
export async function loadArticles(
  sourceId = null,
  type = "feed",
  page = 1,
  append = false,
) {
  error.set(null);

  try {
    const feeds = await getFeeds();
    const settings = settingsState.get();
    const showHiddenFeeds = settings.showHiddenFeeds;
    let targetFeeds;

    // 根据类型确定要加载的订阅源
    if (type === "category" && sourceId) {
      targetFeeds = feeds.filter(
        (feed) =>
          feed.categoryId === parseInt(sourceId) &&
          (showHiddenFeeds || !feed.hide_globally),
      );
    } else if (sourceId) {
      targetFeeds = feeds.filter(
        (feed) =>
          feed.id === parseInt(sourceId) &&
          (showHiddenFeeds || !feed.hide_globally),
      );
    } else {
      targetFeeds = showHiddenFeeds
        ? feeds
        : feeds.filter((feed) => !feed.hide_globally);
    }

    // 获取目标订阅源的文章总数
    const total = await getArticlesCount(
      targetFeeds.map((feed) => feed.id),
      filter.get(),
    );

    // 分页获取文章
    const articles = await getArticlesByPage(
      targetFeeds.map((feed) => feed.id),
      filter.get(),
      page,
      pageSize.get(),
      settings.sortDirection,
      settings.sortField,
    );

    // 计算分页状态
    const isMore = articles.length === pageSize.get();

    // 根据是否追加来更新文章列表
    if (append) {
      filteredArticles.set([...filteredArticles.get(), ...articles]);
      hasMore.set(isMore);
      currentPage.set(page);
    }

    return { articles: articles, total, isMore };
  } catch (err) {
    console.error("加载文章失败:", err);
    error.set("加载文章失败");
  }
}

// 更新文章未读状态
export async function updateArticleStatus(article) {
  const newStatus = article.status === "read" ? "unread" : "read";

  // 乐观更新UI
  filteredArticles.set(
    filteredArticles
      .get()
      .map((a) => (a.id === article.id ? { ...a, status: newStatus } : a)),
  );

  try {
    // 并行执行在线和本地更新
    const updates = [
      // 如果在线则更新服务器
      navigator.onLine && minifluxAPI.updateEntryStatus(article),
      // 更新本地数据库
      addArticles([
        {
          ...article,
          status: newStatus,
        },
      ]),
      // 更新未读计数
      (async () => {
        const count = await getUnreadCount(article.feedId);
        const currentCounts = unreadCounts.get();
        unreadCounts.set({
          ...currentCounts,
          [article.feedId]: count,
        });
      })(),
    ].filter(Boolean);

    await Promise.all(updates);
  } catch (err) {
    // 发生错误时回滚UI状态
    filteredArticles.set(
      filteredArticles
        .get()
        .map((a) =>
          a.id === article.id ? { ...a, status: article.status } : a,
        ),
    );
    console.error("更新文章状态失败:", err);
    throw err;
  }
}

// 更新文章收藏状态
export async function updateArticleStarred(article) {
  const newStarred = article.starred === 1 ? 0 : 1;

  // 乐观更新UI
  filteredArticles.set(
    filteredArticles
      .get()
      .map((a) => (a.id === article.id ? { ...a, starred: newStarred } : a)),
  );

  try {
    // 并行执行在线和本地更新
    const updates = [
      // 如果在线则更新服务器
      navigator.onLine && minifluxAPI.updateEntryStarred(article),
      // 更新本地数据库
      addArticles([
        {
          ...article,
          starred: newStarred,
        },
      ]),
      // 更新收藏计数
      (async () => {
        const count = await getStarredCount(article.feedId);
        const currentCounts = starredCounts.get();
        starredCounts.set({
          ...currentCounts,
          [article.feedId]: count,
        });
      })(),
    ].filter(Boolean);

    await Promise.all(updates);
  } catch (err) {
    // 发生错误时回滚UI状态
    filteredArticles.set(
      filteredArticles
        .get()
        .map((a) =>
          a.id === article.id ? { ...a, starred: article.starred } : a,
        ),
    );
    console.error("更新文章星标状态失败:", err);
    throw err;
  }
}

// 改进后的 markAllAsRead 函数
export async function markAllAsRead(type = "all", id = null) {
  // 获取受影响的文章
  const articles = filteredArticles.get();
  const affectedArticles = articles.filter(
    (article) => article.status !== "read",
  );

  // 如果没有需要标记的文章，直接返回
  if (affectedArticles.length === 0) {
    return;
  }

  // 按 feedId 分组需要更新的文章
  const articlesByFeed = affectedArticles.reduce((acc, article) => {
    acc[article.feedId] = acc[article.feedId] || [];
    acc[article.feedId].push(article);
    return acc;
  }, {});

  // 乐观更新UI
  filteredArticles.set(
    articles.map((article) => ({
      ...article,
      status: "read",
    })),
  );

  try {
    // 并行执行更新
    await Promise.all(
      [
        // 更新服务器
        navigator.onLine && minifluxAPI.markAllAsRead(type, id),

        // 更新本地数据库
        addArticles(
          affectedArticles.map((article) => ({
            ...article,
            status: "read",
          })),
        ),

        // 批量更新未读计数
        (async () => {
          const counts = {};
          const feedIds = Object.keys(articlesByFeed);

          // 并行获取所有订阅源的未读计数
          const unreadCountsArray = await Promise.all(
            feedIds.map((feedId) => getUnreadCount(feedId)),
          );

          // 组装未读计数对象
          feedIds.forEach((feedId, index) => {
            counts[feedId] = unreadCountsArray[index];
          });

          unreadCounts.set({
            ...unreadCounts.get(),
            ...counts,
          });
        })(),
      ].filter(Boolean),
    );
  } catch (err) {
    // 发生错误时回滚UI状态
    filteredArticles.set(articles);
    console.error("标记已读失败:", err);
    throw err;
  }
}
