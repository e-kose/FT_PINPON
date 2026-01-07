
import { initializeRouter, router } from "./router/Router"
import "./styles/style.css"
import "./components/forms/SignupForm"
import "./components/forms/LoginForm"
import "./pages/DashboardPage"
import "./components/sideBarComponents/Dashboard"
import "./components/utils/Header"
import "./components/utils/SideBar"
import "./components/sideBarComponents/Game/GameStatistics"
import "./components/sideBarComponents/Settings/Settings"
import { handleLogin } from "./services/AuthService"


// Router'ı başlat
initializeRouter();
// Başlangıç sayfasına yönlendir
handleLogin().then(() => {
	router.navigate(document.location.pathname || "/");
});
