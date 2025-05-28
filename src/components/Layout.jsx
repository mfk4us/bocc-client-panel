import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { useUI } from "../context/UIContext";
import { Outlet } from "react-router-dom";

export default function Layout({ language, ...props }) {
  const { showSidebar, showBottomNav, unreadMessages, unreadNotifications } = useUI();
  const { isMobile } = props;
  return (
    <div className="flex min-h-screen">
      {showSidebar && !isMobile && (
        <Sidebar
          language={language}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
          {...props}
        />
      )}
      <main className="flex-1 flex flex-col relative min-h-0 w-full">
        <Outlet />
        {showBottomNav && isMobile && (
          <BottomNav
            language={language}
            unreadMessages={unreadMessages}
            unreadNotifications={unreadNotifications}
            {...props}
          />
        )}
      </main>
    </div>
  );
}