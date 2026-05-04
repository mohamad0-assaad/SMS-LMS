import express from "express";
import { protect } from "../middleware/auth.ts";
import { globalSearch } from "../controllers/search.ts";

const searchRouter = express.Router();

searchRouter.get("/", protect, globalSearch);

export default searchRouter;
