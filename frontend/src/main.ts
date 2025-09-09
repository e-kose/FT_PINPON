
import { initializeRouter, router } from "./router/Router"
import "./styles/style.css"
import "./components/forms/SignupForm"
import "./components/forms/LoginForm"
import "./pages/DashboardPage"
import "./components/DashboardComponent"
import "./components/Header"
import "./components/SideBar"
import "./components/Statistics"
import "./components/PlayerList"
import "./components/LastGames"
import "./components/sideBarComponents/Settings"


// Router'ı başlat
initializeRouter();
// Başlangıç sayfasına yönlendir
router.navigate(document.location.pathname || "/signup");

