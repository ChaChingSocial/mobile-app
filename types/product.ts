export type Product = {
    id: number;
    title: string;
    description: string;
    price: number;
    images: [];
    creatorUserId: string;
    userLikes: string[];
    tags: string[];
    isDigital: boolean;
};
