import express from "express";
import { getPublicRecord } from "../controllers/publicRecordController.js";

const router = express.Router();

router.get("/:type/:id", getPublicRecord);

export default router;
