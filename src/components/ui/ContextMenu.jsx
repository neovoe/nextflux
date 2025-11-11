import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const ContextMenu = ({ isOpen, onClose, position, children }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && menuRef.current && position) {
      const menu = menuRef.current;
      const menuRect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;

      // Adjust horizontal position if menu would overflow
      if (x + menuRect.width > viewportWidth) {
        x = viewportWidth - menuRect.width - 10;
      }

      // Adjust vertical position if menu would overflow
      if (y + menuRect.height > viewportHeight) {
        y = viewportHeight - menuRect.height - 10;
      }

      // Ensure menu doesn't go off the left or top edge
      x = Math.max(10, x);
      y = Math.max(10, y);

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "fixed z-[9999] min-w-[180px] rounded-lg",
        "bg-content1 shadow-lg border border-divider",
        "py-1 animate-in fade-in-0 zoom-in-95 duration-100"
      )}
      style={{
        left: position?.x || 0,
        top: position?.y || 0,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

const ContextMenuItem = ({ onClick, children, className }) => {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "px-3 py-2 cursor-pointer text-sm",
        "hover:bg-default/40 transition-colors",
        "text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
};

export { ContextMenu, ContextMenuItem };
