import { AppConfig } from "../../../config/AppConfig";
import { BackendLocal } from "./BackendLocal";

// eslint-disable-next-line no-unused-vars
export function instantiate(_: AppConfig): BackendLocal | null {
    return new BackendLocal();
}