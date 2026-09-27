import { Router, type IRouter } from "express";
import { ScanTextBody, ScanTextResponse } from "@workspace/api-zod";
import { detect } from "../lib/detection";

const router: IRouter = Router();

router.post("/detection/scan", async (req, res): Promise<void> => {
  const parsed = ScanTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { text, trace } = parsed.data;
  const result = await detect(text, trace);
  res.json(
    ScanTextResponse.parse({
      problemId: null,
      ...result,
    }),
  );
});

export default router;
