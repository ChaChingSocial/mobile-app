export type Goal = {
    id?: string;
    title: string;
    group?: string;
    description: string;
    completed: boolean;
    deadline?: string;
    people: { userId: string; username: string }[];
    impact?: string;
    source?: string;
};
