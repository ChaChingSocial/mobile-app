import { Goal } from "@/types/goal";
import { useState } from "react";
import { Alert, Modal, TouchableOpacity } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { ButtonText, Button } from "@/components/ui/button";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
} from "@/components/ui/checkbox";
import { HStack } from "@/components/ui/hstack";
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  Icon,
} from "@/components/ui/icon";
import {
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { VStack } from "@/components/ui/vstack";
import { calculateDaysLeft, formatDate } from "@/lib/utils/dates";
import { LinearGradient } from "react-native-svg";
import { Text } from "@/components/ui/text";

type GoalCardProps = {
  goal: Goal;
  onDeletedGoal?: (goal: Goal) => void;
  onGoalComplete: (goalId: string) => void;
  onEditGoal?: (goal: Goal) => void;
  onShareGoal?: (goal: Goal) => void;
  onCopyGoal?: (goal: Goal) => void;
  isLoggedInUser?: boolean;
};

export const GoalCard = ({
  goal,
  onDeletedGoal,
  onGoalComplete,
  onEditGoal,
  onShareGoal,
  onCopyGoal,
  isLoggedInUser,
}: GoalCardProps) => {
  const formattedDeadline = goal.deadline ? formatDate(goal.deadline) : null;
  const daysLeft = goal.deadline ? calculateDaysLeft(goal.deadline) : null;
  const [notify, setNotify] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleCheckboxChange = () => {
    if (goal.id) {
      onGoalComplete(goal.id);
    }
  };

  const getGradientColors = () => {
    if (daysLeft && daysLeft < 0) {
      return ["#f12711", "#ab1a0a"];
    } else if (daysLeft && daysLeft < 30) {
      return ["#f12711", "#f5af19"];
    } else {
      return ["#5d2c8c", "#9054c9"];
    }
  };

  const assignGoalIcon = (group: string) => {
    switch (group) {
      case "Saving":
        return "💰";
      case "Investing":
        return "🏦";
      case "Income":
        return "💵";
      case "Debt":
        return "❤️";
      case "Health":
        return "🏥";
      case "Retirement":
        return "🏡";
      default:
        return "🎯";
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete Goal", "Are you sure you want to delete this goal?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => onDeletedGoal && onDeletedGoal(goal),
        style: "destructive",
      },
    ]);
  };

  return (
    <Box className="bg-white rounded-lg p-4 my-2 shadow-sm">
      {isLoggedInUser && (
        <>
          {/* Mobile Menu Button */}
          <TouchableOpacity
            className="absolute top-4 right-4 z-10"
            onPress={() => setMenuVisible(true)}
          >
            <Icon
              as={MoreVerticalIcon}
              size="md"
              className="color-purple-500"
            />
          </TouchableOpacity>

          {/* Menu Modal */}
          <Modal
            visible={menuVisible}
            onRequestClose={() => setMenuVisible(false)}
          >
            <ModalBackdrop />
            <ModalContent>
              <ModalHeader>
                <Text className="text-lg font-bold">Goal Options</Text>
                <ModalCloseButton>
                  <Icon as={CloseIcon} />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <VStack space="md">
                  <TouchableOpacity
                    className="flex-row items-center p-2"
                    onPress={() => {
                      onShareGoal?.(goal);
                      setMenuVisible(false);
                    }}
                  >
                    <Icon
                      as={Share2Icon}
                      size="md"
                      className="mr-2 color-purple-500"
                    />
                    <Text>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center p-2"
                    onPress={() => {
                      onEditGoal?.(goal);
                      setMenuVisible(false);
                    }}
                  >
                    <Icon as={EditIcon} size="md" color="$purple500" mr="$2" />
                    <Text>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center p-2"
                    onPress={() => {
                      confirmDelete();
                      setMenuVisible(false);
                    }}
                  >
                    <Icon
                      as={Trash2Icon}
                      size="md"
                      className="mr-2 color-purple-500"
                    />
                    <Text>Delete</Text>
                  </TouchableOpacity>
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Desktop Buttons */}
          <HStack className="absolute top-4 right-4 space-x-4 hidden md:flex">
            <TouchableOpacity onPress={() => onShareGoal?.(goal)}>
              <Icon as={Share2Icon} size="md" className="color-purple-500" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onEditGoal?.(goal)}>
              <Icon as={EditIcon} size="md" className="color-purple-500" />
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDelete}>
              <Icon as={Trash2Icon} size="md" className="color-purple-500" />
            </TouchableOpacity>
          </HStack>
        </>
      )}

      <HStack className="items-start">
        {isLoggedInUser && (
          <Checkbox
            value={goal.id || ""}
            isChecked={goal.completed}
            onChange={handleCheckboxChange}
            aria-label="Complete goal"
            className="mr-3"
          >
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
          </Checkbox>
        )}

        <VStack className="flex-1 ml-2">
          <HStack className="justify-between items-center flex-wrap">
            <Text className="text-xl font-bold">
              {assignGoalIcon(goal.group || "")} {goal.title}
            </Text>

            {goal.deadline && (
              <>
                <LinearGradient
                  colors={getGradientColors()}
                  start={[0, 0]}
                  end={[1, 0]}
                  className="rounded-full px-3 py-1 ml-2"
                ></LinearGradient>
                <Badge>
                  <BadgeText className="text-white font-bold text-sm">
                    {formattedDeadline} -{" "}
                    {daysLeft && daysLeft < 0
                      ? `${Math.abs(daysLeft)} ${
                          Math.abs(daysLeft) === 1 ? "day" : "days"
                        } ago`
                      : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`}
                  </BadgeText>
                </Badge>
              </>
            )}
          </HStack>

          {goal.impact && (
            <Text className="text-base mt-2">
              <Text className="font-bold">Impact:</Text> {goal.impact}
            </Text>
          )}

          {goal.source && (
            <Text className="text-sm text-gray-500 mt-2">
              <Text className="font-bold">Source:</Text> {goal.source}
            </Text>
          )}
        </VStack>

        {!isLoggedInUser && (
          <TouchableOpacity
            onPress={() => {
              onCopyGoal?.(goal);
              setNotify(true);
            }}
            className="ml-2"
          >
            <Icon as={CopyIcon} size="md" color="$purple500" />
          </TouchableOpacity>
        )}
      </HStack>

      {/* Notification Modal */}
      <Modal visible={notify} onRequestClose={() => setNotify(false)}>
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Text className="text-lg font-bold">Goal Saved</Text>
            <ModalCloseButton>
              <Icon as={CloseIcon} />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <Text>
              {goal.title} is now saved as your personal goal. You can track
              your progress on your profile.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button onPress={() => setNotify(false)} className="bg-purple-500">
              <ButtonText>OK</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
