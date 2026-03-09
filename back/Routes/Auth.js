import express from "express";
import { login } from "../Controllers/AuthControllers.js";

const router = express.Router();

router.post("/login", login);

export default router;
