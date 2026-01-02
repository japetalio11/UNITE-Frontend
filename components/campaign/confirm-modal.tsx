"use client";
import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Avatar } from "@heroui/avatar";
import { Check, Xmark, TrashBin } from "@gravity-ui/icons";
import { Textarea } from "@heroui/input";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  onConfirm: (note?: string) => Promise<void> | void;
  requireNote?: boolean;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
}

const ConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  onConfirm,
  requireNote = false,
  color = "primary",
}) => {
  const [note, setNote] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Ref-based lock to prevent race conditions (set synchronously before state updates)
  const isSubmittingRef = React.useRef(false);

  const handleConfirm = async () => {
    // Prevent duplicate submissions - check ref first (synchronous, prevents race conditions)
    if (isSubmittingRef.current) {
      console.warn("[ConfirmModal] ❌ BLOCKED: Already submitting (ref check), ignoring duplicate call");
      return;
    }
    
    // Also check state (redundant but safe)
    if (isSubmitting) {
      console.warn("[ConfirmModal] ❌ BLOCKED: Already submitting (state check), ignoring duplicate call");
      return;
    }

    // Set ref immediately (synchronous) to prevent race conditions
    isSubmittingRef.current = true;

    setValidationError(null);
    if (requireNote && (!note || note.trim().length === 0)) {
      setValidationError("Please provide a reason");
      // Reset ref if validation fails
      isSubmittingRef.current = false;
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(note.trim());
      setNote("");
      setValidationError(null);
      onClose();
    } catch (error) {
      console.error("[ConfirmModal] Error in onConfirm:", error);
      // Don't close modal on error, let the parent handle it
    } finally {
      setIsSubmitting(false);
      // Reset ref in finally to ensure it's always cleared
      isSubmittingRef.current = false;
    }
  };

  return (
    <Modal isOpen={isOpen} placement="center" size="md" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Avatar
              className={`border-1 border-default ${
                String(confirmText || "")
                  .toLowerCase()
                  .includes("delete") ||
                String(confirmText || "")
                  .toLowerCase()
                  .includes("cancel") ||
                String(confirmText || "")
                  .toLowerCase()
                  .includes("reject")
                  ? "bg-danger-50 border-danger-200"
                  : "bg-default-100"
              }`}
              icon={
                String(confirmText || "")
                  .toLowerCase()
                  .includes("delete") ||
                String(confirmText || "")
                  .toLowerCase()
                  .includes("cancel") ? (
                  <TrashBin
                    className={
                      String(confirmText || "")
                        .toLowerCase()
                        .includes("delete") ||
                      String(confirmText || "")
                        .toLowerCase()
                        .includes("cancel")
                        ? "text-danger-500"
                        : "text-default-600"
                    }
                  />
                ) : String(confirmText || "")
                    .toLowerCase()
                    .includes("reject") ? (
                  <Xmark className="text-danger-500" />
                ) : (
                  <Check className="text-default-600" />
                )
              }
            />
          </div>
          <h3 className="text-sm font-semibold py-2">{title}</h3>
          <p className="text-xs font-normal">
            {message || "Please confirm this action."}
          </p>
        </ModalHeader>
        <ModalBody className="py-4">
          <div className="space-y-4">
            {requireNote ? (
              <div className="space-y-1">
                <label className="text-xs font-medium">Note</label>
                <Textarea
                  classNames={{
                    inputWrapper: "border-default-200",
                  }}
                  minRows={3}
                  radius="md"
                  size="sm"
                  value={note}
                  variant="bordered"
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            ) : null}
            {validationError ? (
              <div className="text-sm text-danger">{validationError}</div>
            ) : null}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button 
            className="w-full" 
            variant="bordered" 
            onPress={onClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            className="w-full" 
            color={color} 
            onPress={handleConfirm}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmModal;
