
import Index from "./pages/Index";
import CoinsPage from "./pages/CoinsPage";
import APIPage from "./pages/APIPage";
import { Home, Coins, Code } from "lucide-react";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: Home,
    page: <Index />,
  },
  {
    title: "Coins",
    to: "/coins",
    icon: Coins,
    page: <CoinsPage />,
  },
  {
    title: "API",
    to: "/api",
    icon: Code,
    page: <APIPage />,
  },
];
