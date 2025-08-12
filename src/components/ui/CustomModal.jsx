import { useIsMobile } from "@/hooks/use-mobile.jsx";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  Modal,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { MiniCloseButton } from "@/components/ui/MiniCloseButton.jsx";
import { popUpVariants } from "@/lib/motion";

export default function CustomModal({ open, onOpenChange, title, children }) {
  const { isMedium } = useIsMobile();
  if (isMedium) {
    return (
      <Drawer
        isOpen={open}
        onOpenChange={onOpenChange}
        placement="bottom"
        hideCloseButton
        radius="sm"
        classNames={{
          base: "flex flex-col items-center max-h-[90vh]",
          header: "text-base font-medium p-4",
          body: "px-0 pt-0 pb-safe",
        }}
      >
        {/*<Drawer.Portal>*/}
        {/*  <Drawer.Overlay className="fixed inset-0 bg-black/50 z-20" />*/}
        {/*  <Drawer.Content className="bg-background flex flex-col fixed bottom-0 left-0 right-0 max-h-[82vh] rounded-t-lg z-20">*/}
        {/*    <div className="w-full mx-auto overflow-auto px-4 pt-2 rounded-t-lg">*/}
        {/*      <div className="max-w-sm mx-auto">*/}
        {/*        <Drawer.Handle />*/}
        {/*        <Drawer.Title className="font-medium text-foreground py-4 pl-4">*/}
        {/*          {title}*/}
        {/*        </Drawer.Title>*/}
        {/*        {content}*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </Drawer.Content>*/}
        {/*</Drawer.Portal>*/}
        <DrawerContent>
          {() => (
            <div className="max-w-sm w-full">
              <DrawerHeader>{title}</DrawerHeader>
              <DrawerBody>{children}</DrawerBody>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Modal
      isOpen={open}
      onClose={onOpenChange}
      motionProps={{
        variants: popUpVariants,
      }}
      placement="center"
      scrollBehavior="inside"
      radius="md"
      size="sm"
      hideCloseButton
      classNames={{
        header: "px-4 pt-3 pb-4 flex justify-between text-base font-medium",
        base: "p-0 shadow-custom!",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div>{title}</div>
          <MiniCloseButton onClose={onOpenChange} />
        </ModalHeader>
        {children}
      </ModalContent>
    </Modal>
  );
}
