import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Icon, CloseIcon } from "@/components/ui/icon";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { useState } from "react";

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string, alsoReport?: boolean) => void;
  userName?: string;
  loading?: boolean;
}

function BlockUserModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  loading = false,
}: BlockUserModalProps) {
  const [reason, setReason] = useState("");
  const [alsoReport, setAlsoReport] = useState(false);

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined, alsoReport);
    // Reset state
    setReason("");
    setAlsoReport(false);
  };

  const handleClose = () => {
    setReason("");
    setAlsoReport(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
    >
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="lg">Block User</Heading>
          <ModalCloseButton>
            <Icon as={CloseIcon} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack space="md">
            <Text>
              {userName
                ? `Are you sure you want to block @${userName}?`
                : "Are you sure you want to block this user?"}
            </Text>
            <Text size="sm" className="text-gray-600">
              When you block this user:
            </Text>
            <VStack space="xs" className="ml-4">
              <Text size="sm" className="text-gray-600">
                • You won't see their posts or comments
              </Text>
              <Text size="sm" className="text-gray-600">
                • They won't be able to interact with your content
              </Text>
              <Text size="sm" className="text-gray-600">
                • Their content will be removed from your feed immediately
              </Text>
            </VStack>

            <Textarea className="min-h-24">
              <TextareaInput
                value={reason}
                onChangeText={setReason}
                placeholder="Reason for blocking (optional)"
                multiline
                textAlignVertical="top"
              />
            </Textarea>

            <Checkbox
              value="report"
              isChecked={alsoReport}
              onChange={setAlsoReport}
              size="sm"
            >
              <CheckboxIndicator>
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel className="ml-2">
                Also report this user to developers
              </CheckboxLabel>
            </Checkbox>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            action="secondary"
            className="mr-3"
            onPress={handleClose}
            isDisabled={loading}
          >
            <ButtonText>Cancel</ButtonText>
          </Button>
          <Button
            action="negative"
            onPress={handleConfirm}
            isDisabled={loading}
          >
            <ButtonText>{loading ? "Blocking..." : "Block User"}</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default BlockUserModal;
