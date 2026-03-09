import express from "express";
import { 
  deleteChannelById, 
  deleteServerById, 
  getAllChannelByServerId, 
  createChannelByServerId, 
  deleteUserFromServer, 
  createServer, 
  getAllServer, 
  getServer, 
  getServerInviteCode, 
  joinServerWithInviteCode, 
  getAllMembersByServer, 
  getChannelById,
  getAllUsersByServer,
  kickUserFromServer,
  banUserFromServer 
} from "../Controllers/ServerController.js";
import { authenticate } from "../middleware/authentificationJwt.js";

const router = express.Router();

// GET
router.get ("/",authenticate, getAllServer);
router.get ("/members", authenticate, getAllMembersByServer);
router.get ("/channel/:channelId", authenticate, getChannelById);
router.get ("/:id", authenticate, getServer);
router.get ("/:serverId/channels", authenticate, getAllChannelByServerId);
router.get("/:serverId/users", authenticate, getAllUsersByServer);
router.get ("/:id/inviteCode", authenticate, getServerInviteCode);

// DELETE
router.delete ("/:serverId/server", authenticate, deleteServerById);
router.delete ("/:serverId", authenticate, deleteUserFromServer);
router.delete ("/channel/:channelId", authenticate, deleteChannelById);
router.delete ("/:serverId/kick/:userId", authenticate, kickUserFromServer); 

// POST
router.post ("/", authenticate, createServer);
router.post ("/join", authenticate, joinServerWithInviteCode);
router.post ("/:serverId/channels", authenticate, createChannelByServerId);
router.post ("/:serverId/ban/:userId", authenticate, banUserFromServer); // NOUVELLE ROUTE

export default router;