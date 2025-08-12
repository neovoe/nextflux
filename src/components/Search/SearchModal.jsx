import { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Divider,
  Input,
  Kbd,
  Modal,
  ModalContent,
  Tab,
  Tabs,
} from "@heroui/react";
import { Search as SearchIcon } from "lucide-react";
import {
  feedSearchResults,
  search,
  searchFeeds,
  searching,
  searchResults,
} from "@/stores/searchStore";
import { searchDialogOpen } from "@/stores/modalStore.js";
import SearchResults from "./SearchResults";
import { useNavigate } from "react-router-dom";
import { settingsState } from "@/stores/settingsStore";
import { useTranslation } from "react-i18next";
import { filter } from "@/stores/articlesStore.js";
import { handleMarkStatus } from "@/handlers/articleHandlers";
import { debounce } from "lodash";
export default function SearchModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isOpen = useStore(searchDialogOpen);
  const $searchResults = useStore(searchResults);
  const $feedSearchResults = useStore(feedSearchResults);
  const { showHiddenFeeds } = useStore(settingsState);
  const [keyword, setKeyword] = useState("");
  const [searchType, setSearchType] = useState("articles");
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    searching.set(true);

    const handleSearch = debounce(
      async () => {
        if (!keyword) {
          searchResults.set([]);
          feedSearchResults.set([]);
          return;
        }

        searchType === "articles"
          ? searchResults.set([])
          : feedSearchResults.set([]);
        try {
          const res =
            searchType === "articles"
              ? await search(keyword)
              : await searchFeeds(keyword);

          if (ignore) {
            return;
          }

          searchType === "articles"
            ? searchResults.set(res)
            : feedSearchResults.set(res);
          searching.set(false);
        } catch {
          console.error("搜索失败");
          searching.set(false);
        }
      },
      500,
      { leading: false, trailing: true },
    );
    if (!isComposing) {
      handleSearch();
    }
    return () => {
      ignore = true;
    };
  }, [keyword, searchType, showHiddenFeeds, isComposing]);

  // 处理选择结果
  const handleSelect = (item) => {
    if (searchType === "articles") {
      navigate(`/article/${item.id}`);
      if (item.status !== "read") {
        handleMarkStatus(item);
      }
    } else {
      navigate(`/feed/${item.id}`);
    }
    filter.set("all");
    searchDialogOpen.set(false);
    setKeyword("");
  };

  // 打开时加载缓存，关闭时清空搜索
  useEffect(() => {
    if (!isOpen) {
      setKeyword("");
      searchResults.set([]);
      feedSearchResults.set([]);
      setSearchType("articles");
    }
  }, [isOpen, searchType]);

  return (
    <Modal
      isOpen={isOpen}
      hideCloseButton
      onOpenChange={(open) => searchDialogOpen.set(open)}
      backdrop="transparent"
      disableAnimation
      placement="center"
      size="2xl"
      classNames={{
        base: "m-2 max-h-[80vh] h-[440px] bg-content2/80 backdrop-blur-lg shadow-large",
      }}
    >
      <ModalContent>
        <div className="flex flex-col">
          <Input
            ref={inputRef}
            autoFocus
            placeholder={
              searchType === "articles"
                ? t("search.searchArticlesPlaceholder")
                : t("search.searchFeedsPlaceholder")
            }
            size="lg"
            value={keyword}
            radius="none"
            classNames={{
              mainWrapper: "border-b",
              inputWrapper:
                "h-14 shadow-none bg-transparent data-[hover=true]:bg-transparent group-data-[focus=true]:bg-transparent group-data-[focus-visible=true]:ring-0 group-data-[focus-visible=true]:ring-transparent group-data-[focus-visible=true]:ring-offset-0 group-data-[focus-visible=true]:ring-offset-transparent",
            }}
            startContent={<SearchIcon className="size-6 text-default-400" />}
            endContent={
              <Kbd
                classNames={{
                  base: "shadow-custom!",
                  content: "font-mono text-xs text-default-400",
                }}
              >
                ESC
              </Kbd>
            }
            onValueChange={(value) => setKeyword(value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
          />
        </div>
        <SearchResults
          results={
            searchType === "articles" ? $searchResults : $feedSearchResults
          }
          keyword={keyword}
          onSelect={handleSelect}
          type={searchType}
          isComposing={isComposing}
        />
        <div className="p-1.5 border-t flex items-center justify-between">
          <Tabs
            selectedKey={searchType}
            onSelectionChange={(key) => {
              setSearchType(key);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            radius="md"
            keyboardActivation="manual"
            classNames={{
              tabList: "bg-default/40 backdrop-blur-md gap-0",
              tab: "h-auto px-2",
              cursor: "w-full bg-default-400/90 shadow-none dark:bg-primary",
              tabContent:
                "text-xs text-default-500 font-semibold group-data-[selected=true]:text-default-50 dark:group-data-[selected=true]:text-foreground",
            }}
          >
            <Tab key="articles" title={t("common.article")} />
            <Tab key="feeds" title={t("common.feed")} />
          </Tabs>
          <div className="flex items-center gap-1 px-1">
            <Kbd
              keys="up"
              classNames={{
                base: "shadow-custom!",
                abbr: "text-xs text-default-500",
              }}
            />
            <Kbd
              keys="down"
              classNames={{
                base: "shadow-custom!",
                abbr: "text-xs text-default-500",
              }}
            />
            <span className="text-xs text-default-500 font-semibold">
              {t("search.toggleItem")}
            </span>
            <Divider orientation="vertical" className="h-5 mx-1" />
            <Kbd
              keys="enter"
              classNames={{
                base: "shadow-custom!",
                abbr: "text-xs text-default-500",
              }}
            />
            <span className="text-xs text-default-500 font-semibold">
              {t("search.open")}
            </span>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
