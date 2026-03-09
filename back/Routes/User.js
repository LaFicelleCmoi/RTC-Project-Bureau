import express from "express";
import { createUser, getAllUser, getUser, getPrivateMessages } from "../Controllers/UserController.js";
import { authenticate } from "../middleware/authentificationJwt.js"; // Ajout de l'auth

const router = express.Router();

router.get ("/User", getAllUser);
router.get ("/User/:id", getUser);
router.post("/User", createUser);

router.get ("/User/:receiverId/messages", authenticate, getPrivateMessages);

export default router;