import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "@heroui/react";
import { MiniCloseButton } from "@/components/ui/MiniCloseButton.jsx";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { popUpVariants } from "@/lib/motion";
export default function AlertDialog({
  title,
  content,
  isOpen,
  onConfirm,
  onClose,
  cancelText = "取消",
  confirmText = "确定",
  confirmColor = "danger",
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("确认操作失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      radius="md"
      size="sm"
      motionProps={{
        variants: popUpVariants,
      }}
      isOpen={isOpen}
      hideCloseButton
      onClose={onClose}
      classNames={{
        base: "alert-dialog standalone:mb-safe-or-2 relative shadow-custom!",
        body: "px-4 py-4 items-center sm:flex-row sm:items-start",
        footer: "px-4 py-4 flex flex-col-reverse sm:flex-row",
      }}
    >
      <ModalContent>
        <ModalBody>
          <div className="absolute right-3 top-3">
            <MiniCloseButton onClose={onClose} />
          </div>
          <div className="danger-icon size-10 rounded-full bg-danger-50 content-center shrink-0">
            <TriangleAlert className="text-danger mx-auto mb-1" />
          </div>
          <div className="info space-y-3 w-full">
            <div className="font-semibold text-center sm:text-left">
              {title}
            </div>
            <div className="text-sm text-default-500 text-center sm:text-left">
              {content}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            variant="flat"
            onPress={onClose}
            size="sm"
            className="border text-sm"
          >
            {cancelText}
          </Button>
          <Button
            color={confirmColor}
            onPress={handleConfirm}
            isLoading={loading}
            size="sm"
            className="border-danger border shadow-custom-button bg-danger bg-linear-to-b from-white/15 to-transparent text-sm"
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
