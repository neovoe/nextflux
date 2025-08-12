import { Listbox, ListboxItem } from "@heroui/react";
import { cn } from "@/lib/utils";
import { Image } from "@heroui/react";
import FeedIcon from "@/components/ui/FeedIcon";
export default function ResultListbox({ results, searchType, handleSelect }) {
  const ListboxWrapper = ({ children }) => (
    <div
      className={cn(
        "w-full border-small bg-content2 h-56 overflow-y-auto p-1 rounded-small shadow-custom-inner",
        results.length === 0 ? "opacity-0" : "opacity-100",
      )}
    >
      {children}
    </div>
  );
  return (
    <ListboxWrapper>
      <Listbox
        disallowEmptySelection
        selectionMode="single"
        variant="flat"
        aria-label="results"
        items={results}
        hideEmptyContent
        onSelectionChange={(keys) => {
          handleSelect(keys);
        }}
        itemClasses={{
          wrapper: "overflow-hidden",
          title: "max-w-full",
          description: "max-w-full",
        }}
      >
        {(item) => (
          <ListboxItem
            key={item.url}
            textValue={item.url}
            description={item.url}
            startContent={
              searchType === "podcast" ? (
                <Image
                  src={item.icon_url}
                  alt={item.title}
                  classNames={{
                    wrapper:
                      "size-8 rounded-sm shadow-small shrink-0 overflow-hidden",
                    img: "size-8 rounded-none",
                  }}
                />
              ) : (
                <FeedIcon feedId={null} url={item.url} />
              )
            }
          >
            {item.title || item.url}
          </ListboxItem>
        )}
      </Listbox>
    </ListboxWrapper>
  );
}
