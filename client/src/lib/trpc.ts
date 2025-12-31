import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/router-types";

export const trpc = createTRPCReact<AppRouter>();
