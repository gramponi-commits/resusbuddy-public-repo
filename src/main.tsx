import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { clearSessionDatabase } from "./lib/sessionStorage";
import { clearCryptoDatabase } from "./lib/crypto";

const DEBUG_RESET_KEY = "acls-debug-reset-complete";

async function maybeRunDebugReset(): Promise<void> {
	const shouldReset =
		import.meta.env.DEV ||
		import.meta.env.VITE_DEBUG_RESET_ON_FIRST_LAUNCH === "true";

	if (!shouldReset || typeof window === "undefined") {
		return;
	}

	try {
		const alreadyReset = localStorage.getItem(DEBUG_RESET_KEY);
		if (alreadyReset) {
			return;
		}

		localStorage.clear();
		await clearSessionDatabase();
		await clearCryptoDatabase();
		localStorage.setItem(DEBUG_RESET_KEY, new Date().toISOString());
	} catch (error) {
		console.warn("Debug reset failed", error);
	}
}

void maybeRunDebugReset().finally(() => {
	createRoot(document.getElementById("root")!).render(<App />);
});
