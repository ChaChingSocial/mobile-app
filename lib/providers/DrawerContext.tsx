import { createContext, useState, type PropsWithChildren } from "react";

export const DrawerContext = createContext({
  open: false,
  setOpen: (open: boolean) => {},
});

export function DrawerProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  
  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  );
}