import { showHUD } from "@raycast/api";
import { removeActivity } from "../scripts/setRichPresence";

removeActivity();
showHUD("Presence Removed");