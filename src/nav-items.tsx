
import { HomeIcon, CreditCard, ArrowLeftRight, Bell, User, Server, Wallet } from "lucide-react";
import Index from "./pages/Index";
import CoinsPage from "./pages/CoinsPage";
import { TransfersPage } from "./components/transfers/TransfersPage";
import { NotificationsList } from "./components/notifications/NotificationsList";
import { UserProfile } from "./components/profile/UserProfile";
import APIPage from "./pages/APIPage";
import CardsPage from "./pages/CardsPage";
import HappyPaisaPage from "./pages/HappyPaisaPage";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Cards",
    to: "/cards",
    icon: <CreditCard className="h-4 w-4" />,
    page: <CardsPage />,
  },
  {
    title: "Coins",
    to: "/coins",
    icon: <CreditCard className="h-4 w-4" />,
    page: <CoinsPage />,
  },
  {
    title: "Transfers",
    to: "/transfers",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    page: <TransfersPage />,
  },
  {
    title: "Happy Paisa",
    to: "/happy-paisa",
    icon: <Wallet className="h-4 w-4" />,
    page: <HappyPaisaPage />,
  },
  {
    title: "Notifications",
    to: "/notifications",
    icon: <Bell className="h-4 w-4" />,
    page: <NotificationsList />,
  },
  {
    title: "Profile",
    to: "/profile",
    icon: <User className="h-4 w-4" />,
    page: <UserProfile />,
  },
  {
    title: "API",
    to: "/api",
    icon: <Server className="h-4 w-4" />,
    page: <APIPage />,
  },
];
