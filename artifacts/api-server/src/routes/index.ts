import { Router, type IRouter } from "express";
import healthRouter from "./health";
import courseRouter from "./course";
import assignmentsRouter from "./assignments";
import practiceRouter from "./practice";
import tutorRouter from "./tutor";
import detectionRouter from "./detection";
import analyticsRouter from "./analytics";
import diagnosticsRouter from "./diagnostics";
import practiceAssignmentsRouter from "./practiceAssignments";
import profileRouter from "./profile";
import { identify } from "../middlewares/identify";

const router: IRouter = Router();

// Health is public so deploy health checks work without a session.
router.use(healthRouter);

// A long-lived anonymous cookie keeps each visitor's progress separate without
// requiring an account or limiting any feature.
router.use(identify);

router.use(courseRouter);
router.use(analyticsRouter);
router.use(profileRouter);
router.use(assignmentsRouter);
router.use(practiceRouter);
router.use(tutorRouter);
router.use(detectionRouter);
router.use(practiceAssignmentsRouter);
router.use(diagnosticsRouter);

export default router;
