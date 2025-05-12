import {
  handleFinancialGoalSave,
  handleFinancialGoalUpdate,
} from "@/lib/api/financials";
import { useSession } from "@/lib/providers/AuthContext";
import { Goal } from "@/types/goal";
import { Post } from "@/types/post";
import { uuidv4 } from "@firebase/util";
import { useState } from "react";
import { Text, View } from "react-native";
import { GoalCard } from "./GoalCard";

const GoalPost = ({ post }: { post: Post }) => {
  const { session } = useSession();
  const userId = session?.uid;

  const [goals, setGoals] = useState<Goal[]>([]);

  const handleCopyingGoal = async (goal: Goal) => {
    if (userId) {
      const newGoal = { ...goal, id: uuidv4() }; // Create a copy with a new ID
      await handleFinancialGoalSave(newGoal, userId);
      setGoals((prevGoals) => [...prevGoals, newGoal]);
    }
  };

  const handleCheckboxChange = async (id: string) => {
    if (userId) {
      const updatedGoals = goals.map((goal) =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      );
      const updatedGoal = updatedGoals.find((goal) => goal.id === id);
      if (updatedGoal) {
        await handleFinancialGoalUpdate(updatedGoal, id, userId);
        setGoals(updatedGoals);
      }
    }
  };

  if (!post.goal) return null;

  return (
    <View style={{ padding: 16 }}>
      {post.post && (
        <Text style={{ marginBottom: 16, fontSize: 16 }}>{post.post}</Text>
      )}
      <GoalCard
        goal={post.goal}
        isLoggedInUser={post.posterUserId === userId}
        onGoalComplete={handleCheckboxChange}
        onCopyGoal={handleCopyingGoal}
      />
    </View>
  );
};

export default GoalPost;
