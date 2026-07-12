import { Toaster } from "react-hot-toast";
import AuthBootstrap from "./components/AuthBootstrap";
import AppRouter from "./routes/AppRouter";

export default function App() {
  return (
    <AuthBootstrap>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#000000",
            border: "1px solid #e5e5e5",
          },
        }}
      />
    </AuthBootstrap>
  );
}
