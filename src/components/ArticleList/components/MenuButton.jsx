import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Divider,
  } from "@heroui/react";
  import {
    EllipsisVertical,
    FilePen,
    FolderPen,
    Trash2,
    RefreshCw,
  } from "lucide-react";
  import { useParams } from "react-router-dom";
  import {
    editFeedModalOpen,
    renameModalOpen,
    unsubscribeModalOpen,
    currentFeedId,
  } from "@/stores/modalStore.js";
  import { useTranslation } from "react-i18next";
  import { handleRefresh } from "@/handlers/feedHandlers";
  
  export default function MenuButton() {
    const { feedId, categoryId } = useParams();
    const { t } = useTranslation();
  
    return (
      <>
        <Dropdown>
          <DropdownTrigger>
            <Button
              size="sm"
              radius="full"
              variant="light"
              isIconOnly
              isDisabled={!feedId && !categoryId}
            >
              <EllipsisVertical className="size-4 text-default-500" />
            </Button>
          </DropdownTrigger>
          {feedId && (
            <DropdownMenu aria-label="Feed Actions" variant="flat">
              <DropdownItem
                key="refresh"
                onPress={() => handleRefresh(feedId)}
                startContent={<RefreshCw className="size-4 text-default-500" />}
              >
                {t("articleList.refreshFeed")}
              </DropdownItem>
              <DropdownItem
                key="edit"
                onPress={() => {
                  currentFeedId.set(feedId);
                  editFeedModalOpen.set(true);
                }}
                startContent={<FilePen className="size-4 text-default-500" />}
              >
                {t("articleList.editFeed")}
              </DropdownItem>
              <DropdownItem
            isDisabled
            classNames={{ base: "py-1.5" }}
            textValue="divider"
          >
            <Divider />
          </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                variant="flat"
                onPress={() => {
                  currentFeedId.set(feedId);
                  unsubscribeModalOpen.set(true);
                }}
                startContent={<Trash2 className="size-4" />}
              >
                {t("articleList.unsubscribe")}
              </DropdownItem>
            </DropdownMenu>
          )}
          {categoryId && (
            <DropdownMenu aria-label="Category Actions" variant="flat">
              <DropdownItem
                key="rename"
                onPress={() => renameModalOpen.set(true)}
                startContent={<FolderPen className="size-4 text-default-500" />}
              >
                {t("articleList.renameCategory.title")}
              </DropdownItem>
            </DropdownMenu>
          )}
        </Dropdown>
      </>
    );
  }
  