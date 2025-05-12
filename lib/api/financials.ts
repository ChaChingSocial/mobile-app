import { doc, collection, setDoc, getFirestore, updateDoc } from "firebase/firestore";
import { useFinancialsStore } from "@/lib/store/financials";
import { Goal } from "@/types/goal";
import { app } from "@/config/firebase";

const db = getFirestore(app);

export const handleFinancialGoalSave = async (goal: Goal, userId: string) => {
  try {
    const docRef = doc(collection(db, "financial-goals", userId, "goals"));
    await setDoc(docRef, { ...goal, id: docRef.id });
    const newGoal = { id: docRef.id, ...goal };
    useFinancialsStore
      .getState()
      .setFinancialGoals([
        ...useFinancialsStore.getState().financialGoals,
        newGoal,
      ]);
    console.log("Goal saved:", newGoal);
    return newGoal;
  } catch (error) {
    console.error("Error creating goal:", error);
  }
};


export const handleFinancialGoalUpdate = async (
  updatedGoal: Goal,
  id: string,
  userId: string
) => {
  const goalRef = doc(db, "financial-goals", userId, "goals", id);
  await updateDoc(goalRef, updatedGoal);
  const updatedGoals = useFinancialsStore
    .getState()
    .financialGoals.map((goal) =>
      goal.id === id ? { ...goal, ...updatedGoal } : goal
    );
  useFinancialsStore.getState().setFinancialGoals(updatedGoals);
};
