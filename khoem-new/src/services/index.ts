import { Router, type IRouter } from "express";
import healthRouter from "./health";
import advancedToolsRouter from "./advanced-tools";

const router: IRouter = Router();

router.use(healthRouter);
router.use(advancedToolsRouter);

export default router;
