import { createContext } from "react";

export const DrawerContext = createContext({
  open: false,
  setOpen: (open: boolean) => {},
});